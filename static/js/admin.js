// ================= ADMIN DASHBOARD =================

document.addEventListener("DOMContentLoaded", function () {

    console.log("Admin JS loaded");

    showSection("overview");

    setupAddStudentForm();
    loadApplications();
    loadDashboardStats();
    loadStudents();
    loadAdminAnnouncements();
    loadAdminMessages();
});

// ================= SECTION NAVIGATION =================

function showSection(sectionId, button = null) {
console.log("SHOW SECTION:", sectionId);
    const sections =
        document.querySelectorAll(".dashboard-section");

    sections.forEach(function (section) {
        section.classList.remove("active-section");
    });

    const target =
        document.getElementById(sectionId);

    if (target) {
        target.classList.add("active-section");
    }
    if (sectionId === "messages") {
    loadAdminMessages();
    }

    // Update sidebar active button
    const navButtons =
        document.querySelectorAll(
            ".sidebar-nav button, .sidebar-bottom button"
        );

    navButtons.forEach(function (btn) {
        btn.classList.remove("active");
    });

    if (button) {
        button.classList.add("active");
    }

    // Page titles
    const titles = {
        overview: "Dashboard Overview",
        students: "Students",
        applications: "Applications",
        staff: "Timing Masters",
        batches: "Batches & Timings",
        attendance: "Attendance",
        announcements: "Announcements",
        messages: "Messages",
        settings: "Settings",
        student360: "Student 360"
    };

    const pageTitle =
        document.getElementById("pageTitle");

    if (pageTitle && titles[sectionId]) {
        pageTitle.textContent = titles[sectionId];
    }
}


// ================= APPLICATION FILTER =================

function filterApplications(status, button) {

    const rows =
        document.querySelectorAll(
            "#applicationTableBody tr"
        );

    rows.forEach(function (row) {

        const rowStatus =
            row.getAttribute("data-status");

        if (
            status === "ALL" ||
            rowStatus === status
        ) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }
    });

    const filterButtons =
        document.querySelectorAll(
            ".application-filter button"
        );

    filterButtons.forEach(function (btn) {
        btn.classList.remove("filter-active");
    });

    if (button) {
        button.classList.add("filter-active");
    }
}


// ================= APPLICATION VIEW =================

async function openApplication(applicationId) {

    try {

        const response = await fetch(
            `/api/admin/applications/${applicationId}`
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            alert(result.message || "Unable to load application.");
            return;
        }

        const app = result.application;

        if (app.status !== "PENDING") {
            alert(
                "Application: " + app.application_id +
                "\n\nStatus: " + app.status
            );
            return;
        }

        const choice = confirm(
            "Application: " + app.application_id +
            "\nStudent: " + app.full_name +
            "\nMobile: " + app.student_mobile +
            "\n\n" +
            "OK = ACCEPT\n" +
            "Cancel = REJECT"
        );

        if (choice) {
            await processApplication(
                app.application_id,
                "ACCEPT"
            );
        } else {
            await processApplication(
                app.application_id,
                "REJECT"
            );
        }

    } catch (error) {

        console.error(
            "APPLICATION DETAILS ERROR:",
            error
        );

        alert("Unable to connect to server.");
    }
}
async function processApplication(
    applicationId,
    decision
) {

    try {

        const response = await fetch(
            `/api/admin/applications/${applicationId}/decision`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    decision: decision
                })
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {

            alert(
                result.message ||
                "Unable to process application."
            );

            return;
        }

        if (decision === "ACCEPT") {

            alert(
                "APPLICATION ACCEPTED\n\n" +
                "Student: " +
                result.student.full_name +
                "\nUser ID: " +
                result.student.user_id +
                "\nRegistration No: " +
                result.student.registration_number +
                "\nTemporary Password: " +
                result.student.temporary_password
            );

        } else {

            alert(
                "Application rejected successfully."
            );
        }

        // Refresh application table
        loadApplications();

    } catch (error) {

        console.error(
            "DECISION ERROR:",
            error
        );

        alert(
            "Unable to connect to server."
        );
    }
}

// ================= LOGOUT =================

async function logoutAdmin() {

    try {

        const response = await fetch(
            "/api/logout",
            {
                method: "POST"
            }
        );

        if (response.ok) {
            window.location.href = "/login";
        }

    } catch (error) {

        console.error(error);

        window.location.href = "/login";
    }
}


// ================= ADMIN PASSWORD =================

