function togglePassword() {

    const password =
        document.getElementById("password");

    const button =
        document.querySelector(".show-password");


    if (password.type === "password") {

        password.type = "text";
        button.textContent = "HIDE";

    } else {

        password.type = "password";
        button.textContent = "SHOW";

    }
}


async function loginUser() {

    const userId =
        document.getElementById("userId")
        .value
        .trim();

    const password =
        document.getElementById("password")
        .value;

    const error =
        document.getElementById("loginError");

    const button =
        document.querySelector(".login-submit");


    error.textContent = "";


    if (!userId || !password) {

        error.textContent =
            "Please enter User ID and Password.";

        return;
    }


    button.disabled = true;
    button.textContent = "LOGGING IN...";


    try {

        const response = await fetch(
            "/api/login",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    user_id: userId,
                    password: password
                })
            }
        );


        const result =
            await response.json();


        if (!response.ok || !result.success) {

            error.textContent =
                result.message ||
                "Login failed.";

            button.disabled = false;
            button.textContent = "LOGIN";

            return;
        }


        /*
            Role comes from DATABASE.
            User cannot select it.
        */

        window.location.href =
            "/dashboard";


    } catch (err) {

        console.error(err);

        error.textContent =
            "Unable to connect to server.";

        button.disabled = false;
        button.textContent = "LOGIN";
    }
    

}
function showResetMessage() {

    const error = document.getElementById("loginError");

    error.textContent =
        "Please contact the academy administrator to reset your password.";
}