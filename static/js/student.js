/* =====================================================
   STUDENT DASHBOARD INITIALIZATION
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    loadStudentProfile();
    
    loadStudentAttendance();

    loadStudentAnnouncements();

    loadStudentMessages();

});


/* =====================================================
   SECTION SWITCHING
===================================================== */

function showStudentSection(sectionId, button) {

    const sections =
        document.querySelectorAll(".student-section");

    sections.forEach(section => {
        section.classList.remove(
            "active-student-section"
        );
    });


    const selectedSection =
        document.getElementById(sectionId);

    if (selectedSection) {
        selectedSection.classList.add(
            "active-student-section"
        );
    }


    const buttons =
        document.querySelectorAll(
            ".student-nav button"
        );

    buttons.forEach(btn => {
        btn.classList.remove("active");
    });

    if (sectionId === "messages") {
    loadStudentMessages();
}

    if (button) {
        button.classList.add("active");
    }


    /* Update page title */

    const pageTitle =
        document.getElementById(
            "studentPageTitle"
        );


    const titles = {

        overview: "Dashboard",

        profile: "My Profile",

        timing: "My Timing",

        attendance: "My Attendance",

        announcements: "Announcements",

        contactAdmin:"ContactAdmin",

        messages: "Messages",

        password: "Change Password"

    };


    if (
        pageTitle &&
        titles[sectionId]
    ) {

        pageTitle.textContent =
            titles[sectionId];

    }


    /* Load attendance whenever
       My Attendance is opened */

    if (sectionId === "attendance") {

        loadStudentAttendance();

    }
    if (sectionId === "announcements") {

    loadStudentAnnouncements();

}
}


/* =====================================================
   LOAD STUDENT PROFILE
===================================================== */

async function loadStudentProfile() {

    try {

        const response =
            await fetch(
                "/api/student/profile"
            );


        const result =
            await response.json();


        if (
            !response.ok ||
            !result.success
        ) {

            console.error(
                result.message ||
                "Unable to load student profile."
            );

            return;

        }


        const p = result.profile;


        /* =================================================
           SIDEBAR
        ================================================= */

        setText(
            "studentName",
            p.full_name
        );

        setText(
            "studentReg",
            p.registration_number
        );


        /* =================================================
           DASHBOARD
        ================================================= */

        setText(
            "welcomeName",
            p.full_name
        );

        setText(
            "overviewReg",
            p.registration_number
        );


        setText(
            "overviewBatch",
            p.preferred_batch ||
            "Not Assigned"
        );


        /* =================================================
           PROFILE FORM
        ================================================= */

        setValue(
            "studentFullName",
            p.full_name
        );

        setValue(
            "studentDOB",
            p.dob
        );

        setValue(
            "studentGender",
            p.gender
        );

        setValue(
            "studentMobile",
            p.student_mobile
        );

        setValue(
            "studentEmail",
            p.email
        );

        setValue(
            "parentName",
            p.parent_name
        );

        setValue(
            "parentMobile",
            p.parent_mobile
        );

        setValue(
            "emergencyContact",
            p.emergency_contact
        );

        setValue(
            "studentAddress",
            p.address
        );

        setValue(
            "studentExperience",
            p.experience
        );

        setValue(
            "previousTraining",
            p.previous_training
        );

        setValue(
            "preferredBatch",
            p.preferred_batch
        );

        setValue(
            "preferredDays",
            p.preferred_days
        );


        /* =================================================
           DASHBOARD / PROFILE DISPLAY
        ================================================= */

        setText(
            "dashboardName",
            p.full_name
        );

        setText(
            "dashboardRegistration",
            p.registration_number
        );

        setText(
            "dashboardMobile",
            p.student_mobile
        );

        setText(
            "dashboardEmail",
            p.email
        );

        setText(
            "dashboardParent",
            p.parent_name
        );

        setText(
            "dashboardParentMobile",
            p.parent_mobile
        );

        setText(
            "dashboardAddress",
            p.address
        );

        setText(
            "dashboardExperience",
            p.experience
        );

        setText(
            "dashboardBatch",
            p.preferred_batch
        );


        /* =================================================
           ONE-TIME EDIT STATUS
        ================================================= */

        if (
            p.student_profile_edited == 1
        ) {

            lockStudentProfile();

        } else {

            unlockStudentProfile();

        }

    }

    catch (error) {

        console.error(
            "Profile loading error:",
            error
        );

    }

}


/* =====================================================
   SAVE STUDENT PROFILE
===================================================== */