async function changeAdminPassword() {

    const currentPassword =
        document.getElementById(
            "adminCurrentPassword"
        );

    const newPassword =
        document.getElementById(
            "adminNewPassword"
        );

    const confirmPassword =
        document.getElementById(
            "adminConfirmPassword"
        );

    const message =
        document.getElementById(
            "adminPasswordMessage"
        );

    if (
        !currentPassword ||
        !newPassword ||
        !confirmPassword ||
        !message
    ) {
        return;
    }

    if (
        !currentPassword.value ||
        !newPassword.value ||
        !confirmPassword.value
    ) {

        message.textContent =
            "Please fill all password fields.";

        return;
    }

    if (
        newPassword.value !==
        confirmPassword.value
    ) {

        message.textContent =
            "New passwords do not match.";

        return;
    }

    if (newPassword.value.length < 8) {

        message.textContent =
            "Password must contain at least 8 characters.";

        return;
    }

    try {

        const response = await fetch(
            "/api/change-password",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    current_password:
                        currentPassword.value,

                    new_password:
                        newPassword.value,

                    confirm_password:
                        confirmPassword.value
                })
            }
        );

        const result =
            await response.json();

        if (!response.ok || !result.success) {

            message.textContent =
                result.message ||
                "Password change failed.";

            return;
        }

        message.textContent =
            "Password changed successfully.";

        currentPassword.value = "";
        newPassword.value = "";
        confirmPassword.value = "";

    } catch (error) {

        console.error(error);

        message.textContent =
            "Unable to connect to server.";
    }
}


// =====================================================
// ADD STUDENT MODAL
// =====================================================

function openAddStudentModal() {

    const modal =
        document.getElementById(
            "addStudentModal"
        );

    if (modal) {
        modal.classList.add("show");
    }
}


function closeAddStudentModal() {

    const modal =
        document.getElementById(
            "addStudentModal"
        );

    if (modal) {
        modal.classList.remove("show");
    }

    const form =
        document.getElementById(
            "addStudentForm"
        );

    if (form) {
        form.reset();
    }

    const message =
        document.getElementById(
            "addStudentMessage"
        );

    if (message) {
        message.textContent = "";
    }
}


// =====================================================
// ADD STUDENT FORM
// =====================================================

