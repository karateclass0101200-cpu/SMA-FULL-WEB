from flask import Flask, request, jsonify, session, render_template
import sqlite3
import requests
from dotenv import load_dotenv
from datetime import datetime
from werkzeug.security import check_password_hash, generate_password_hash
import os
load_dotenv()
app = Flask(__name__)
app.secret_key = os.environ.get(
    "SECRET_KEY",
    "local-development-secret-key"
)
EMAIL_ADDRESS = os.environ.get("EMAIL_ADDRESS")
RESEND_API_KEY = os.environ.get("RESEND_API_KEY")

DATABASE = "database.db"
def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

# =========================================================
# DATABASE
# =========================================================

def send_email(to_email, subject, body):

    if not to_email:
        return False

    if not RESEND_API_KEY:
        print("EMAIL ERROR: RESEND_API_KEY is not configured.")
        return False

    if not EMAIL_ADDRESS:
        print("EMAIL ERROR: EMAIL_ADDRESS is not configured.")
        return False

    try:

        response = requests.post(
            "https://api.resend.com/emails",

            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json"
            },

            json={
                "from": EMAIL_ADDRESS,
                "to": [to_email],
                "subject": subject,
                "text": body
            },

            timeout=15
        )

        if response.ok:

            print("EMAIL SENT:", to_email)

            return True

        print(
            "EMAIL ERROR:",
            response.status_code,
            response.text
        )

        return False

    except Exception as e:

        print(
            "EMAIL ERROR:",
            repr(e)
        )

        return False
@app.route("/api/debug/messages")
def debug_messages():

    conn = get_db()

    try:

        columns = conn.execute("""
            PRAGMA table_info(messages)
        """).fetchall()

        return jsonify({
            "success": True,
            "columns": [
                {
                    "name": column["name"],
                    "type": column["type"],
                    "notnull": column["notnull"],
                    "default": column["dflt_value"]
                }
                for column in columns
            ]
        })

    finally:

        conn.close()
@app.route("/api/student/messages", methods=["POST"])
def send_student_message():

    if "user_id" not in session:
        return jsonify({
            "success": False,
            "message": "Please login first."
        }), 401

    if session.get("role") != "STUDENT":
        return jsonify({
            "success": False,
            "message": "Student access required."
        }), 403

    data = request.get_json() or {}

    receiver_id = (data.get("receiver_id") or "").strip()
    message = (data.get("message") or "").strip()

    if not message:
        return jsonify({
            "success": False,
            "message": "Please enter your message."
        }), 400

    conn = get_db()

    try:

        # Find Admin
        admin = conn.execute("""
            SELECT user_id
            FROM users
            WHERE role = 'ADMIN'
              AND status = 'ACTIVE'
            ORDER BY id
            LIMIT 1
        """).fetchone()

        if not admin:
            return jsonify({
                "success": False,
                "message": "Admin account not found."
            }), 404

        # Save message
        conn.execute("""
            INSERT INTO messages (
                sender_id,
                receiver_id,
                subject,
                message,
                status
            )
            VALUES (?, ?, ?, ?, ?)
        """, (
            session["user_id"],
            admin["user_id"],
            "Message from Student",
            message,
            "NEW"
        ))

        conn.commit()

        return jsonify({
            "success": True,
            "message": "Message sent successfully to Admin."
        })

    except Exception as error:

        conn.rollback()

        print(
            "SEND STUDENT MESSAGE ERROR:",
            repr(error)
        )

        return jsonify({
            "success": False,
            "message": "Unable to send message."
        }), 500

    finally:

        conn.close()

@app.route("/api/test-messages-table")
def test_messages_table():

    conn = get_db()

    try:
        row = conn.execute("""
            SELECT name
            FROM sqlite_master
            WHERE type = 'table'
            AND name = 'messages'
        """).fetchone()

        if row:
            return jsonify({
                "success": True,
                "message": "messages table EXISTS"
            })

        return jsonify({
            "success": False,
            "message": "messages table DOES NOT EXIST"
        })

    finally:
        conn.close()      
# =========================================================
# ADMIN MESSAGES
# =========================================================

@app.route("/api/admin/messages", methods=["GET"])
def get_admin_messages():

    if "user_id" not in session:
        return jsonify({
            "success": False,
            "message": "Please login first."
        }), 401

    if session.get("role") != "ADMIN":
        return jsonify({
            "success": False,
            "message": "Admin access required."
        }), 403

    conn = get_db()

    try:

        messages = conn.execute("""
            SELECT
                m.id,
                m.sender_id,
                m.receiver_id,
                m.subject,
                m.message,
                m.status,
                m.created_at,

                COALESCE(
                    s.full_name,
                    tm.full_name,
                    m.sender_id
                ) AS sender_name

            FROM messages m

            LEFT JOIN students s
                ON s.user_id = m.sender_id

            LEFT JOIN timing_masters tm
                ON tm.user_id = m.sender_id

            WHERE m.receiver_id = ?

            ORDER BY m.id DESC

        """, (session["user_id"],)).fetchall()


        return jsonify({
            "success": True,
            "messages": [
                dict(message)
                for message in messages
            ]
        })


    except Exception as error:

        print(
            "GET ADMIN MESSAGES ERROR:",
            repr(error)
        )

        return jsonify({
            "success": False,
            "message": "Unable to load messages."
        }), 500


    finally:

        conn.close()


@app.route("/admission")
def admission():
    return render_template("admission.html")
# =========================================================
# HOME
# =========================================================

@app.route("/")
def home():
    return render_template("index.html")


# =========================================================
# LOGIN PAGE
# =========================================================

@app.route("/login")
def login_page():
    return render_template("login.html")


# =========================================================
# LOGIN API
# =========================================================