async function saveStudentProfile() {

    const data = {

        student_mobile:
            getValue(
                "studentMobile"
            ),

        email:
            getValue(
                "studentEmail"
            ),

        parent_name:
            getValue(
                "parentName"
            ),

        parent_mobile:
            getValue(
                "parentMobile"
            ),

        emergency_contact:
            getValue(
                "emergencyContact"
            ),

        address:
            getValue(
                "studentAddress"
            )

    };


    try {

        const response =
            await fetch(
                "/api/student/profile",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(data)
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
                "Unable to save profile."
            );

            return;

        }


        alert(
            "Profile saved successfully.\n\n" +
            "Further changes require Admin or Timing Master permission."
        );


        await loadStudentProfile();

    }

    catch (error) {

        console.error(
            "Save profile error:",
            error
        );

        alert(
            "Unable to connect to server."
        );

    }

}


/* =====================================================
   LOCK STUDENT PROFILE
===================================================== */

function lockStudentProfile() {

    const editableFields = [

        "studentMobile",

        "studentEmail",

        "parentName",

        "parentMobile",

        "emergencyContact",

        "studentAddress"

    ];


    editableFields.forEach(id => {

        const element =
            document.getElementById(id);


        if (element) {

            element.disabled = true;

        }

    });


    const saveButton =
        document.getElementById(
            "saveProfileButton"
        );


    if (saveButton) {

        saveButton.disabled = true;

        saveButton.textContent =
            "PROFILE ALREADY SAVED";

    }

}


/* =====================================================
   UNLOCK STUDENT PROFILE
===================================================== */

function unlockStudentProfile() {

    const editableFields = [

        "studentMobile",

        "studentEmail",

        "parentName",

        "parentMobile",

        "emergencyContact",

        "studentAddress"

    ];


    editableFields.forEach(id => {

        const element =
            document.getElementById(id);


        if (element) {

            element.disabled = false;

        }

    });


    const saveButton =
        document.getElementById(
            "saveProfileButton"
        );


    if (saveButton) {

        saveButton.disabled = false;

        saveButton.textContent =
            "SAVE PROFILE";

    }

}


/* =====================================================
   GET VALUE
===================================================== */

function getValue(id) {

    const element =
        document.getElementById(id);


    if (!element) {

        return "";

    }


    return element.value.trim();

}


/* =====================================================
   SET VALUE
===================================================== */

function setValue(id, value) {

    const element =
        document.getElementById(id);


    if (element) {

        element.value =
            value || "";

    }

}


/* =====================================================
   SET TEXT
===================================================== */

function setText(id, value) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value || "-";

    }

}


/* =====================================================
   LOGOUT
===================================================== */

async function logoutStudent() {

    try {

        const response =
            await fetch(
                "/api/logout",
                {
                    method: "POST"
                }
            );


        const result =
            await response.json();


        if (result.success) {

            window.location.href =
                "/login";

        }

    }

    catch (error) {

        console.error(
            "Logout error:",
            error
        );

        window.location.href =
            "/login";

    }

}


/* =====================================================
   SEND MESSAGE
===================================================== */

async function sendStudentMessage() {

    const messageElement =
        document.getElementById("studentMessage");

    if (!messageElement) {
        return;
    }

    const message =
        messageElement.value.trim();

    if (!message) {

        alert("Please enter your message.");

        return;
    }

    try {

        const response =
            await fetch(
                "/api/student/messages",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        message: message
                    })
                }
            );

        const result =
            await response.json();

        if (!response.ok || !result.success) {

            alert(
                result.message ||
                "Unable to send message."
            );

            return;
        }

        alert(
            "Message sent successfully to Admin."
        );

        messageElement.value = "";

    } catch (error) {

        console.error(
            "SEND STUDENT MESSAGE ERROR:",
            error
        );

        alert(
            "Unable to connect to server."
        );
    }
}


/* =====================================================
   CHANGE PASSWORD
===================================================== */

async function changeStudentPassword() {

    const currentPassword =
        document.getElementById(
            "currentPassword"
        )?.value || "";


    const newPassword =
        document.getElementById(
            "newPassword"
        )?.value || "";


    const confirmPassword =
        document.getElementById(
            "confirmPassword"
        )?.value || "";


    if (
        !currentPassword ||
        !newPassword ||
        !confirmPassword
    ) {

        alert(
            "Please fill all password fields."
        );

        return;

    }


    if (
        newPassword !==
        confirmPassword
    ) {

        alert(
            "New passwords do not match."
        );

        return;

    }


    try {

        const response =
            await fetch(
                "/api/change-password",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            current_password:
                                currentPassword,

                            new_password:
                                newPassword,

                            confirm_password:
                                confirmPassword

                        })
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
                "Unable to change password."
            );

            return;

        }


        alert(
            "Password changed successfully."
        );


        const currentPasswordElement =
            document.getElementById(
                "currentPassword"
            );

        const newPasswordElement =
            document.getElementById(
                "newPassword"
            );

        const confirmPasswordElement =
            document.getElementById(
                "confirmPassword"
            );


        if (currentPasswordElement) {
            currentPasswordElement.value = "";
        }

        if (newPasswordElement) {
            newPasswordElement.value = "";
        }

        if (confirmPasswordElement) {
            confirmPasswordElement.value = "";
        }

    }

    catch (error) {

        console.error(
            "Password change error:",
            error
        );

        alert(
            "Unable to connect to server."
        );

    }

}


