
function showStaffSection(sectionId, clickedButton) {

    document.querySelectorAll(".staff-section")
        .forEach(section => {
            section.classList.remove(
                "active-staff-section"
            );
        });


    const section =
        document.getElementById(sectionId);

    if (section) {
        section.classList.add(
            "active-staff-section"
        );
    }


    document.querySelectorAll(".staff-nav button")
        .forEach(button => {
            button.classList.remove("active");
        });


    if (clickedButton) {
        clickedButton.classList.add("active");
    }


    const titles = {

        overview: "Dashboard",
        batch: "My Batch",
        students: "Students",
        attendance: "Attendance",
        announcements: "Announcements",
        password: "Change Password"

    };


    document.getElementById(
        "staffPageTitle"
    ).textContent =
        titles[sectionId] || "Dashboard";
}


async function logoutStaff() {

    try {

        await fetch(
            "/api/logout",
            {
                method: "POST"
            }
        );

    } finally {

        window.location.href = "/login";

    }
}
/* =====================================================
   STAFF STUDENTS
===================================================== */
function showStaffSection(sectionId, clickedButton) {

    document.querySelectorAll(".staff-section")
        .forEach(section => {
            section.classList.remove(
                "active-staff-section"
            );
        });

    const section =
        document.getElementById(sectionId);

    if (section) {
        section.classList.add(
            "active-staff-section"
        );
    }

    document.querySelectorAll(".staff-nav button")
        .forEach(button => {
            button.classList.remove("active");
        });

    if (clickedButton) {
        clickedButton.classList.add("active");
    }

    const titles = {

        overview: "Dashboard",
        batch: "My Batch",
        students: "Students",
        attendance: "Attendance",
        announcements: "Announcements",
        password: "Change Password"

    };

    document.getElementById(
        "staffPageTitle"
    ).textContent =
        titles[sectionId] || "Dashboard";
}


async function logoutStaff() {

    try {

        await fetch(
            "/api/logout",
            {
                method: "POST"
            }
        );

    } finally {

        window.location.href = "/login";

    }
}


/* =====================================================
   STAFF STUDENTS
===================================================== */

async function loadStaffStudents() {

    const tableBody =
        document.getElementById(
            "staffStudentTableBody"
        );

    if (!tableBody) {
        console.error(
            "staffStudentTableBody not found."
        );
        return;
    }

    try {

        const response =
            await fetch(
                "/api/staff/students"
            );

        const result =
            await response.json();

        if (!response.ok || !result.success) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="6">
                        ${
                            result.message ||
                            "Unable to load students."
                        }
                    </td>
                </tr>
            `;

            return;
        }

        const students =
            result.students || [];

        if (students.length === 0) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="6">
                        No Students Assigned
                    </td>
                </tr>
            `;

            return;
        }

        tableBody.innerHTML =
            students.map(function(student) {

                const initial =
                    student.full_name
                        ? student.full_name
                            .charAt(0)
                            .toUpperCase()
                        : "?";

                return `
                    <tr>

                        <td>
                            <div class="staff-student-photo">

                                ${
                                    student.photo_path
                                    ?
                                    `<img
                                        src="/static/${escapeAttendanceText(
                                            student.photo_path
                                        )}"
                                        alt="Student Photo"
                                    >`
                                    :
                                    `<div class="staff-student-avatar">
                                        ${initial}
                                    </div>`
                                }

                            </div>
                        </td>

                        <td>
                            <div class="staff-student-name">
                                <strong>
                                    ${escapeAttendanceText(
                                        student.full_name
                                    )}
                                </strong>
                            </div>
                        </td>
                        <td>
                    <div class="student-attendance-percentage">
        ${Number(student.attendance_percentage || 0).toFixed(2)}%
    </div>
</td>

                        <td>
                            ${escapeAttendanceText(
                                student.user_id
                            )}
                        </td>

                        <td>
                            ${escapeAttendanceText(
                                student.registration_number
                            )}
                        </td>

                        <td>
                            ${escapeAttendanceText(
                                student.student_mobile || "-"
                            )}
                        </td>

                        <td>
                            <span class="student-status">
                                ${escapeAttendanceText(
                                    student.status
                                )}
                            </span>
                        </td>

                    </tr>
                `;

            }).join("");

    } catch (error) {

        console.error(
            "STAFF STUDENTS ERROR:",
            error
        );

        tableBody.innerHTML = `
            <tr>
                <td colspan="6">
                    Unable to connect to server.
                </td>
            </tr>
        `;
    }
}