@app.route("/api/login", methods=["POST"])
def login():

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "Invalid request."
        }), 400

    user_id = data.get("user_id", "").strip()
    password = data.get("password", "")

    if not user_id or not password:
        return jsonify({
            "success": False,
            "message": "Please enter User ID and Password."
        }), 400

    conn = get_db()

    user = conn.execute(
        """
        SELECT
            id,
            user_id,
            password_hash,
            role,
            status
        FROM users
        WHERE user_id = ?
        """,
        (user_id,)
    ).fetchone()

    conn.close()

    if user is None:
        return jsonify({
            "success": False,
            "message": "Invalid User ID or password."
        }), 401

    if user["status"] != "ACTIVE":
        return jsonify({
            "success": False,
            "message": "Your account is inactive. Contact Admin."
        }), 403

    if not check_password_hash(
        user["password_hash"],
        password
    ):
        return jsonify({
            "success": False,
            "message": "Invalid User ID or password."
        }), 401

    session["user_id"] = user["user_id"]
    session["role"] = user["role"]

    return jsonify({
        "success": True,
        "user_id": user["user_id"],
        "role": user["role"]
    })


# =========================================================
# CURRENT USER
# =========================================================

@app.route("/api/me")
def current_user():

    if "user_id" not in session:
        return jsonify({
            "logged_in": False
        }), 401

    return jsonify({
        "logged_in": True,
        "user_id": session["user_id"],
        "role": session["role"]
    })


# =========================================================
# LOGOUT
# =========================================================

@app.route("/api/logout", methods=["POST"])
def logout():

    session.clear()

    return jsonify({
        "success": True
    })
@app.route("/api/admission", methods=["POST"])
def submit_admission():

    try:
        full_name = request.form.get("full_name", "").strip()
        dob = request.form.get("dob", "").strip()
        gender = request.form.get("gender", "").strip()
        student_mobile = request.form.get("student_mobile", "").strip()
        email = request.form.get("email", "").strip()

        parent_name = request.form.get("parent_name", "").strip()
        parent_mobile = request.form.get("parent_mobile", "").strip()
        emergency_contact = request.form.get("emergency_contact", "").strip()
        address = request.form.get("address", "").strip()

        experience = request.form.get("experience", "").strip()
        previous_training = request.form.get(
            "previous_training", ""
        ).strip()

       
        # -----------------------------
        # VALIDATION
        # -----------------------------

        if not full_name:
            return jsonify({
                "success": False,
                "message": "Full Name is required."
            }), 400

        if not dob:
            return jsonify({
                "success": False,
                "message": "Date of Birth is required."
            }), 400

        if not gender:
            return jsonify({
                "success": False,
                "message": "Gender is required."
            }), 400

        if not student_mobile:
            return jsonify({
                "success": False,
                "message": "Student Mobile is required."
            }), 400

        if not email:
            return jsonify({
                "success": False,
                "message": "Email is required."
            }), 400

        if not parent_name:
            return jsonify({
                "success": False,
                "message": "Parent / Guardian Name is required."
            }), 400

        if not parent_mobile:
            return jsonify({
                "success": False,
                "message": "Parent Mobile is required."
            }), 400

        if not emergency_contact:
            return jsonify({
                "success": False,
                "message": "Emergency Contact is required."
            }), 400

        if not address:
            return jsonify({
                "success": False,
                "message": "Address is required."
            }), 400

        if not experience:
            return jsonify({
                "success": False,
                "message": "Experience is required."
            }), 400

        # -----------------------------
        # SAVE APPLICATION
        # -----------------------------

        conn = get_db()

        # Generate Application ID
        last_app = conn.execute("""
            SELECT application_id
            FROM applications
            ORDER BY id DESC
            LIMIT 1
        """).fetchone()

        if last_app and last_app["application_id"]:
            try:
                last_number = int(
                    last_app["application_id"].replace("APP-", "")
                )
            except ValueError:
                last_number = 0
        else:
            last_number = 0

        application_id = f"APP-{last_number + 1:04d}"

        # Save application
        cursor = conn.execute("""
            INSERT INTO applications
            (
                application_id,
                full_name,
                dob,
                gender,
                student_mobile,
                email,
                parent_name,
                parent_mobile,
                emergency_contact,
                address,
                experience,
                previous_training,
                status,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)
        """, (
            application_id,
            full_name,
            dob,
            gender,
            student_mobile,
            email,
            parent_name,
            parent_mobile,
            emergency_contact,
            address,
            experience,
            previous_training,
            datetime.now().isoformat(timespec="seconds")
        ))

        conn.commit()
        conn.close()

        return jsonify({
            "success": True,
            "message": "Application submitted successfully.",
            "application": {
                "application_id": application_id,
                "status": "PENDING"
            }
        })

    except Exception as e:
        print("APPLICATION SUBMIT ERROR:", repr(e))

        try:
            conn.rollback()
            conn.close()
        except:
            pass

        return jsonify({
            "success": False,
            "message": "Unable to submit application."
        }), 500