function setupAddStudentForm() {

    const form =
        document.getElementById(
            "addStudentForm"
        );

    if (!form) {

        console.log(
            "Add Student form not found."
        );

        return;
    }

    console.log(
        "Add Student form connected."
    );


    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            console.log(
                "CREATE STUDENT clicked"
            );


            const message =
                document.getElementById(
                    "addStudentMessage"
                );

            const button =
                form.querySelector(
                    "button[type='submit']"
                );


            // Safety check
            if (!button) {

                console.error(
                    "Create Student button not found."
                );

                return;
            }


            // Get required fields
            const fullName =
                document.getElementById(
                    "addFullName"
                );

            const dob =
                document.getElementById(
                    "addDob"
                );

            const gender =
                document.getElementById(
                    "addGender"
                );

            const studentMobile =
                document.getElementById(
                    "addStudentMobile"
                );

            const email =
                document.getElementById(
                    "addEmail"
                );

            const parentName =
                document.getElementById(
                    "addParentName"
                );

            const parentMobile =
                document.getElementById(
                    "addParentMobile"
                );

            const emergencyContact =
                document.getElementById(
                    "addEmergencyContact"
                );

            const address =
                document.getElementById(
                    "addAddress"
                );

            const experience =
                document.getElementById(
                    "addExperience"
                );


            // Check required elements
            if (
                !fullName ||
                !dob ||
                !gender ||
                !studentMobile
            ) {

                alert(
                    "Some student form fields are missing."
                );

                return;
            }


            // Browser validation
            if (!form.checkValidity()) {

                form.reportValidity();

                return;
            }


            // Student data
            const studentData = {

                full_name:
                    fullName.value.trim(),

                dob:
                    dob.value,

                gender:
                    gender.value,

                student_mobile:
                    studentMobile.value.trim(),

                email:
                    email ?
                    email.value.trim() :
                    "",

                parent_name:
                    parentName ?
                    parentName.value.trim() :
                    "",

                parent_mobile:
                    parentMobile ?
                    parentMobile.value.trim() :
                    "",

                emergency_contact:
                    emergencyContact ?
                    emergencyContact.value.trim() :
                    "",

                address:
                    address ?
                    address.value.trim() :
                    "",

                experience:
                    experience ?
                    experience.value :
                    ""
            };


            console.log(
                "Student data:",
                studentData
            );


            // Loading state
            button.disabled = true;
            button.textContent =
                "CREATING...";

            if (message) {
                message.textContent = "";
            }


            try {

                const response =
                    await fetch(
                        "/api/admin/students",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    studentData
                                )
                        }
                    );


                console.log(
                    "API status:",
                    response.status
                );


                const result =
                    await response.json();


                console.log(
                    "API response:",
                    result
                );


                // API error
                if (
                    !response.ok ||
                    !result.success
                ) {

                    const errorMessage =
                        result.message ||
                        "Failed to create student.";

                    if (message) {
                        message.textContent =
                            errorMessage;
                    }

                    alert(
                        errorMessage
                    );

                    button.disabled = false;
                    button.textContent =
                        "CREATE STUDENT PROFILE";

                    return;
                }


                // =========================
                // SUCCESS
                // =========================

                const student =
                    result.student;


                alert(
                    "STUDENT CREATED SUCCESSFULLY!\n\n" +

                    "Name: " +
                    student.full_name +
                    "\n\n" +

                    "User ID: " +
                    student.user_id +
                    "\n\n" +

                    "Registration No: " +
                    student.registration_number +
                    "\n\n" +

                    "Temporary Password: " +
                    student.temporary_password
                );


                // Close modal
                closeAddStudentModal();


                // Reset button
                button.disabled = false;
                button.textContent =
                    "CREATE STUDENT PROFILE";


                // Optional student list refresh
                if (
                    typeof loadStudents ==="function") {

                    loadStudents();
                }

            } catch (error) {

                console.error(
                    "Create student error:",
                    error
                );


                if (message) {

                    message.textContent =
                        "Unable to connect to server.";
                }


                alert(
                    "Unable to connect to server.\n\n" +
                    "Please make sure Flask is running."
                );


                button.disabled = false;
                button.textContent =
                    "CREATE STUDENT PROFILE";
            }

        }
    );
}
async function loadStudents() {

    const container =
        document.getElementById("studentListContainer");

    if (!container) {
        console.log("studentListContainer not found.");
        return;
    }

    container.innerHTML = `
        <div class="student-empty-state">
            <div>⏳</div>
            <h3>Loading Students...</h3>
            <p>Please wait.</p>
        </div>
    `;

    try {

        const response = await fetch(
            "/api/admin/students"
        );

        const result = await response.json();

        console.log(
            "Students API response:",
            result
        );

        if (!response.ok || !result.success) {

            container.innerHTML = `
                <div class="student-empty-state">
                    <div>⚠️</div>
                    <h3>Unable To Load Students</h3>
                    <p>
                        ${result.message || "Something went wrong."}
                    </p>
                </div>
            `;

            return;
        }

        const students =
            result.students || [];

        // No students
        if (students.length === 0) {

            container.innerHTML = `
                <div class="student-empty-state">
                    <div>👥</div>

                    <h3>No Student Records Yet</h3>

                    <p>
                        Create a student account using
                        the Add Student button.
                    </p>
                </div>
            `;

            return;
        }


        // Clear container
        container.innerHTML = "";


        // Create student rows
        students.forEach(function(student) {

            const row =
                document.createElement("div");

            row.className =
                "student-list-row";


            // Photo
            let photoHTML = `
                <div class="student-photo-placeholder">
                    👤
                </div>
            `;

            if (student.photo_path) {

                photoHTML = `
                    <img
                        class="student-list-photo"
                        src="/static/${student.photo_path}"
                        alt="Student Photo"
                    >
                `;
            }


            row.innerHTML = `

                <div class="student-photo-cell">
                    ${photoHTML}
                </div>

                <div class="student-name-cell">

                    <strong>
                        ${escapeStudentHTML(
                            student.full_name
                        )}
                    </strong>
                        <span class="student-attendance-percentage">
                ${Number(student.attendance_percentage || 0).toFixed(2)}%
            </span>
                    <span>
                        ${escapeStudentHTML(
                            student.gender || "-"
                        )}
                    </span>

                </div>
                

                <div class="student-id-cell">

                    ${escapeStudentHTML(
                        student.user_id
                    )}

                </div>

                <div class="student-registration-cell">

                    ${escapeStudentHTML(
                        student.registration_number
                    )}

                </div>

                <div class="student-mobile-cell">

                    ${escapeStudentHTML(
                        student.student_mobile || "-"
                    )}

                </div>

                <div>

                    <span class="student-status active">
                        ${escapeStudentHTML(
                            student.status || "ACTIVE"
                        )}
                    </span>

                </div>

            `;

            container.appendChild(row);

        });

    } catch (error) {

        console.error(
            "Load students error:",
            error
        );

        container.innerHTML = `
            <div class="student-empty-state">
                <div>⚠️</div>

                <h3>Unable To Load Students</h3>

                <p>
                    Unable to connect to the server.
                </p>
            </div>
        `;
    }
}
function escapeStudentHTML(value) {

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
function escapeText(value) {
    return escapeStudentHTML(value);
}

async function loadApplications() {

    const tableBody =
        document.getElementById("applicationTableBody");

    const pendingCount =
        document.getElementById("pendingCount");

    if (!tableBody) return;

    try {
        const response = await fetch(
            "/api/admin/applications"
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            console.error(
                "APPLICATION LOAD ERROR:",
                result.message
            );
            return;
        }

        // Pending count
        pendingCount.textContent =
            result.pending_count;

        // Clear demo rows
        tableBody.innerHTML = "";

        if (result.applications.length === 0) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center;">
                        No applications found.
                    </td>
                </tr>
            `;

            return;
        }

        result.applications.forEach(function(app) {

            const row = document.createElement("tr");

            row.setAttribute(
                "data-status",
                app.status
            );

            const initial =
                app.full_name
                    ? app.full_name.charAt(0).toUpperCase()
                    : "?";

            row.innerHTML = `
                <td>
                    <strong>${app.application_id}</strong>
                </td>

                <td>
                    <div class="student-cell">

                        <div class="student-avatar">
                            ${initial}
                        </div>

                        <div>
                            <strong>
                                ${app.full_name}
                            </strong>

                            <small>
                                ${app.gender || ""}
                            </small>
                        </div>

                    </div>
                </td>

                <td>
                    ${app.student_mobile}
                </td>

                <td>
                    <span class="status ${app.status.toLowerCase()}">
                        ${app.status}
                    </span>
                </td>

                <td>
                    <button
                        class="view-btn"
                        onclick="openApplication('${app.application_id}')">
                        VIEW
                    </button>
                </td>
            `;

            tableBody.appendChild(row);
        });

    } catch (error) {

        console.error(
            "LOAD APPLICATIONS ERROR:",
            error
        );
    }
}
async function loadDashboardStats() {

    try {

        // -------------------------
        // LOAD STUDENTS
        // -------------------------

        const studentResponse =
            await fetch("/api/admin/students");

        const studentResult =
            await studentResponse.json();

        if (studentResponse.ok && studentResult.success) {

            const activeStudents =
                studentResult.students.filter(function(student) {
                    return student.status === "ACTIVE";
                }).length;

            const activeStudentsCount =
                document.getElementById("activeStudentsCount");

            if (activeStudentsCount) {
                activeStudentsCount.textContent =
                    activeStudents;
            }
        }


        // -------------------------
        // LOAD APPLICATIONS
        // -------------------------

        const applicationResponse =
            await fetch("/api/admin/applications");

        const applicationResult =
            await applicationResponse.json();

        if (applicationResponse.ok &&
            applicationResult.success) {

            const pendingApplicationsCount =
                document.getElementById(
                    "pendingApplicationsCount"
                );

            if (pendingApplicationsCount) {
                pendingApplicationsCount.textContent =
                    applicationResult.pending_count;
            }
        }

    } catch (error) {

        console.error(
            "DASHBOARD STATS ERROR:",
            error
        );
    }
}
/* =====================================================
   ADMIN ATTENDANCE
===================================================== */

async function loadAdminAttendance() {

    const dateElement =
        document.getElementById("adminAttendanceDate");

    const container =
        document.getElementById(
            "adminAttendanceStudentList"
        );

    if (!dateElement || !container) {

        console.error(
            "Admin attendance elements not found."
        );

        return;
    }


    const date = dateElement.value;


    if (!date) {

        container.innerHTML = `
            <div class="attendance-empty">
                Please select a date.
            </div>
        `;

        return;
    }


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
                                    ${escapeAdminAttendanceText(
                                        student.full_name
                                    )}
                                </strong>

                                <span>
                                    ${escapeAdminAttendanceText(
                                        student.registration_number ||
                                        student.user_id
                                    )}
                                </span>

                            </div>


                            <div class="attendance-status">

                                <label
                                    class="attendance-radio present"
                                >

                                    <input
                                        type="radio"
                                        name="admin_attendance_${student.id}"
                                        value="PRESENT"
                                        ${isPresent ? "checked" : ""}
                                    >

                                    <span>
                                        PRESENT
                                    </span>

                                </label>


                                <label
                                    class="attendance-radio absent"
                                >

                                    <input
                                        type="radio"
                                        name="admin_attendance_${student.id}"
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


        updateAdminAttendanceCount();

    }
    catch (error) {

        console.error(
            "ADMIN ATTENDANCE ERROR:",
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

function adminMarkAllPresent() {

    document
        .querySelectorAll(
            '#adminAttendanceStudentList input[value="PRESENT"]'
        )
        .forEach(input => {

            input.checked = true;

        });


    updateAdminAttendanceCount();
}


/* =====================================================
   MARK ALL ABSENT
===================================================== */

function adminMarkAllAbsent() {

    document
        .querySelectorAll(
            '#adminAttendanceStudentList input[value="ABSENT"]'
        )
        .forEach(input => {

            input.checked = true;

        });


    updateAdminAttendanceCount();
}


/* =====================================================
   ATTENDANCE COUNT
===================================================== */

function updateAdminAttendanceCount() {

    const present =
        document.querySelectorAll(
            '#adminAttendanceStudentList input[value="PRESENT"]:checked'
        ).length;


    const absent =
        document.querySelectorAll(
            '#adminAttendanceStudentList input[value="ABSENT"]:checked'
        ).length;


    const presentElement =
        document.getElementById(
            "adminPresentCount"
        );


    const absentElement =
        document.getElementById(
            "adminAbsentCount"
        );


    if (presentElement) {

        presentElement.textContent =
            present;

    }


    if (absentElement) {

        absentElement.textContent =
            absent;

    }
}


/* =====================================================
   SAVE ADMIN ATTENDANCE
===================================================== */

async function saveAdminAttendance() {

    const dateElement =
        document.getElementById(
            "adminAttendanceDate"
        );


    if (!dateElement) {
        return;
    }


    const date =
        dateElement.value;


    if (!date) {

        alert(
            "Please select attendance date."
        );

        return;
    }


    const rows =
        document.querySelectorAll(
            "#adminAttendanceStudentList .attendance-student-row"
        );


    if (rows.length === 0) {

        alert(
            "No students available."
        );

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
            "adminSaveAttendanceButton"
        );


    if (saveButton) {

        saveButton.disabled = true;

        saveButton.textContent =
            "SUBMITTING...";

    }


    try {

        const response =
            await fetch(
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


        if (!response.ok ||
            !result.success) {

            alert(
                result.message ||
                "Unable to save attendance."
            );

            return;
        }


        alert(
            "Attendance submitted successfully."
        );


        await loadAdminAttendance();

    }
    catch (error) {

        console.error(
            "ADMIN ATTENDANCE SAVE ERROR:",
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
                "SUBMIT ATTENDANCE";

        }
    }
}


/* =====================================================
   ESCAPE TEXT
===================================================== */

function escapeAdminAttendanceText(value) {

    if (value === null ||
        value === undefined) {

        return "";
    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
// ================================
// STUDENT 360
// ================================

async function searchStudent360() {

    const searchInput = document.getElementById("student360Search");
    const resultsBox = document.getElementById("student360Results");
    const profileBox = document.getElementById("student360Profile");

    if (!searchInput || !resultsBox) {
        console.error("Student 360 elements not found.");
        return;
    }

    const searchValue = searchInput.value.trim().toLowerCase();

    profileBox.innerHTML = "";

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

        const response = await fetch("/api/admin/students");

        const result = await response.json();

        if (!response.ok || !result.success) {
            resultsBox.innerHTML = `
                <p>Unable to load students.</p>
            `;
            return;
        }

        const students = result.students || [];

        const matches = students.filter(student => {

            const name = String(student.full_name || "").toLowerCase();
            const registration = String(
                student.registration_number || ""
            ).toLowerCase();
            const userId = String(
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

        resultsBox.innerHTML = matches.map(student => {

            return `
                <div class="student360-result-card">

                    <div>
                        <strong>
                            ${escapeText(student.full_name)}
                        </strong>

                        <span>
                            ${escapeText(
                                student.registration_number || "-"
                            )}
                        </span>
                    </div>

                    <button
                        type="button"
                        onclick="viewStudent360(${student.id})"
                    >
                        VIEW 360
                    </button>

                </div>
            `;

        }).join("");

    } catch (error) {

        console.error("STUDENT 360 SEARCH ERROR:", error);

        resultsBox.innerHTML = `
            <p>Unable to connect to server.</p>
        `;
    }
}


// ================================
// VIEW STUDENT 360
// ================================

async function viewStudent360(studentId) {

    const profileBox = document.getElementById("student360Profile");

    if (!profileBox) {
        return;
    }

    profileBox.innerHTML = `
        <p>Loading student profile...</p>
    `;

    try {

        const response = await fetch("/api/admin/students");

        const result = await response.json();

        if (!response.ok || !result.success) {
            profileBox.innerHTML = `
                <p>Unable to load student profile.</p>
            `;
            return;
        }

        const student = (result.students || []).find(
            item => Number(item.id) === Number(studentId)
        );

        if (!student) {
            profileBox.innerHTML = `
                <p>Student not found.</p>
            `;
            return;
        }

        profileBox.innerHTML = `

            <div class="student360-profile-card">

                <div class="student360-profile-header">

                    <div class="student360-photo">

                        ${
                            student.photo_path
                            ?
                            `<img
                                src="/static/${escapeText(student.photo_path)}"
                                alt="Student Photo"
                            >`
                            :
                            `<div class="student360-avatar">
                                ${
                                    escapeText(
                                        student.full_name
                                            ? student.full_name
                                                .charAt(0)
                                                .toUpperCase()
                                            : "?"
                                    )
                                }
                            </div>`
                        }

                    </div>

                    <div>

                        <h2>
                            ${escapeText(student.full_name)}
                        </h2>

                        <p>
                            User ID:
                            ${escapeText(student.user_id || "-")}
                        </p>

                        <p>
                            Registration No:
                            ${escapeText(
                                student.registration_number || "-"
                            )}
                        </p>

                        <span class="student360-status">
                            ${escapeText(student.status || "-")}
                        </span>

                    </div>

                </div>


                <div class="student360-section">

                    <h3>PERSONAL DETAILS</h3>

                    <div class="student360-grid">

                        <div>
                            <span>DOB</span>
                            <strong>
                                ${escapeText(student.dob || "-")}
                            </strong>
                        </div>

                        <div>
                            <span>GENDER</span>
                            <strong>
                                ${escapeText(student.gender || "-")}
                            </strong>
                        </div>

                        <div>
                            <span>MOBILE</span>
                            <strong>
                                ${escapeText(
                                    student.student_mobile || "-"
                                )}
                            </strong>
                        </div>

                        <div>
                            <span>EMAIL</span>
                            <strong>
                                ${escapeText(student.email || "-")}
                            </strong>
                        </div>

                    </div>

                </div>


                <div class="student360-section">

                    <h3>PARENT / EMERGENCY</h3>

                    <div class="student360-grid">

                        <div>
                            <span>PARENT NAME</span>
                            <strong>
                                ${escapeText(
                                    student.parent_name || "-"
                                )}
                            </strong>
                        </div>

                        <div>
                            <span>PARENT MOBILE</span>
                            <strong>
                                ${escapeText(
                                    student.parent_mobile || "-"
                                )}
                            </strong>
                        </div>

                        <div>
                            <span>EMERGENCY CONTACT</span>
                            <strong>
                                ${escapeText(
                                    student.emergency_contact || "-"
                                )}
                            </strong>
                        </div>

                    </div>

                </div>


                <div class="student360-section">

                    <h3>ADDRESS</h3>

                    <p>
                        ${escapeText(student.address || "-")}
                    </p>

                </div>


                <div class="student360-section">

                    <h3>TRAINING DETAILS</h3>

                    <div class="student360-grid">

                        <div>
                            <span>EXPERIENCE</span>
                            <strong>
                                ${escapeText(
                                    student.experience || "-"
                                )}
                            </strong>
                        </div>

                        <div>
                            <span>PREVIOUS TRAINING</span>
                            <strong>
                                ${escapeText(
                                    student.previous_training || "-"
                                )}
                            </strong>
                        </div>

                    </div>

                </div>


                <div class="student360-section">

                    <h3>ATTENDANCE</h3>

                    <div class="student360-attendance">

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

        console.error("STUDENT 360 ERROR:", error);

        profileBox.innerHTML = `
            <p>Unable to load student profile.</p>
        `;
    }
}
/* =====================================================
   ADMIN ANNOUNCEMENTS
===================================================== */


/* =====================================================
   OPEN ANNOUNCEMENT FORM
===================================================== */

function openAnnouncementForm() {

    const form =
        document.getElementById("announcementForm");

    const title =
        document.getElementById("announcementTitle");

    const message =
        document.getElementById("announcementMessage");

    const error =
        document.getElementById("announcementFormError");


    if (form) {
        form.style.display = "block";
    }

    if (title) {
        title.value = "";
        title.focus();
    }

    if (message) {
        message.value = "";
    }

    if (error) {
        error.textContent = "";
    }
}


/* =====================================================
   CLOSE ANNOUNCEMENT FORM
===================================================== */

function closeAnnouncementForm() {

    const form =
        document.getElementById("announcementForm");

    const error =
        document.getElementById("announcementFormError");


    if (form) {
        form.style.display = "none";
    }

    if (error) {
        error.textContent = "";
    }
}


/* =====================================================
   PUBLISH ANNOUNCEMENT
===================================================== */

async function publishAnnouncement() {

    const titleInput =
        document.getElementById("announcementTitle");

    const messageInput =
        document.getElementById("announcementMessage");

    const errorBox =
        document.getElementById("announcementFormError");

    const publishButton =
        document.querySelector(
            ".announcement-publish-btn"
        );


    const title =
        titleInput.value.trim();

    const message =
        messageInput.value.trim();


    if (errorBox) {
        errorBox.textContent = "";
    }


    /* VALIDATION */

    if (!title) {

        errorBox.textContent =
            "Please enter announcement title.";

        titleInput.focus();

        return;
    }


    if (!message) {

        errorBox.textContent =
            "Please enter announcement message.";

        messageInput.focus();

        return;
    }


    if (publishButton) {

        publishButton.disabled = true;

        publishButton.textContent =
            "PUBLISHING...";
    }


    try {

        const response =
            await fetch(
                "/api/admin/announcements",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        title: title,
                        message: message
                    })
                }
            );


        const result =
            await response.json();


        if (
            !response.ok ||
            !result.success
        ) {

            if (errorBox) {

                errorBox.textContent =
                    result.message ||
                    "Unable to publish announcement.";
            }

            return;
        }


        alert(
            "Announcement published successfully."
        );


        closeAnnouncementForm();


        await loadAdminAnnouncements();


    } catch (error) {

        console.error(
            "PUBLISH ANNOUNCEMENT ERROR:",
            error
        );


        if (errorBox) {

            errorBox.textContent =
                "Unable to connect to server.";
        }

    } finally {

        if (publishButton) {

            publishButton.disabled = false;

            publishButton.textContent =
                "📢 PUBLISH";
        }
    }
}


