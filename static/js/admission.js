document.addEventListener("DOMContentLoaded", function () {

    console.log("ADMISSION JS LOADED");

    const form = document.getElementById("admissionForm");
    const message = document.getElementById("applicationMessage");
    const submitButton = document.getElementById("submitApplication");

    if (!form) {
        console.error("admissionForm NOT FOUND");
        return;
    }

    console.log("Admission form connected.");

    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        console.log("SUBMIT BUTTON CLICKED");

        message.className = "application-message";
        message.textContent = "";

        submitButton.disabled = true;
        submitButton.textContent = "SUBMITTING...";

        const formData = new FormData(form);

        try {

            console.log("Sending application to Flask...");

            const response = await fetch("/api/admission", {
                method: "POST",
                body: formData
            });

            console.log("Server response:", response.status);

            const result = await response.json();

            console.log("API result:", result);

            if (!response.ok || !result.success) {

                message.textContent =
                    result.message ||
                    "Application submission failed.";

                message.classList.add(
                    "show",
                    "error"
                );

                submitButton.disabled = false;
                submitButton.textContent =
                    "SUBMIT APPLICATION";

                return;
            }

            message.textContent =
                "Application submitted successfully! " +
                "Application ID: " +
                result.application.application_id;

            message.classList.add(
                "show",
                "success"
            );

            form.reset();

            submitButton.disabled = false;
            submitButton.textContent =
                "APPLICATION SUBMITTED";

        } catch (error) {

            console.error("SUBMIT ERROR:", error);

            message.textContent =
                "Unable to connect to server.";

            message.classList.add(
                "show",
                "error"
            );

            submitButton.disabled = false;
            submitButton.textContent =
                "SUBMIT APPLICATION";
        }

    });

});