@app.route("/api/admin/students", methods=["POST"])
def add_student():

    if "user_id" not in session:
        return jsonify({
            "success": False,
            "message": "Please login first."
        }), 401

    if session.get("role") != "ADMIN":
        return jsonify({
            "success": False,
            "message": "Admin access required."
        }), 403

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "Invalid request."
        }), 400

    full_name = data.get("full_name", "").strip()
    dob = data.get("dob", "").strip()
    gender = data.get("gender", "").strip()
    student_mobile = data.get("student_mobile", "").strip()
    email = data.get("email", "").strip()

    if not full_name or not dob or not gender or not student_mobile:
        return jsonify({
            "success": False,
            "message": "Full Name, DOB, Gender and Mobile are required."
        }), 400

    conn = get_db()

    try:
        # Generate next Student User ID
        row = conn.execute("""
            SELECT user_id
            FROM users
            WHERE user_id LIKE 'SMAU%'
            ORDER BY id DESC
            LIMIT 1
        """).fetchone()

        if row:
            try:
                last_number = int(
                    row["user_id"].replace("SMAU", "")
                )
            except ValueError:
                last_number = 0
        else:
            last_number = 0

        new_number = last_number + 1

        student_user_id = f"SMAU{new_number:06d}"

        # Generate Registration Number
        year = datetime.now().year

        count_row = conn.execute("""
            SELECT COUNT(*) AS total
            FROM students
            WHERE registration_number LIKE ?
        """, (f"SMA-{year}-%",)).fetchone()

        registration_number = (
            f"SMA-{year}-{count_row['total'] + 1:03d}"
        )

        temporary_password = "student@123"
        password_hash = generate_password_hash(temporary_password)

        # Create user account
        conn.execute("""
            INSERT INTO users
            (user_id, password_hash, role, status)
            VALUES (?, ?, 'STUDENT', 'ACTIVE')
        """, (
            student_user_id,
            password_hash
        ))

        # Create student profile
        conn.execute("""
            INSERT INTO students
            (
                user_id,
                registration_number,
                full_name,
                dob,
                gender,
                student_mobile,
                email,
                status,
                profile_completed,
                student_profile_edited
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 0, 0)
        """, (
            student_user_id,
            registration_number,
            full_name,
            dob,
            gender,
            student_mobile,
            email
        ))

        conn.commit()

        return jsonify({
            "success": True,
            "message": "Student created successfully.",
            "student": {
                "user_id": student_user_id,
                "registration_number": registration_number,
                "temporary_password": temporary_password,
                "full_name": full_name
            }
        })

    except sqlite3.IntegrityError as e:
        conn.rollback()

        print("ADD STUDENT DATABASE ERROR:", repr(e))

        return jsonify({
            "success": False,
            "message": str(e)
        }), 400

    except Exception as e:
        conn.rollback()

        print("ADD STUDENT ERROR:", repr(e))

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        conn.close()
@app.route("/api/admin/students", methods=["GET"])
def get_admin_students():

    if "user_id" not in session:
        return jsonify({
            "success": False,
            "message": "Please login first."
        }), 401

    if session.get("role") != "ADMIN":
        return jsonify({
            "success": False,
            "message": "Admin access required."
        }), 403

    conn = get_db()

    try:
        students = conn.execute("""
            SELECT
                id,
                user_id,
                registration_number,
                full_name,
                dob,
                gender,
                student_mobile,
                email,
                parent_name,
                parent_mobile,
                emergency_contact,
                address,
                experience,
                previous_training,
                photo_path,
                status
            FROM students
            ORDER BY id DESC
        """).fetchall()

        student_list = []

        for student in students:

            # Calculate attendance percentage
            attendance = conn.execute("""
                SELECT
                    COUNT(*) AS total_days,
                    SUM(
                        CASE
                            WHEN UPPER(TRIM(status)) = 'PRESENT'
                            THEN 1
                            ELSE 0
                        END
                    ) AS present_days
                FROM attendance
                WHERE student_id = ?
            """, (student["id"],)).fetchone()

            total_days = attendance["total_days"] or 0
            present_days = attendance["present_days"] or 0

            if total_days > 0:
                attendance_percentage = round(
                    (present_days / total_days) * 100,
                    2
                )
            else:
                attendance_percentage = 0

            student_list.append({
                "id": student["id"],
                "user_id": student["user_id"],
                "registration_number": student["registration_number"],
                "full_name": student["full_name"],
                "dob": student["dob"],
                "gender": student["gender"],
                "student_mobile": student["student_mobile"],
                "email": student["email"],
                "parent_name": student["parent_name"],
                "parent_mobile": student["parent_mobile"],
                "emergency_contact": student["emergency_contact"],
                "address": student["address"],
                "experience": student["experience"],
                "previous_training": student["previous_training"],
                "photo_path": student["photo_path"],
                "status": student["status"],
                "attendance_percentage": attendance_percentage
            })

        return jsonify({
            "success": True,
            "students": student_list
        })

    except Exception as e:

        print("GET STUDENTS ERROR:", repr(e))

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        conn.close()
@app.route("/api/admin/applications", methods=["GET"])
def get_admin_applications():

    if "user_id" not in session:
        return jsonify({
            "success": False,
            "message": "Please login first."
        }), 401

    if session.get("role") != "ADMIN":
        return jsonify({
            "success": False,
            "message": "Admin access required."
        }), 403

    conn = get_db()

    try:
        applications = conn.execute("""
            SELECT
                id,
                application_id,
                full_name,
                dob,
                gender,
                student_mobile,
                email,
                parent_name,
                parent_mobile,
                emergency_contact,
                address,
                experience,
                previous_training,
                status,
                created_at
            FROM applications
            ORDER BY id DESC
        """).fetchall()

        application_list = []

        for application in applications:
            application_list.append({
                "id": application["id"],
                "application_id": application["application_id"],
                "full_name": application["full_name"],
                "dob": application["dob"],
                "gender": application["gender"],
                "student_mobile": application["student_mobile"],
                "email": application["email"],
                "parent_name": application["parent_name"],
                "parent_mobile": application["parent_mobile"],
                "emergency_contact": application["emergency_contact"],
                "address": application["address"],
                "experience": application["experience"],
                "previous_training": application["previous_training"],
                "status": application["status"],
                "created_at": application["created_at"]
            })

        pending_count = sum(
            1
            for application in application_list
            if application["status"] == "PENDING"
        )

        return jsonify({
            "success": True,
            "applications": application_list,
            "pending_count": pending_count
        })

    except Exception as e:

        print("GET APPLICATIONS ERROR:", repr(e))

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        conn.close()