/* =====================================================
   STUDENT ATTENDANCE
===================================================== */

async function loadStudentAttendance() {

    console.log(
        "LOAD STUDENT ATTENDANCE CALLED"
    );


    const nameElement =
        document.getElementById(
            "attendanceStudentName"
        );


    const userIdElement =
        document.getElementById(
            "attendanceStudentUserId"
        );


    const totalElement =
        document.getElementById(
            "attendanceTotalDays"
        );


    const presentElement =
        document.getElementById(
            "attendancePresentDays"
        );


    const absentElement =
        document.getElementById(
            "attendanceAbsentDays"
        );


    /*
       IMPORTANT:
       Dashboard may also have an element
       called attendancePercentage.

       Therefore first try the dedicated
       My Attendance ID.

       If it does not exist, target the
       percentage element inside the
       attendance section.
    */

    const percentageElements =
    document.querySelectorAll(
        "#attendancePercentage, #myAttendancePercentage"
    );


    const tableBody =
        document.getElementById(
            "studentAttendanceTableBody"
        );


    if (!tableBody) {

        console.error(
            "Student attendance elements not found."
        );

        return;

    }


    tableBody.innerHTML = `
        <tr>
            <td colspan="2" class="attendance-loading">
                Loading attendance...
            </td>
        </tr>
    `;


    try {

        const response =
            await fetch(
                "/api/student/attendance"
            );


        const result =
            await response.json();


        console.log(
            "STUDENT ATTENDANCE:",
            result
        );


        if (
            !response.ok ||
            !result.success
        ) {

            tableBody.innerHTML = `
                <tr>
                    <td
                        colspan="2"
                        class="attendance-loading"
                    >
                        ${escapeStudentAttendanceText(
                            result.message ||
                            "Unable to load attendance."
                        )}
                    </td>
                </tr>
            `;

            return;

        }


        /* =================================================
           STUDENT DETAILS
        ================================================= */

        if (nameElement) {

            nameElement.textContent =
                result.student.full_name ||
                "-";

        }


        if (userIdElement) {

            userIdElement.textContent =
                result.student.user_id ||
                "-";

        }


        /* =================================================
           SUMMARY
        ================================================= */

        const summary =
            result.summary || {};


        if (totalElement) {

            totalElement.textContent =
                summary.total_days ?? 0;

        }


        if (presentElement) {

            presentElement.textContent =
                summary.present_days ?? 0;

        }


        if (absentElement) {

            absentElement.textContent =
                summary.absent_days ?? 0;

        }


        percentageElements.forEach(function (element) {

    element.textContent =
        `${summary.attendance_percentage ?? 0}%`;

});


        /* =================================================
           ATTENDANCE RECORDS
        ================================================= */

        const attendance =
            result.attendance || [];


        if (attendance.length === 0) {

            tableBody.innerHTML = `
                <tr>
                    <td
                        colspan="2"
                        class="attendance-loading"
                    >
                        No attendance records found.
                    </td>
                </tr>
            `;

            return;

        }


        tableBody.innerHTML =
            attendance.map(
                function (record) {

                    const status =
                        String(
                            record.status || ""
                        ).toUpperCase();


                    const statusClass =
                        status === "PRESENT"
                            ? "attendance-present"
                            : "attendance-absent";


                    return `
                        <tr>

                            <td>
                                ${escapeStudentAttendanceText(
                                    formatAttendanceDate(
                                        record.date
                                    )
                                )}
                            </td>

                            <td>
                                <span
                                    class="${statusClass}"
                                >
                                    ${escapeStudentAttendanceText(
                                        status
                                    )}
                                </span>
                            </td>

                        </tr>
                    `;

                }
            ).join("");


    }

    catch (error) {

        console.error(
            "STUDENT ATTENDANCE ERROR:",
            error
        );


        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="2"
                    class="attendance-loading"
                >
                    Unable to connect to server.
                </td>
            </tr>
        `;

    }

}


/* =====================================================
   FORMAT ATTENDANCE DATE
===================================================== */

function formatAttendanceDate(dateString) {

    if (!dateString) {

        return "-";

    }


    const parts =
        dateString.split("-");


    if (parts.length !== 3) {

        return dateString;

    }


    return `${parts[2]}-${parts[1]}-${parts[0]}`;

}


/* =====================================================
   ESCAPE ATTENDANCE TEXT
===================================================== */

function escapeStudentAttendanceText(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}
async function loadStudentAnnouncements() {

    console.log("LOAD STUDENT ANNOUNCEMENTS CALLED");

    const container =
        document.getElementById("studentAnnouncementsList");

    if (!container) {
        console.error(
            "studentAnnouncementsList NOT FOUND"
        );
        return;
    }

    try {

        const response =
            await fetch("/api/announcements");

        const result =
            await response.json();

        console.log(
            "ANNOUNCEMENT API RESULT:",
            result
        );

        if (!response.ok || !result.success) {

            container.innerHTML = `
                <div class="announcement-item">

                    <div class="announcement-icon">
                        ⚠️
                    </div>

                    <div>

                        <strong>
                            Unable to load announcements
                        </strong>

                    </div>

                </div>
            `;

            return;
        }

        const announcements =
            result.announcements || [];

        if (announcements.length === 0) {

            container.innerHTML = `
                <div class="announcement-item">

                    <div class="announcement-icon">
                        📢
                    </div>

                    <div>

                        <strong>
                            No Announcements
                        </strong>

                        <p>
                            No academy updates available.
                        </p>

                    </div>

                </div>
            `;

            return;
        }

        container.innerHTML =
            announcements.map(function(item) {

                return `
                    <div class="announcement-item">

                        <div class="announcement-icon">
                            📢
                        </div>

                        <div>

                            <strong>
                                ${escapeStudentAnnouncementText(
                                    item.title
                                )}
                            </strong>

                            <p>
                                ${escapeStudentAnnouncementText(
                                    item.message
                                )}
                            </p>

                            <small>
                                ${escapeStudentAnnouncementText(
                                    item.created_at || ""
                                )}
                            </small>

                        </div>

                    </div>
                `;

            }).join("");

        console.log(
            "STUDENT ANNOUNCEMENTS RENDERED"
        );

    } catch (error) {

        console.error(
            "STUDENT ANNOUNCEMENTS ERROR:",
            error
        );

        container.innerHTML = `
            <div class="announcement-item">

                <div class="announcement-icon">
                    ⚠️
                </div>

                <div>

                    <strong>
                        Unable to connect to server.
                    </strong>

                </div>

            </div>
        `;
    }
}
/* =====================================================
   ESCAPE ANNOUNCEMENT TEXT
===================================================== */

function escapeStudentAnnouncementText(value) {

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
/* =====================================================
   STUDENT MESSAGES
===================================================== */

async function loadStudentMessages() {

    const container =
        document.getElementById(
            "studentMessagesList"
        );

    if (!container) {
        return;
    }

    try {

        const response =
            await fetch(
                "/api/student/messages"
            );

        const result =
            await response.json();

        if (
            !response.ok ||
            !result.success
        ) {

            container.innerHTML = `
                <div class="student-message-loading">
                    ${
                        escapeStudentMessageText(
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
                <div class="student-message-empty">

                    <div>💬</div>

                    <h3>No Messages</h3>

                    <p>
                        Messages from Admin will
                        appear here.
                    </p>

                </div>
            `;

            return;
        }

        container.innerHTML =
            messages.map(function(item) {

                return `
                    <div
                        class="student-message-card"
                    >

                        <div
                            class="student-message-icon"
                        >
                            💬
                        </div>

                        <div
                            class="student-message-content"
                        >

                            <div
                                class="student-message-top"
                            >

                                <strong>
                                    ${
                                        escapeStudentMessageText(
                                            item.sender_id === "ADM001"
                                                ? "Admin"
                                                : item.sender_id
                                        )
                                    }
                                </strong>

                                <span>
                                    ${
                                        escapeStudentMessageText(
                                            String(
                                                item.status ||
                                                "NEW"
                                            ).toUpperCase()
                                        )
                                    }
                                </span>

                            </div>

                            <h4>
                                ${
                                    escapeStudentMessageText(
                                        item.subject ||
                                        "Message"
                                    )
                                }
                            </h4>

                            <p>
                                ${
                                    escapeStudentMessageText(
                                        item.message
                                    )
                                }
                            </p>

                            <small>
                                ${
                                    escapeStudentMessageText(
                                        formatMessageDate(
                                            item.created_at
                                        ) || ""
                                    )
                                }
                            </small>

                        </div>

                    </div>
                `;

            }).join("");

    } catch (error) {

        console.error(
            "LOAD STUDENT MESSAGES ERROR:",
            error
        );

        container.innerHTML = `
            <div class="student-message-loading">
                Unable to connect to server.
            </div>
        `;
    }
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

function escapeStudentMessageText(value) {

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