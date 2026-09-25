import sqlite3
from werkzeug.security import generate_password_hash


DATABASE = "database.db"


conn = sqlite3.connect(DATABASE)

cursor = conn.cursor()


# ================= USERS =================

cursor.execute("""
CREATE TABLE IF NOT EXISTS users (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id TEXT UNIQUE NOT NULL,

    password_hash TEXT NOT NULL,

    role TEXT NOT NULL,

    status TEXT NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

)
""")


# ================= STUDENTS =================

cursor.execute("""
CREATE TABLE IF NOT EXISTS students (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id TEXT UNIQUE NOT NULL,

    registration_number TEXT UNIQUE NOT NULL,

    full_name TEXT NOT NULL,

    date_of_birth TEXT,

    gender TEXT,

    student_mobile TEXT,

    email TEXT,

    parent_name TEXT,

    parent_mobile TEXT,

    emergency_contact TEXT,

    address TEXT,

    experience TEXT,

    previous_training TEXT,

    photo_path TEXT,

    status TEXT DEFAULT 'ACTIVE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(user_id)

)
""")


# ================= APPLICATIONS =================

cursor.execute("""
CREATE TABLE IF NOT EXISTS applications (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    application_id TEXT UNIQUE NOT NULL,

    full_name TEXT NOT NULL,

    date_of_birth TEXT,

    gender TEXT,

    student_mobile TEXT,

    email TEXT,

    parent_name TEXT,

    parent_mobile TEXT,

    emergency_contact TEXT,

    address TEXT,

    experience TEXT,

    previous_training TEXT,

    preferred_batch TEXT,

    preferred_days TEXT,

    photo_path TEXT,

    status TEXT DEFAULT 'PENDING',

    registration_number TEXT,

    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    reviewed_at TIMESTAMP

)
""")


# ================= TIMING MASTERS =================

cursor.execute("""
CREATE TABLE IF NOT EXISTS timing_masters (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id TEXT UNIQUE NOT NULL,

    full_name TEXT NOT NULL,

    mobile TEXT,

    status TEXT DEFAULT 'ACTIVE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

)
""")


# ================= BATCHES =================

cursor.execute("""
CREATE TABLE IF NOT EXISTS batches (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    batch_name TEXT NOT NULL,

    training_type TEXT,

    start_time TEXT,

    end_time TEXT,

    training_days TEXT,

    timing_master_id INTEGER,

    status TEXT DEFAULT 'ACTIVE'

)
""")


# ================= ATTENDANCE =================

cursor.execute("""
CREATE TABLE IF NOT EXISTS attendance (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    student_id INTEGER NOT NULL,

    batch_id INTEGER,

    attendance_date TEXT NOT NULL,

    status TEXT NOT NULL,

    marked_by TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

)
""")


# ================= ANNOUNCEMENTS =================

cursor.execute("""
CREATE TABLE IF NOT EXISTS announcements (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    title TEXT NOT NULL,

    message TEXT NOT NULL,

    created_by TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    status TEXT DEFAULT 'ACTIVE'

)
""")



# ================= MESSAGES =================

cursor.execute("""
CREATE TABLE IF NOT EXISTS messages (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    sender_id TEXT NOT NULL,

    receiver_id TEXT NOT NULL,

    subject TEXT,

    message TEXT NOT NULL,

    status TEXT DEFAULT 'NEW',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

)
""")


# ================= ADMIN =================

admin_password = generate_password_hash(
    "Admin@123"
)

cursor.execute("""
INSERT OR IGNORE INTO users
(user_id, password_hash, role, status)
VALUES (?, ?, ?, ?)
""", (
    "ADM001",
    admin_password,
    "ADMIN",
    "ACTIVE"
))

conn.execute("""
INSERT OR IGNORE INTO users
(user_id, password_hash, role, status)
VALUES (?, ?, ?, ?)
""", (
    "SMA-2026-001",
    generate_password_hash("Student@123"),
    "STUDENT",
    "ACTIVE"
))

# ================= TIMING MASTER =================

staff_password = generate_password_hash(
    "Staff@123"
)

cursor.execute("""
INSERT OR IGNORE INTO users
(user_id, password_hash, role, status)
VALUES (?, ?, ?, ?)
""", (
    "TM001",
    staff_password,
    "TIMING_MASTER",
    "ACTIVE"
))


conn.commit()

conn.close()


print("Database initialized successfully.")
print()
print("Admin:")
print("User ID: ADM001")
print("Temporary Password: Admin@123")
print()
print("Timing Master:")
print("User ID: TM001")
print("Temporary Password: Staff@123")