@app.route("/api/admin/applications/<application_id>", methods=["GET"])
def get_application_details(application_id):

    if "user_id" not in session:
        return jsonify({
            "success": False,
            "message": "Please login first."
        }), 401

    if session.get("role") != "ADMIN":
        return jsonify({
            "success": False,
            "message": "Admin access required."
        }), 403

    conn = get_db()

    try:
        application = conn.execute("""
            SELECT
                id,
                application_id,
                full_name,
                dob,
                gender,
                student_mobile,
                email,
                parent_name,
                parent_mobile,
                emergency_contact,
                address,
                experience,
                previous_training,
                status,
                created_at
            FROM applications
            WHERE application_id = ?
        """, (application_id,)).fetchone()

        if not application:
            return jsonify({
                "success": False,
                "message": "Application not found."
            }), 404

        return jsonify({
            "success": True,
            "application": {
                "id": application["id"],
                "application_id": application["application_id"],
                "full_name": application["full_name"],
                "dob": application["dob"],
                "gender": application["gender"],
                "student_mobile": application["student_mobile"],
                "email": application["email"],
                "parent_name": application["parent_name"],
                "parent_mobile": application["parent_mobile"],
                "emergency_contact": application["emergency_contact"],
                "address": application["address"],
                "experience": application["experience"],
                "previous_training": application["previous_training"],
                "status": application["status"],
                "created_at": application["created_at"]
            }
        })

    except Exception as e:
        print("GET APPLICATION DETAILS ERROR:", repr(e))

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        conn.close()
@app.route("/api/admin/applications/<application_id>/decision", methods=["POST"])
def application_decision(application_id):

    if "user_id" not in session:
        return jsonify({
            "success": False,
            "message": "Please login first."
        }), 401

    if session.get("role") != "ADMIN":
        return jsonify({
            "success": False,
            "message": "Admin access required."
        }), 403

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "Invalid request."
        }), 400

    decision = data.get("decision", "").upper()

    if decision not in ["ACCEPT", "REJECT"]:
        return jsonify({
            "success": False,
            "message": "Invalid decision."
        }), 400

    conn = get_db()

    try:

        application = conn.execute("""
            SELECT *
            FROM applications
            WHERE application_id = ?
        """, (application_id,)).fetchone()

        if not application:
            return jsonify({
                "success": False,
                "message": "Application not found."
            }), 404

        if application["status"] != "PENDING":
            return jsonify({
                "success": False,
                "message": "Application has already been reviewed."
            }), 400

        # =========================
        # REJECT APPLICATION
        # =========================

        if decision == "REJECT":

            conn.execute("""
                UPDATE applications
                SET status = 'REJECTED',
                    reviewed_at = ?
                WHERE application_id = ?
            """, (
                datetime.now().isoformat(timespec="seconds"),
                application_id
            ))

            conn.commit()

            return jsonify({
                "success": True,
                "message": "Application rejected successfully.",
                "decision": "REJECTED"
            })


        # =========================
        # ACCEPT APPLICATION
        # =========================

        # Generate Student User ID
        row = conn.execute("""
            SELECT user_id
            FROM users
            WHERE user_id LIKE 'SMAU%'
            ORDER BY id DESC
            LIMIT 1
        """).fetchone()

        if row:
            try:
                last_number = int(
                    row["user_id"].replace("SMAU", "")
                )
            except ValueError:
                last_number = 0
        else:
            last_number = 0

        student_user_id = f"SMAU{last_number + 1:06d}"


        # Generate Registration Number
        year = datetime.now().year

        count_row = conn.execute("""
            SELECT COUNT(*) AS total
            FROM students
            WHERE registration_number LIKE ?
        """, (f"SMA-{year}-%",)).fetchone()

        registration_number = (
            f"SMA-{year}-{count_row['total'] + 1:03d}"
        )


        # Temporary password
        temporary_password = "student@123"

        password_hash = generate_password_hash(
            temporary_password
        )


        # Create student login account
        conn.execute("""
            INSERT INTO users
            (
                user_id,
                password_hash,
                role,
                status
            )
            VALUES (?, ?, 'STUDENT', 'ACTIVE')
        """, (
            student_user_id,
            password_hash
        ))


        # Create student profile
        conn.execute("""
            INSERT INTO students
            (
                user_id,
                registration_number,
                full_name,
                dob,
                gender,
                student_mobile,
                email,
                parent_name,
                parent_mobile,
                emergency_contact,
                address,
                experience,
                previous_training,
                photo_path,
                status,
                profile_completed,
                student_profile_edited
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 0, 0)
        """, (
            student_user_id,
            registration_number,
            application["full_name"],
            application["dob"],
            application["gender"],
            application["student_mobile"],
            application["email"],
            application["parent_name"],
            application["parent_mobile"],
            application["emergency_contact"],
            application["address"],
            application["experience"],
            application["previous_training"],
            application["photo_path"]
        ))


        # Update application
        conn.execute("""
            UPDATE applications
            SET status = 'ACCEPTED',
                registration_number = ?,
                reviewed_at = ?
            WHERE application_id = ?
        """, (
            registration_number,
            datetime.now().isoformat(timespec="seconds"),
            application_id
        ))
        conn.commit()

        # Send acceptance email
        email_sent = send_email(
            application["email"],
            "Sanjay Martial Arts Academy - Application Accepted",
            f"""Dear {application["full_name"]},

Your application has been accepted by
Sanjay Martial Arts Academy.

Student Login Details

User ID: {student_user_id}
Registration Number: {registration_number}
Temporary Password: {temporary_password}

Please use these credentials to login to the student portal.

Regards,
Sanjay Martial Arts Academy
"""
        )

        return jsonify({
            "success": True,
            "message": "Application accepted successfully.",
            "decision": "ACCEPTED",
            "email_sent": email_sent,
            "student": {
                "user_id": student_user_id,
                "registration_number": registration_number,
                "temporary_password": temporary_password,
                "full_name": application["full_name"]
            }
        })


    except sqlite3.IntegrityError as e:

        conn.rollback()

        print(
            "APPLICATION DECISION DATABASE ERROR:",
            repr(e)
        )

        return jsonify({
            "success": False,
            "message": str(e)
        }), 400


    except Exception as e:

        conn.rollback()

        print(
            "APPLICATION DECISION ERROR:",
            repr(e)
        )

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


    finally:

        conn.close()

# =========================================================
# STUDENT PROFILE
# =========================================================

# ---------------------------------------------------------
# GET STUDENT PROFILE
# ---------------------------------------------------------

@app.route("/api/student/profile", methods=["GET"])
def get_student_profile():

    if "user_id" not in session:
        return jsonify({
            "success": False,
            "message": "Please login first."
        }), 401

    if session.get("role") != "STUDENT":
        return jsonify({
            "success": False,
            "message": "Access denied."
        }), 403

    user_id = session["user_id"]

    conn = get_db()

    student = conn.execute(
        """
        SELECT
            user_id,
            registration_number,
            full_name,
            dob,
            gender,
            student_mobile,
            email,
            parent_name,
            parent_mobile,
            emergency_contact,
            address,
            experience,
            previous_training,
            photo_path,
            status,
            profile_completed,
            student_profile_edited
        FROM students
        WHERE user_id = ?
        """,
        (user_id,)
    ).fetchone()

    conn.close()

    if student is None:
        return jsonify({
            "success": False,
            "message": "Student profile not found."
        }), 404

    return jsonify({
        "success": True,
        "profile": dict(student)
    })


# ---------------------------------------------------------
# STUDENT FIRST-TIME PROFILE UPDATE
# ---------------------------------------------------------

