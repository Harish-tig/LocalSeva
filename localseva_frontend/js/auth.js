/**
 * Authentication page functionality
 * Handles login and signup pages
 */

document.addEventListener("DOMContentLoaded", function () {
  // Check if we're on login page
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    initLoginForm();
  }

  // Check if we're on signup page
  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    initSignupForm();
  }

  // Auto-fill demo accounts if URL has demo parameter
  const urlParams = new URLSearchParams(window.location.search);
  const demo = urlParams.get("demo");

  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");

  if (demo === "provider") {
    if (usernameInput) usernameInput.value = "provider";
    if (passwordInput) passwordInput.value = "password123";
  } else if (demo === "client") {
    if (usernameInput) usernameInput.value = "client";
    if (passwordInput) passwordInput.value = "password123";
  }
});

/**
 * Initialize login form
 */
function initLoginForm() {
  const form = document.getElementById("loginForm");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    // Basic validation
    if (!username || !password) {
      appUtils.showNotification("Please fill in all fields", "error");
      return;
    }

    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Logging in...';

    try {
      // Call API login
      const result = await api.login(username, password);

      appUtils.showNotification("Login successful! Redirecting...", "success");

      // Redirect to services page after delay
      setTimeout(() => {
        window.location.href = "services.html";
      }, 1500);
    } catch (error) {
      console.error("Login error:", error);
      appUtils.showNotification(
        error.message || "Login failed. Please check your credentials.",
        "error"
      );

      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
}

/**
 * Initialize signup form
 */
function initSignupForm() {
  const form = document.getElementById("signupForm");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const terms = document.getElementById("terms").checked;

    // Validation
    if (!username || !email || !password || !confirmPassword) {
      appUtils.showNotification("Please fill in all required fields", "error");
      return;
    }

    if (password !== confirmPassword) {
      appUtils.showNotification("Passwords do not match", "error");
      return;
    }

    if (password.length < 6) {
      appUtils.showNotification(
        "Password must be at least 6 characters",
        "error"
      );
      return;
    }

    if (!terms) {
      appUtils.showNotification(
        "Please accept the terms and conditions",
        "error"
      );
      return;
    }

    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Creating Account...';

    try {
      // Call API signup with only required fields
      const result = await api.signup(username, email, password);

      appUtils.showNotification("Account created successfully!", "success");

      // Redirect to services page after delay
      setTimeout(() => {
        window.location.href = "services.html";
      }, 1500);
    } catch (error) {
      console.error("Signup error:", error);

      // Handle specific error messages
      let errorMessage = error.message || "Signup failed. Please try again.";

      if (error.message.includes("username")) {
        errorMessage = "Username already exists. Please choose another.";
      } else if (error.message.includes("email")) {
        errorMessage =
          "Email already registered. Please use another email or login.";
      } else if (error.message.includes("password")) {
        errorMessage =
          "Password requirements not met. Please use a stronger password.";
      }

      appUtils.showNotification(errorMessage, "error");

      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
}