/* =====================================================
   ATTENDANCE
===================================================== */

let selectedAttendanceDate = "";


/* =========================
   LOAD ATTENDANCE
========================= */

async function loadAttendance() {

    const dateElement =
        document.getElementById("attendanceDate");

    const container =
        document.getElementById("attendanceStudentList");


    if (!dateElement || !container) {

        console.error(
            "Attendance elements not found."
        );

        return;
    }


    const date =
        dateElement.value;


    if (!date) {

        container.innerHTML = `
            <div class="attendance-empty">
                Please select a date.
            </div>
        `;

        return;
    }


    selectedAttendanceDate = date;


    container.innerHTML = `
        <div class="attendance-loading">
            Loading students...
        </div>
    `;


    try {

        const response = await fetch(
            `/api/staff/attendance?date=${encodeURIComponent(date)}`
        );


        const result =
            await response.json();


        if (!response.ok || !result.success) {

            container.innerHTML = `
                <div class="attendance-empty">
                    ${result.message ||
                    "Unable to load attendance."}
                </div>
            `;

            return;
        }


        const students =
            result.students || [];


        if (students.length === 0) {

            container.innerHTML = `
                <div class="attendance-empty">
                    No active students found.
                </div>
            `;

            return;
        }


        container.innerHTML =
            students.map(
                (student, index) => {

                    const isPresent =
                        student.attendance_status ===
                        "PRESENT";

                    const isAbsent =
                        student.attendance_status ===
                        "ABSENT";


                    return `

                        <div
                            class="attendance-student-row"
                            data-student-id="${student.id}"
                        >

                            <div class="attendance-number">
                                ${index + 1}
                            </div>


                            <div class="attendance-student-info">

                                <strong>
                                    ${escapeAttendanceText(
                                        student.full_name
                                    )}
                                </strong>

                                <span>
                                    ${escapeAttendanceText(
                                        student.registration_number ||
                                        student.user_id
                                    )}
                                </span>

                            </div>


                            <div class="attendance-status">

                                <label
                                    class="attendance-radio present">

                                    <input
                                        type="radio"
                                        name="attendance_${student.id}"
                                        value="PRESENT"
                                        ${isPresent ? "checked" : ""}
                                    >

                                    <span>
                                        PRESENT
                                    </span>

                                </label>


                                <label
                                    class="attendance-radio absent">

                                    <input
                                        type="radio"
                                        name="attendance_${student.id}"
                                        value="ABSENT"
                                        ${isAbsent ? "checked" : ""}
                                    >

                                    <span>
                                        ABSENT
                                    </span>

                                </label>

                            </div>

                        </div>

                    `;

                }
            ).join("");


        updateAttendanceCount();

    }
    catch (error) {

        console.error(
            "Attendance loading error:",
            error
        );

        container.innerHTML = `
            <div class="attendance-empty">
                Unable to connect to server.
            </div>
        `;

    }
}


/* =====================================================
   MARK ALL PRESENT
===================================================== */

function markAllPresent() {

    document
        .querySelectorAll(
            '#attendanceStudentList input[value="PRESENT"]'
        )
        .forEach(input => {

            input.checked = true;

        });


    updateAttendanceCount();
}


/* =====================================================
   MARK ALL ABSENT
===================================================== */