@app.route("/api/student/profile", methods=["POST"])
def save_student_profile():

    if "user_id" not in session:
        return jsonify({
            "success": False,
            "message": "Please login first."
        }), 401

    if session.get("role") != "STUDENT":
        return jsonify({
            "success": False,
            "message": "Access denied."
        }), 403

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "Invalid request."
        }), 400

    user_id = session["user_id"]

    conn = get_db()

    student = conn.execute(
        """
        SELECT
            id,
            student_profile_edited
        FROM students
        WHERE user_id = ?
        """,
        (user_id,)
    ).fetchone()

    if student is None:
        conn.close()

        return jsonify({
            "success": False,
            "message": "Student profile not found."
        }), 404

    # -----------------------------------------------------
    # Student can edit only ONE TIME
    # -----------------------------------------------------

    if student["student_profile_edited"] == 1:

        conn.close()

        return jsonify({
            "success": False,
            "message": "Your profile has already been updated once. Please contact Admin or Timing Master for further changes."
        }), 403

    # -----------------------------------------------------
    # Only student-editable fields are updated
    # -----------------------------------------------------

    conn.execute(
        """
        UPDATE students
        SET
            student_mobile = ?,
            email = ?,
            parent_name = ?,
            parent_mobile = ?,
            emergency_contact = ?,
            address = ?,
            profile_completed = 1,
            student_profile_edited = 1
        WHERE user_id = ?
        """,
        (
            data.get("student_mobile", "").strip(),
            data.get("email", "").strip(),
            data.get("parent_name", "").strip(),
            data.get("parent_mobile", "").strip(),
            data.get("emergency_contact", "").strip(),
            data.get("address", "").strip(),
            user_id
        )
    )

    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "message": "Profile saved successfully. Further changes require Admin or Timing Master permission."
    })


# =========================================================
# ADMIN / TIMING MASTER STUDENT PROFILE UPDATE
# =========================================================

@app.route("/api/staff/student/<student_user_id>/profile", methods=["POST"])
def staff_update_student_profile(student_user_id):

    if "user_id" not in session:
        return jsonify({
            "success": False,
            "message": "Please login first."
        }), 401

    role = session.get("role")

    # Admin and Timing Master only
    if role not in ["ADMIN", "TIMING_MASTER"]:
        return jsonify({
            "success": False,
            "message": "Access denied."
        }), 403

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "Invalid request."
        }), 400

    conn = get_db()

    student = conn.execute(
        """
        SELECT id
        FROM students
        WHERE user_id = ?
        """,
        (student_user_id,)
    ).fetchone()

    if student is None:
        conn.close()

        return jsonify({
            "success": False,
            "message": "Student not found."
        }), 404
    #STUDENT 360#
@app.route("/api/staff/student360/<int:student_id>", methods=["GET"])
def get_staff_student360(student_id):

    if "user_id" not in session:
        return jsonify({
            "success": False,
            "message": "Please login first."
        }), 401

    if session.get("role") != "TIMING_MASTER":
        return jsonify({
            "success": False,
            "message": "Staff access required."
        }), 403

    conn = get_db()

    try:

        student = conn.execute("""
            SELECT
                id,
                user_id,
                registration_number,
                full_name,
                dob,
                gender,
                student_mobile,
                email,
                parent_name,
                parent_mobile,
                emergency_contact,
                address,
                experience,
                previous_training,
                photo_path,
                status
            FROM students
            WHERE id = ?
        """, (student_id,)).fetchone()

        if not student:

            return jsonify({
                "success": False,
                "message": "Student not found."
            }), 404


        attendance = conn.execute("""
            SELECT
                COUNT(*) AS total_days,
                SUM(
                    CASE
                        WHEN UPPER(TRIM(status)) = 'PRESENT'
                        THEN 1
                        ELSE 0
                    END
                ) AS present_days
            FROM attendance
            WHERE student_id = ?
        """, (student_id,)).fetchone()


        total_days = attendance["total_days"] or 0
        present_days = attendance["present_days"] or 0


        if total_days > 0:

            attendance_percentage = round(
                (present_days / total_days) * 100,
                2
            )

        else:

            attendance_percentage = 0


        return jsonify({
            "success": True,

            "student": {
                "id": student["id"],
                "user_id": student["user_id"],
                "registration_number":
                    student["registration_number"],
                "full_name": student["full_name"],
                "dob": student["dob"],
                "gender": student["gender"],
                "student_mobile":
                    student["student_mobile"],
                "email": student["email"],
                "parent_name":
                    student["parent_name"],
                "parent_mobile":
                    student["parent_mobile"],
                "emergency_contact":
                    student["emergency_contact"],
                "address":
                    student["address"],
                "experience":
                    student["experience"],
                "previous_training":
                    student["previous_training"],
                "photo_path":
                    student["photo_path"],
                "status":
                    student["status"],
                "attendance_percentage":
                    attendance_percentage
            }
        })

    except Exception as error:

        print(
            "STAFF STUDENT 360 ERROR:",
            repr(error)
        )

        return jsonify({
            "success": False,
            "message": "Unable to load student profile."
        }), 500

    finally:
        conn.close()
    # -----------------------------------------------------
    # Admin / Timing Master can update whenever required
    # -----------------------------------------------------

    conn.execute(
        """
        UPDATE students
        SET
            full_name = ?,
            dob = ?,
            gender = ?,
            student_mobile = ?,
            email = ?,
            parent_name = ?,
            parent_mobile = ?,
            emergency_contact = ?,
            address = ?,
            experience = ?,
            previous_training = ?,
        WHERE user_id = ?
        """,
        (
            data.get("full_name", "").strip(),
            data.get("dob", "").strip(),
            data.get("gender", "").strip(),
            data.get("student_mobile", "").strip(),
            data.get("email", "").strip(),
            data.get("parent_name", "").strip(),
            data.get("parent_mobile", "").strip(),
            data.get("emergency_contact", "").strip(),
            data.get("address", "").strip(),
            data.get("experience", "").strip(),
            data.get("previous_training", "").strip(),
            student_user_id
        )
    )

    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "message": "Student profile updated successfully."
    })


# =========================================================
# CHANGE PASSWORD
# =========================================================

