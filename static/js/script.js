function toggleMenu() {
    const nav = document.querySelector("nav");
    nav.classList.toggle("active");
}


// Close mobile menu after clicking a link

document.querySelectorAll("nav a").forEach(link => {

    link.addEventListener("click", () => {

        document.querySelector("nav").classList.remove("active");

    });

});