function markAllAbsent() {

    document
        .querySelectorAll(
            '#attendanceStudentList input[value="ABSENT"]'
        )
        .forEach(input => {

            input.checked = true;

        });


    updateAttendanceCount();
}


/* =====================================================
   ATTENDANCE COUNT
===================================================== */

function updateAttendanceCount() {

    const present =
        document.querySelectorAll(
            '#attendanceStudentList input[value="PRESENT"]:checked'
        ).length;


    const absent =
        document.querySelectorAll(
            '#attendanceStudentList input[value="ABSENT"]:checked'
        ).length;


    const presentElement =
        document.getElementById("presentCount");

    const absentElement =
        document.getElementById("absentCount");


    if (presentElement) {
        presentElement.textContent = present;
    }


    if (absentElement) {
        absentElement.textContent = absent;
    }
}


/* =====================================================
   SAVE ATTENDANCE
===================================================== */
async function saveAttendance() {

    const dateElement =
        document.getElementById("attendanceDate");

    if (!dateElement) {
        return;
    }

    const date = dateElement.value;

    if (!date) {
        alert("Please select attendance date.");
        return;
    }


    const rows =
        document.querySelectorAll(
            ".attendance-student-row"
        );

    if (rows.length === 0) {
        alert("No students available.");
        return;
    }


    const attendance = [];


    rows.forEach(row => {

        const studentId =
            row.dataset.studentId;

        const selected =
            row.querySelector(
                'input[type="radio"]:checked'
            );

        if (studentId && selected) {

            attendance.push({

                student_id:
                    parseInt(studentId),

                status:
                    selected.value

            });

        }

    });


    if (attendance.length === 0) {

        alert(
            "Please mark attendance for students."
        );

        return;
    }


    const saveButton =
        document.getElementById(
            "saveAttendanceButton"
        );


    if (saveButton) {

        saveButton.disabled = true;

        saveButton.textContent =
            "SAVING...";

    }


    try {

        const response = await fetch(
            "/api/staff/attendance",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    attendance_date:
                        date,

                    attendance:
                        attendance

                })

            }
        );


        const result =
            await response.json();


        if (!response.ok || !result.success) {

            alert(
                result.message ||
                "Unable to save attendance."
            );

            return;
        }


        alert(
            "Attendance saved successfully."
        );


        await loadAttendance();

    }
    catch (error) {

        console.error(
            "Attendance save error:",
            error
        );

        alert(
            "Unable to connect to server."
        );

    }
    finally {

        if (saveButton) {

            saveButton.disabled = false;

            saveButton.textContent =
                "SUBMITTING";

        }

    }
    alert(
    "Attendance submitted successfully."
);
}

/* =====================================================
   ESCAPE TEXT
===================================================== */