@app.route("/api/change-password", methods=["POST"])
def change_password():

    if "user_id" not in session:
        return jsonify({
            "success": False,
            "message": "Please login first."
        }), 401

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "Invalid request."
        }), 400

    current_password = data.get("current_password", "")
    new_password = data.get("new_password", "")
    confirm_password = data.get("confirm_password", "")

    if not current_password or not new_password or not confirm_password:
        return jsonify({
            "success": False,
            "message": "All password fields are required."
        }), 400

    if new_password != confirm_password:
        return jsonify({
            "success": False,
            "message": "New passwords do not match."
        }), 400

    if len(new_password) < 8:
        return jsonify({
            "success": False,
            "message": "New password must contain at least 8 characters."
        }), 400

    user_id = session["user_id"]

    conn = get_db()

    user = conn.execute(
        """
        SELECT password_hash
        FROM users
        WHERE user_id = ?
        """,
        (user_id,)
    ).fetchone()

    if user is None:
        conn.close()

        return jsonify({
            "success": False,
            "message": "User account not found."
        }), 404

    if not check_password_hash(
        user["password_hash"],
        current_password
    ):
        conn.close()

        return jsonify({
            "success": False,
            "message": "Current password is incorrect."
        }), 401

    if check_password_hash(
        user["password_hash"],
        new_password
    ):
        conn.close()

        return jsonify({
            "success": False,
            "message": "New password must be different from current password."
        }), 400

    new_password_hash = generate_password_hash(new_password)

    conn.execute(
        """
        UPDATE users
        SET password_hash = ?
        WHERE user_id = ?
        """,
        (
            new_password_hash,
            user_id
        )
    )

    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "message": "Password changed successfully."
    })

# =========================================================
# ATTENDANCE API
# =========================================================
@app.route("/api/staff/students", methods=["GET"])
def get_staff_students():

    if "user_id" not in session:
        return jsonify({
            "success": False,
            "message": "Please login first."
        }), 401

    if session["role"] not in ["ADMIN", "TIMING_MASTER"]:
        return jsonify({
            "success": False,
            "message": "Access denied."
        }), 403

    conn = get_db()

    try:

        students = conn.execute("""
            SELECT
                id,
                user_id,
                registration_number,
                full_name,
                gender,
                student_mobile,
                email,
                photo_path,
                status
            FROM students
            WHERE status = 'ACTIVE'
            ORDER BY full_name
        """).fetchall()

        student_list = []

        for student in students:

            attendance = conn.execute("""
                SELECT
                    COUNT(*) AS total_days,
                    SUM(
                        CASE
                            WHEN UPPER(TRIM(status)) = 'PRESENT'
                            THEN 1
                            ELSE 0
                        END
                    ) AS present_days
                FROM attendance
                WHERE student_id = ?
            """, (student["id"],)).fetchone()

            total_days = attendance["total_days"] or 0
            present_days = attendance["present_days"] or 0

            if total_days > 0:
                attendance_percentage = round(
                    (present_days / total_days) * 100,
                    2
                )
            else:
                attendance_percentage = 0

            student_list.append({
                "id": student["id"],
                "user_id": student["user_id"],
                "registration_number": student["registration_number"],
                "full_name": student["full_name"],
                "gender": student["gender"],
                "student_mobile": student["student_mobile"],
                "email": student["email"],
                "photo_path": student["photo_path"],
                "status": student["status"],
                "attendance_percentage": attendance_percentage
            })

        return jsonify({
            "success": True,
            "students": student_list
        })

    except Exception as error:

        print(
            "GET STAFF STUDENTS ERROR:",
            repr(error)
        )

        return jsonify({
            "success": False,
            "message": "Unable to load students."
        }), 500

    finally:
        conn.close()

@app.route("/api/staff/attendance", methods=["GET"])
def get_staff_attendance():

    if "user_id" not in session:
        return jsonify({
            "success": False,
            "message": "Please login first."
        }), 401

    if session.get("role") not in [
        "ADMIN",
        "TIMING_MASTER"
    ]:
        return jsonify({
            "success": False,
            "message": "Access denied."
        }), 403

    attendance_date = request.args.get("date")

    if not attendance_date:
        return jsonify({
            "success": False,
            "message": "Date is required."
        }), 400

    conn = get_db()

    try:

        students = conn.execute("""
            SELECT
                s.id,
                s.user_id,
                s.registration_number,
                s.full_name,
                s.email,
                COALESCE(
                    a.status,
                    ''
                ) AS attendance_status

            FROM students s

            LEFT JOIN attendance a
                ON a.student_id = s.id
                AND a.attendance_date = ?

            WHERE s.status = 'ACTIVE'

            ORDER BY s.full_name

        """, (attendance_date,)).fetchall()

        return jsonify({
            "success": True,
            "students": [
                dict(student)
                for student in students
            ]
        })

    except Exception as error:

        print(
            "GET ATTENDANCE ERROR:",
            repr(error)
        )

        return jsonify({
            "success": False,
            "message": "Unable to load attendance."
        }), 500

    finally:
        conn.close()
        