/* =====================================================
   LOAD ANNOUNCEMENTS
===================================================== */

async function loadAdminAnnouncements() {

    const container =
        document.getElementById(
            "adminAnnouncementsList"
        );


    if (!container) {
        return;
    }


    try {

        const response =
            await fetch(
                "/api/admin/announcements"
            );


        const result =
            await response.json();


        if (
            !response.ok ||
            !result.success
        ) {

            container.innerHTML = `
                <div class="announcement-loading">
                    ${escapeAdminAnnouncementText(
                        result.message ||
                        "Unable to load announcements."
                    )}
                </div>
            `;

            return;
        }


        const announcements =
            result.announcements || [];


        if (announcements.length === 0) {

            container.innerHTML = `
                <div class="announcement-empty">

                    <div class="announcement-empty-icon">
                        📢
                    </div>

                    <h3>No Announcements</h3>

                    <p>
                        Publish important academy
                        updates for students and staff.
                    </p>

                </div>
            `;

            return;
        }


        container.innerHTML =
            announcements.map(
                function (item) {

                    return `
                        <div
                            class="admin-announcement-card"
                            data-id="${item.id}"
                        >

                            <div class="admin-announcement-icon">
                                📢
                            </div>


                            <div class="admin-announcement-content">

                                <h3>
                                    ${escapeAdminAnnouncementText(
                                        item.title
                                    )}
                                </h3>

                                <p>
                                    ${escapeAdminAnnouncementText(
                                        item.message
                                    )}
                                </p>


                                <div
                                    class="admin-announcement-meta"
                                >

                                    <span>
                                        Posted by
                                        ${escapeAdminAnnouncementText(
                                            item.posted_by ||
                                            "Admin"
                                        )}
                                    </span>

                                    <span>
                                        ${escapeAdminAnnouncementText(
                                            formatMessageDate(item.created_at) ||
                                            ""
                                        )}
                                    </span>

                                </div>

                            </div>


                            <div
                                class="admin-announcement-actions"
                            >

                                <button
                                    type="button"
                                    onclick="deleteAnnouncement(${item.id})"
                                >
                                    DELETE
                                </button>

                            </div>

                        </div>
                    `;
                }
            ).join("");


    } catch (error) {

        console.error(
            "LOAD ANNOUNCEMENTS ERROR:",
            error
        );


        container.innerHTML = `
            <div class="announcement-loading">
                Unable to connect to server.
            </div>
        `;
    }
}


