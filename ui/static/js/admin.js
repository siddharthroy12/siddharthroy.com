document
  .getElementById("adminLoginForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const password = document.getElementById("adminPassword").value;
    const errorMessage = document.getElementById("errorMessage");
    const loadingMessage = document.getElementById("loadingMessage");

    // Hide error message and show loading
    errorMessage.style.display = "none";
    loadingMessage.style.display = "block";

    try {
      // Make a request to check the password against the server header
      const response = await fetch(window.location.href, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      // Get the adminpassword header
      const adminPassword = response.headers.get("adminpassword");

      // Hide loading
      loadingMessage.style.display = "none";

      if (password === adminPassword) {
        // Password matches - redirect to YouTube
        window.location.href = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
      } else {
        // Password doesn't match - show error
        errorMessage.style.display = "block";
        document.getElementById("password").value = "";
        document.getElementById("password").focus();
      }
    } catch (error) {
      // Handle network errors
      loadingMessage.style.display = "none";
      loginBtn.disabled = false;
      errorMessage.textContent =
        "Error connecting to server. Please try again.";
      errorMessage.style.display = "block";
      console.error("Login error:", error);
    }
  });

// Clear error message when user starts typing
document.getElementById("adminPassword").addEventListener("input", function () {
  document.getElementById("errorMessage").style.display = "none";
});
document.getElementById("errorMessage").style.display = "none";
loadingMessage.style.display = "none";