@app.route("/api/staff/attendance", methods=["POST"])
def save_staff_attendance():

    if "user_id" not in session:
        return jsonify({
            "success": False,
            "message": "Please login first."
        }), 401

    if session["role"] not in ["ADMIN", "TIMING_MASTER"]:
        return jsonify({
            "success": False,
            "message": "Access denied."
        }), 403

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "Invalid request."
        }), 400

    attendance_date = data.get("attendance_date")
    records = data.get("attendance", [])

    if not attendance_date:
        return jsonify({
            "success": False,
            "message": "Attendance date is required."
        }), 400

    if not records:
        return jsonify({
            "success": False,
            "message": "No attendance records found."
        }), 400

    conn = get_db()

    try:

        for record in records:

            student_id = record.get("student_id")
            status = record.get("status")

            if not student_id:
                continue

            if status not in ["PRESENT", "ABSENT"]:
                continue


            # GET STUDENT DETAILS
            student = conn.execute("""
                SELECT
                    id,
                    user_id,
                    full_name,
                    email
                FROM students
                WHERE id = ?
                AND status = 'ACTIVE'
            """, (student_id,)).fetchone()

            if not student:
                continue


            # CHECK EXISTING ATTENDANCE
            existing = conn.execute("""
                SELECT
                    id,
                    status
                FROM attendance
                WHERE student_id = ?
                AND attendance_date = ?
            """, (
                student_id,
                attendance_date
            )).fetchone()


            # UPDATE EXISTING RECORD
            if existing:

                conn.execute("""
                    UPDATE attendance
                    SET
                        status = ?,
                        marked_by = ?
                    WHERE id = ?
                """, (
                    status,
                    session["user_id"],
                    existing["id"]
                ))


            # CREATE NEW RECORD
            else:

                conn.execute("""
                    INSERT INTO attendance (
                        student_id,
                        attendance_date,
                        status,
                        marked_by
                    )
                    VALUES (?, ?, ?, ?)
                """, (
                    student_id,
                    attendance_date,
                    status,
                    session["user_id"]
                ))


            # ABSENT EMAIL
            if (
                status == "ABSENT"
                and student["email"]
                and (
                    not existing
                    or existing["status"] != "ABSENT"
                )
            ):

                email_body = f"""Dear {student["full_name"]},

You have been marked ABSENT for your
martial arts training session.

Student Name: {student["full_name"]}
User ID: {student["user_id"]}
Date: {attendance_date}
Status: ABSENT

Regards,
Sanjay Martial Arts Academy
"""

                try:

                    send_email(
                        student["email"],
                        "Attendance Alert - Sanjay Martial Arts Academy",
                        email_body
                    )

                except Exception as email_error:

                    print(
                        "ATTENDANCE EMAIL ERROR:",
                        repr(email_error)
                    )


        conn.commit()

        return jsonify({
            "success": True,
            "message": "Attendance submitted successfully."
        })


    except Exception as error:

        conn.rollback()

        print(
            "ATTENDANCE SAVE ERROR:",
            repr(error)
        )

        return jsonify({
            "success": False,
            "message": "Unable to save attendance."
        }), 500


    finally:
        conn.close()

@app.route("/api/student/attendance", methods=["GET"])
def get_student_attendance():

    if "user_id" not in session:
        return jsonify({
            "success": False,
            "message": "Please login first."
        }), 401

    if session["role"] != "STUDENT":
        return jsonify({
            "success": False,
            "message": "Access denied."
        }), 403

    conn = get_db()

    try:

        student = conn.execute("""
            SELECT
                id,
                user_id,
                full_name
            FROM students
            WHERE user_id = ?
            AND status = 'ACTIVE'
        """, (
            session["user_id"],
        )).fetchone()


        if not student:
            return jsonify({
                "success": False,
                "message": "Student profile not found."
            }), 404


        records = conn.execute("""
            SELECT
                attendance_date,
                status
            FROM attendance
            WHERE student_id = ?
            ORDER BY attendance_date DESC
        """, (
            student["id"],
        )).fetchall()


        total_days = len(records)

        present_days = sum(
            1
            for record in records
            if str(record["status"]).strip().upper() == "PRESENT"
        )

        absent_days = sum(
            1
            for record in records
            if str(record["status"]).strip().upper() == "ABSENT"
        )


        attendance_percentage = (
            (present_days / total_days) * 100
            if total_days > 0
            else 0
        )


        return jsonify({

            "success": True,

            "student": {
                "full_name": student["full_name"],
                "user_id": student["user_id"]
            },

            "summary": {
                "total_days": total_days,
                "present_days": present_days,
                "absent_days": absent_days,
                "attendance_percentage": round(
                    attendance_percentage,
                    2
                )
            },

            "attendance": [
                {
                    "date": record["attendance_date"],
                    "status": record["status"]
                }
                for record in records
            ]

        })


    except Exception as error:

        print(
            "STUDENT ATTENDANCE ERROR:",
            repr(error)
        )

        return jsonify({
            "success": False,
            "message": "Unable to load attendance."
        }), 500


    finally:
        conn.close()
# =========================================================
# DASHBOARD ROUTING
# =========================================================

@app.route("/dashboard")
def dashboard():

    if "user_id" not in session:
        return render_template("login.html")

    role = session["role"]

    if role == "ADMIN":
        return render_template(
            "admin/dashboard.html"
        )

    if role == "TIMING_MASTER":
        return render_template(
            "staff/dashboard.html"
        )

    if role == "STUDENT":
        return render_template(
            "student/dashboard.html"
        )

    session.clear()

    return render_template("login.html")

    add_missing_student_columns()

#==========================================================
#ANNOUNEMENT
#==========================================================
# ============================================================
# ADMIN ANNOUNCEMENTS
# ============================================================

@app.route("/api/admin/announcements", methods=["POST"])
def create_admin_announcement():

    if "user_id" not in session:
        return jsonify({
            "success": False,
            "message": "Please login first."
        }), 401

    if session.get("role") != "ADMIN":
        return jsonify({
            "success": False,
            "message": "Admin access required."
        }), 403

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "Invalid request."
        }), 400

    title = str(data.get("title", "")).strip()
    message = str(data.get("message", "")).strip()

    if not title:
        return jsonify({
            "success": False,
            "message": "Announcement title is required."
        }), 400

    if not message:
        return jsonify({
            "success": False,
            "message": "Announcement message is required."
        }), 400

    conn = get_db()

    try:

        conn.execute("""
            INSERT INTO announcements (
                title,
                message,
                created_by,
                status
            )
            VALUES (?, ?, ?, 'ACTIVE')
        """, (
            title,
            message,
            session["user_id"]
        ))

        conn.commit()

        return jsonify({
            "success": True,
            "message": "Announcement published successfully."
        })

    except Exception as error:

        conn.rollback()

        print(
            "CREATE ANNOUNCEMENT ERROR:",
            repr(error)
        )

        return jsonify({
            "success": False,
            "message": "Unable to publish announcement."
        }), 500

    finally:
        conn.close()