/* =====================================================
   DELETE ANNOUNCEMENT
===================================================== */

async function deleteAnnouncement(
    announcementId
) {

    const confirmDelete =
        confirm(
            "Are you sure you want to delete this announcement?"
        );


    if (!confirmDelete) {
        return;
    }


    try {

        const response =
            await fetch(
                `/api/admin/announcements/${announcementId}`,
                {
                    method: "DELETE"
                }
            );


        const result =
            await response.json();


        if (
            !response.ok ||
            !result.success
        ) {

            alert(
                result.message ||
                "Unable to delete announcement."
            );

            return;
        }


        await loadAdminAnnouncements();


    } catch (error) {

        console.error(
            "DELETE ANNOUNCEMENT ERROR:",
            error
        );


        alert(
            "Unable to connect to server."
        );
    }
}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeAdminAnnouncementText(
    value
) {

    if (value === null ||
        value === undefined) {

        return "";
    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
/* =====================================================
   ADMIN MESSAGES
===================================================== */

async function loadAdminMessages() {

    const container =
        document.getElementById(
            "adminMessagesList"
        );

    if (!container) {
        return;
    }

    try {

        const response =
            await fetch(
                "/api/admin/messages"
            );

        const result =
            await response.json();


        if (
            !response.ok ||
            !result.success
        ) {

            container.innerHTML = `
                <div class="admin-message-loading">
                    ${
                        escapeAdminMessageText(
                            result.message ||
                            "Unable to load messages."
                        )
                    }
                </div>
            `;

            return;
        }


        const messages =
            result.messages || [];


        if (messages.length === 0) {

            container.innerHTML = `

                <div class="empty-panel">

                    <div>💬</div>

                    <h3>No Messages</h3>

                    <p>
                        Student messages to the
                        administration will appear here.
                    </p>

                </div>

            `;

            return;
        }


        container.innerHTML =
            messages.map(function(item) {

                const status =
                    String(
                        item.status || "NEW"
                    ).toUpperCase();


                return `

                    <div
                        class="admin-message-card"
                        data-id="${item.id}"
                    >

                        <div
                            class="admin-message-icon"
                        >
                            💬
                        </div>


                        <div
                            class="admin-message-content"
                        >

                            <div
                                class="admin-message-top"
                            >

                                <div>

                                    <strong>
                                        ${
                                            escapeAdminMessageText(
                                                item.sender_name ||
                                                item.sender_id
                                            )
                                        }
                                    </strong>

                                    <span>
                                        ${
                                            escapeAdminMessageText(
                                                item.sender_id
                                            )
                                        }
                                    </span>

                                </div>


                                <span
                                    class="admin-message-status ${status.toLowerCase()}"
                                >
                                    ${status}
                                </span>

                            </div>


                            <h4>
                                ${
                                    escapeAdminMessageText(
                                        item.subject ||
                                        "Message"
                                    )
                                }
                            </h4>


                            <p>
                                ${
                                    escapeAdminMessageText(
                                        item.message
                                    )
                                }
                            </p>


                            <small>
                                ${
                                    escapeAdminMessageText(
                                        formatMessageDate(item.created_at) || ""
                                    )
                                }
                            </small>
                            <div class="admin-message-actions">

    <button
        type="button"
        onclick="openReplyBox(${item.id}, '${escapeAdminMessageText(item.sender_id)}', '${escapeAdminMessageText(item.sender_name || item.sender_id)}')"
    >
        REPLY
    </button>

</div>

                        </div>

                    </div>

                `;

            }).join("");


    } catch (error) {

        console.error(
            "LOAD ADMIN MESSAGES ERROR:",
            error
        );

        container.innerHTML = `
            <div class="admin-message-loading">
                Unable to connect to server.
            </div>
        `;
    }
}


function escapeAdminMessageText(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
function formatMessageDate(dateValue) {

    if (!dateValue) {
        return "";
    }

    const utcDate =
        new Date(
            dateValue.replace(" ", "T") + "Z"
        );

    if (isNaN(utcDate.getTime())) {
        return dateValue;
    }

    return utcDate.toLocaleString(
        "en-IN",
        {
            timeZone: "Asia/Kolkata",
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        }
    );
}
function openReplyBox(
    messageId,
    receiverId,
    receiverName
) {

    const existing =
        document.getElementById(
            "adminReplyBox"
        );

    if (existing) {
        existing.remove();
    }

    const card =
        document.querySelector(
            `.admin-message-card[data-id="${messageId}"]`
        );

    if (!card) {
        return;
    }

    const replyBox =
        document.createElement("div");

    replyBox.id =
        "adminReplyBox";

    replyBox.className =
        "admin-reply-box";

    replyBox.innerHTML = `

        <div class="admin-reply-title">
            Reply to ${escapeAdminMessageText(receiverName)}
        </div>

        <textarea
            id="adminReplyMessage"
            placeholder="Type your reply..."
            rows="4"
        ></textarea>

        <div class="admin-reply-actions">

            <button
                type="button"
                onclick="closeReplyBox()"
            >
                CANCEL
            </button>

            <button
                type="button"
                onclick="sendAdminReply(
                    ${messageId},
                    '${escapeAdminMessageText(receiverId)}'
                )"
            >
                SEND REPLY
            </button>

        </div>

    `;

    card.appendChild(replyBox);

    document
        .getElementById("adminReplyMessage")
        .focus();
}
async function sendAdminReply(messageId, receiverId) {

    const messageElement =
        document.getElementById(
            "adminReplyMessage"
        );

    if (!messageElement) {
        return;
    }

    const message =
        messageElement.value.trim();

    if (!message) {

        alert("Please enter your reply.");

        messageElement.focus();

        return;
    }

    try {

        const response =
            await fetch(
                `/api/admin/messages/${messageId}/reply`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        receiver_id: receiverId,
                        message: message
                    })
                }
            );

        const result =
            await response.json();

        if (!response.ok || !result.success) {

            alert(
                result.message ||
                "Unable to send reply."
            );

            return;
        }

        alert(
            "Reply sent successfully."
        );

        closeReplyBox();

        await loadAdminMessages();

    } catch (error) {

        console.error(
            "SEND ADMIN REPLY ERROR:",
            error
        );

        alert(
            "Unable to connect to server."
        );
    }
}

function closeReplyBox() {

    const replyBox =
        document.getElementById(
            "adminReplyBox"
        );

    if (replyBox) {
        replyBox.remove();
    }
}