function escapeAttendanceText(value) {

    if (!value) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

document.addEventListener("DOMContentLoaded", function () {

    loadStaffStudents();
     loadStaffAnnouncements();

});
/* =====================================================
   STAFF STUDENT 360
===================================================== */

async function searchStaffStudent360() {

    const searchInput =
        document.getElementById("staffStudent360Search");

    const resultsBox =
        document.getElementById("staffStudent360Results");

    const profileBox =
        document.getElementById("staffStudent360Profile");

    if (!searchInput || !resultsBox) {
        console.error("Staff Student 360 elements not found.");
        return;
    }

    const searchValue =
        searchInput.value.trim().toLowerCase();

    if (profileBox) {
        profileBox.innerHTML = "";
    }

    if (!searchValue) {

        resultsBox.innerHTML = `
            <p>Please enter student name or registration number.</p>
        `;

        return;
    }

    resultsBox.innerHTML = `
        <p>Searching...</p>
    `;

    try {

        const response =
            await fetch("/api/staff/students");

        const result =
            await response.json();

        if (!response.ok || !result.success) {

            resultsBox.innerHTML = `
                <p>
                    ${result.message ||
                    "Unable to load students."}
                </p>
            `;

            return;
        }

        const students =
            result.students || [];

        const matches =
            students.filter(student => {

                const name =
                    String(
                        student.full_name || ""
                    ).toLowerCase();

                const registration =
                    String(
                        student.registration_number || ""
                    ).toLowerCase();

                const userId =
                    String(
                        student.user_id || ""
                    ).toLowerCase();

                return (
                    name.includes(searchValue) ||
                    registration.includes(searchValue) ||
                    userId.includes(searchValue)
                );
            });

        if (matches.length === 0) {

            resultsBox.innerHTML = `
                <p>No student found.</p>
            `;

            return;
        }

        resultsBox.innerHTML =
            matches.map(student => {

                return `
                    <div class="staff-student360-result-card">

                        <div>

                            <strong>
                                ${escapeAttendanceText(
                                    student.full_name
                                )}
                            </strong>

                            <span>
                                ${escapeAttendanceText(
                                    student.registration_number || "-"
                                )}
                            </span>

                        </div>

                        <button
                            type="button"
                            onclick="viewStaffStudent360(${student.id})"
                        >
                            VIEW 360
                        </button>

                    </div>
                `;

            }).join("");

    } catch (error) {

        console.error(
            "STAFF STUDENT 360 SEARCH ERROR:",
            error
        );

        resultsBox.innerHTML = `
            <p>
                Unable to connect to server.
            </p>
        `;
    }
}
async function viewStaffStudent360(studentId) {

    const profileBox =
        document.getElementById(
            "staffStudent360Profile"
        );

    if (!profileBox) {
        return;
    }

    profileBox.innerHTML = `
        <p>Loading student profile...</p>
    `;

    try {

        const response =
            await fetch(
                `/api/staff/student360/${studentId}`
            );

        const result =
            await response.json();

        if (!response.ok || !result.success) {

            profileBox.innerHTML = `
                <p>
                    ${result.message ||
                    "Unable to load student profile."}
                </p>
            `;

            return;
        }

        const student =
            result.student;

        profileBox.innerHTML = `

            <div class="staff-student360-card">

                <div class="staff-student360-header">

                    <div class="staff-student360-photo">

                        ${
                            student.photo_path
                            ?
                            `
                            <img
                                src="/static/${escapeAttendanceText(
                                    student.photo_path
                                )}"
                                alt="Student Photo"
                            >
                            `
                            :
                            `
                            <div class="staff-student360-avatar">
                                ${
                                    escapeAttendanceText(
                                        student.full_name
                                            ? student.full_name
                                                .charAt(0)
                                                .toUpperCase()
                                            : "?"
                                    )
                                }
                            </div>
                            `
                        }

                    </div>

                    <div>

                        <h2>
                            ${escapeAttendanceText(
                                student.full_name
                            )}
                        </h2>

                        <p>
                            User ID:
                            ${escapeAttendanceText(
                                student.user_id || "-"
                            )}
                        </p>

                        <p>
                            Registration No:
                            ${escapeAttendanceText(
                                student.registration_number || "-"
                            )}
                        </p>

                        <span class="staff-student360-status">
                            ${escapeAttendanceText(
                                student.status || "-"
                            )}
                        </span>

                    </div>

                </div>


                <div class="staff-student360-section">

                    <h3>PERSONAL DETAILS</h3>

                    <div class="staff-student360-grid">

                        <div>
                            <span>DOB</span>
                            <strong>
                                ${escapeAttendanceText(
                                    student.dob || "-"
                                )}
                            </strong>
                        </div>

                        <div>
                            <span>GENDER</span>
                            <strong>
                                ${escapeAttendanceText(
                                    student.gender || "-"
                                )}
                            </strong>
                        </div>

                        <div>
                            <span>MOBILE</span>
                            <strong>
                                ${escapeAttendanceText(
                                    student.student_mobile || "-"
                                )}
                            </strong>
                        </div>

                        <div>
                            <span>EMAIL</span>
                            <strong>
                                ${escapeAttendanceText(
                                    student.email || "-"
                                )}
                            </strong>
                        </div>

                    </div>

                </div>


                <div class="staff-student360-section">

                    <h3>PARENT / EMERGENCY</h3>

                    <div class="staff-student360-grid">

                        <div>
                            <span>PARENT NAME</span>
                            <strong>
                                ${escapeAttendanceText(
                                    student.parent_name || "-"
                                )}
                            </strong>
                        </div>

                        <div>
                            <span>PARENT MOBILE</span>
                            <strong>
                                ${escapeAttendanceText(
                                    student.parent_mobile || "-"
                                )}
                            </strong>
                        </div>

                        <div>
                            <span>EMERGENCY CONTACT</span>
                            <strong>
                                ${escapeAttendanceText(
                                    student.emergency_contact || "-"
                                )}
                            </strong>
                        </div>

                    </div>

                </div>


                <div class="staff-student360-section">

                    <h3>ADDRESS</h3>

                    <p>
                        ${escapeAttendanceText(
                            student.address || "-"
                        )}
                    </p>

                </div>


                <div class="staff-student360-section">

                    <h3>TRAINING DETAILS</h3>

                    <div class="staff-student360-grid">

                        <div>
                            <span>EXPERIENCE</span>
                            <strong>
                                ${escapeAttendanceText(
                                    student.experience || "-"
                                )}
                            </strong>
                        </div>

                        <div>
                            <span>PREVIOUS TRAINING</span>
                            <strong>
                                ${escapeAttendanceText(
                                    student.previous_training || "-"
                                )}
                            </strong>
                        </div>

                    </div>

                </div>


                <div class="staff-student360-section">

                    <h3>ATTENDANCE</h3>

                    <div class="staff-student360-attendance">

                        <strong>
                            ${Number(
                                student.attendance_percentage || 0
                            ).toFixed(2)}%
                        </strong>

                        <span>
                            Overall Attendance
                        </span>

                    </div>

                </div>

            </div>
        `;

    } catch (error) {

        console.error(
            "STAFF STUDENT 360 ERROR:",
            error
        );

        profileBox.innerHTML = `
            <p>
                Unable to load student profile.
            </p>
        `;
    }
}
async function loadStaffAnnouncements() {

    const container =
        document.getElementById("staffAnnouncementsList");

    if (!container) {
        return;
    }

    try {

        const response =
            await fetch("/api/announcements");

        const result =
            await response.json();

        if (!response.ok || !result.success) {

            container.innerHTML = `
                <div class="staff-announcement-loading">
                    ${result.message || "Unable to load announcements."}
                </div>
            `;

            return;
        }

        const announcements =
            result.announcements || [];

        if (announcements.length === 0) {

            container.innerHTML = `
                <div class="staff-announcement-empty">
                    <div>📢</div>
                    <h3>No Announcements</h3>
                    <p>No academy updates available.</p>
                </div>
            `;

            return;
        }

        container.innerHTML =
            announcements.map(function(item) {

                return `
                    <div class="staff-announcement-card">

                        <div class="staff-announcement-icon">
                            📢
                        </div>

                        <div class="staff-announcement-content">

                            <h3>
                                ${escapeStaffAnnouncementText(
                                    item.title
                                )}
                            </h3>

                            <p>
                                ${escapeStaffAnnouncementText(
                                    item.message
                                )}
                            </p>

                            <small>
                                ${escapeStaffAnnouncementText(
                                    item.created_at || ""
                                )}
                            </small>

                        </div>

                    </div>
                `;

            }).join("");

    } catch (error) {

        console.error(
            "STAFF ANNOUNCEMENTS ERROR:",
            error
        );

        container.innerHTML = `
            <div class="staff-announcement-loading">
                Unable to connect to server.
            </div>
        `;
    }
}


function escapeStaffAnnouncementText(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}