@app.route("/api/admin/announcements", methods=["GET"])
def get_admin_announcements():

    if "user_id" not in session:
        return jsonify({
            "success": False,
            "message": "Please login first."
        }), 401

    if session.get("role") != "ADMIN":
        return jsonify({
            "success": False,
            "message": "Admin access required."
        }), 403

    conn = get_db()

    try:

        announcements = conn.execute("""
            SELECT
                id,
                title,
                message,
                created_by,
                created_at,
                status
            FROM announcements
            WHERE status = 'ACTIVE'
            ORDER BY id DESC
        """).fetchall()

        announcement_list = []

        for announcement in announcements:

            announcement_list.append({
                "id": announcement["id"],
                "title": announcement["title"],
                "message": announcement["message"],
                "posted_by": announcement["created_by"],
                "created_at": announcement["created_at"],
                "status": announcement["status"]
            })

        return jsonify({
            "success": True,
            "announcements": announcement_list
        })

    except Exception as error:

        print(
            "GET ANNOUNCEMENTS ERROR:",
            repr(error)
        )

        return jsonify({
            "success": False,
            "message": "Unable to load announcements."
        }), 500

    finally:
        conn.close()


@app.route(
    "/api/admin/announcements/<int:announcement_id>",
    methods=["DELETE"]
)
def delete_admin_announcement(announcement_id):

    if "user_id" not in session:
        return jsonify({
            "success": False,
            "message": "Please login first."
        }), 401

    if session.get("role") != "ADMIN":
        return jsonify({
            "success": False,
            "message": "Admin access required."
        }), 403

    conn = get_db()

    try:

        announcement = conn.execute("""
            SELECT id
            FROM announcements
            WHERE id = ?
            AND status = 'ACTIVE'
        """, (announcement_id,)).fetchone()

        if not announcement:

            return jsonify({
                "success": False,
                "message": "Announcement not found."
            }), 404

        conn.execute("""
            UPDATE announcements
            SET status = 'DELETED'
            WHERE id = ?
        """, (announcement_id,))

        conn.commit()

        return jsonify({
            "success": True,
            "message": "Announcement deleted successfully."
        })

    except Exception as error:

        conn.rollback()

        print(
            "DELETE ANNOUNCEMENT ERROR:",
            repr(error)
        )

        return jsonify({
            "success": False,
            "message": "Unable to delete announcement."
        }), 500

    finally:
        conn.close()

# ============================================================
# STAFF / STUDENT ANNOUNCEMENTS
# ============================================================

@app.route("/api/announcements", methods=["GET"])
def get_announcements():

    if "user_id" not in session:
        return jsonify({
            "success": False,
            "message": "Please login first."
        }), 401

    if session.get("role") not in [
        "ADMIN",
        "TIMING_MASTER",
        "STUDENT"
    ]:
        return jsonify({
            "success": False,
            "message": "Access denied."
        }), 403

    conn = get_db()

    try:

        announcements = conn.execute("""
            SELECT
                id,
                title,
                message,
                created_by,
                created_at
            FROM announcements
            WHERE status = 'ACTIVE'
            ORDER BY id DESC
        """).fetchall()

        announcement_list = []

        for announcement in announcements:

            announcement_list.append({
                "id": announcement["id"],
                "title": announcement["title"],
                "message": announcement["message"],
                "created_by": announcement["created_by"],
                "created_at": announcement["created_at"]
            })

        return jsonify({
            "success": True,
            "announcements": announcement_list
        })

    except Exception as error:

        print(
            "GET USER ANNOUNCEMENTS ERROR:",
            repr(error)
        )

        return jsonify({
            "success": False,
            "message": "Unable to load announcements."
        }), 500

    finally:
        conn.close()

@app.route(
    "/api/admin/messages/<int:message_id>/reply",
    methods=["POST"]
)
def reply_admin_message(message_id):

    if "user_id" not in session:
        return jsonify({
            "success": False,
            "message": "Please login first."
        }), 401

    if session.get("role") != "ADMIN":
        return jsonify({
            "success": False,
            "message": "Admin access required."
        }), 403

    data = request.get_json() or {}

    receiver_id = (
        data.get("receiver_id") or ""
    ).strip()

    message = (
        data.get("message") or ""
    ).strip()

    if not receiver_id:

        return jsonify({
            "success": False,
            "message": "Receiver not found."
        }), 400

    if not message:

        return jsonify({
            "success": False,
            "message": "Please enter your reply."
        }), 400

    conn = get_db()

    try:

        original = conn.execute("""
            SELECT
                id,
                sender_id,
                receiver_id,
                subject
            FROM messages
            WHERE id = ?
        """, (message_id,)).fetchone()

        if not original:

            return jsonify({
                "success": False,
                "message": "Original message not found."
            }), 404

        conn.execute("""
            INSERT INTO messages (
                sender_id,
                receiver_id,
                subject,
                message,
                status
            )
            VALUES (?, ?, ?, ?, ?)
        """, (
            session["user_id"],
            receiver_id,
            "Reply",
            message,
            "NEW"
        ))

        conn.commit()

        return jsonify({
            "success": True,
            "message": "Reply sent successfully."
        })

    except Exception as error:

        conn.rollback()

        print(
            "ADMIN REPLY ERROR:",
            repr(error)
        )

        return jsonify({
            "success": False,
            "message": "Unable to send reply."
        }), 500

    finally:

        conn.close()

# =========================================================
# STUDENT MESSAGES
# =========================================================

@app.route("/api/student/messages", methods=["GET"])
def get_student_messages():

    if "user_id" not in session:
        return jsonify({
            "success": False,
            "message": "Please login first."
        }), 401

    if session.get("role") != "STUDENT":
        return jsonify({
            "success": False,
            "message": "Student access required."
        }), 403

    conn = get_db()

    try:

        messages = conn.execute("""
            SELECT
                id,
                sender_id,
                receiver_id,
                subject,
                message,
                status,
                created_at
            FROM messages
            WHERE receiver_id = ?
            ORDER BY id DESC
        """, (session["user_id"],)).fetchall()

        return jsonify({
            "success": True,
            "messages": [
                dict(message)
                for message in messages
            ]
        })

    except Exception as error:

        print(
            "GET STUDENT MESSAGES ERROR:",
            repr(error)
        )

        return jsonify({
            "success": False,
            "message": "Unable to load messages."
        }), 500

    finally:

        conn.close()
# =========================================================
# RUN SERVER
# =========================================================

if __name__ == "__main__":

    app.run(
        debug=True,
        host="127.0.0.1",
        port=5000
    )