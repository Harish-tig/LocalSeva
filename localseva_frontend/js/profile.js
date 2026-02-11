/**
 * Profile page functionality
 * Requires authentication to access
 */

document.addEventListener("DOMContentLoaded", async function () {
  // Check authentication
  if (!api.isAuthenticated()) {
    window.location.href = "index.html";
    return;
  }

  // Initialize profile page
  await initProfilePage();
});

/**
 * Initialize profile page
 */
async function initProfilePage() {
  try {
    // Load user profile data
    await loadProfileData();

    // Setup form submission
    setupProfileForm();

    // Setup provider status
    setupProviderStatus();

    // Setup avatar upload
    setupAvatarUpload();

    // Setup settings buttons
    setupSettingsButtons();

    // Store current profile globally for editing
    window.currentProfile = await api.getProfile();
  } catch (error) {
    console.error("Error initializing profile page:", error);
    showNotification("Error loading profile", "error");
  }
}

/**
 * Load profile data from API
 */
async function loadProfileData() {
  try {
    console.log("Loading profile data...");

    // Get user profile from API
    const profile = await api.getProfile();
    console.log("Profile API response:", profile);

    // Update UI with profile data
    updateProfileDisplay(profile);

    // Also update sidebar user name
    updateSidebarUserInfo(profile);

    // Update provider card if user is a provider
    if (profile.is_service_provider) {
      updateProviderCard(profile);
    }
  } catch (error) {
    console.error("Error loading profile:", error);
    showNotification("Failed to load profile data", "error");
  }
}

/**
 * Update profile display with data from API
 */
function updateProfileDisplay(profile) {
  console.log("Updating UI with profile:", profile);

  if (!profile) return;

  // Extract data from API response
  const userData = extractProfileData(profile);

  // Update user name
  const displayName = userData.username || userData.name || "User";
  setElementText("profileName", displayName);
  setElementText("userName", displayName);
  setElementValue("fullName", displayName);

  // Update email
  if (userData.email) {
    setElementText("profileEmail", userData.email);
  } else {
    setElementText("profileEmail", "");
  }

  // Update location
  const location = userData.location || "Kandivali";
  setElementHtml(
    "profileLocation",
    `<i class="fas fa-map-marker-alt"></i> ${location}`,
  );
  setElementValue("location", location);

  // Update phone
  setElementValue("phone", userData.phone || "");

  // Update bio
  setElementValue("bio", userData.bio || "");

  // Update profile image
  updateProfileImage(userData.avatar);

  // Update provider status
  updateProviderStatusDisplay(userData.is_service_provider || false);
}

/**
 * Extract profile data from API response
 */
function extractProfileData(profile) {
  if (!profile) return {};

  // Handle avatar URL - ensure it's properly formatted
  let avatarUrl = profile.avatar;

  // If avatar is null or undefined, set to empty string
  if (!avatarUrl) {
    avatarUrl = "";
  }
  // If avatar is a relative URL and doesn't start with http
  else if (typeof avatarUrl === "string" && !avatarUrl.startsWith("http")) {
    // Log the raw avatar value for debugging
    console.log("Raw avatar value from API:", avatarUrl);
  }

  return {
    username: profile.username,
    name: profile.name || profile.username,
    email: profile.email,
    avatar: avatarUrl,
    bio: profile.bio || "",
    phone: profile.phone || "",
    location: profile.location || "Kandivali",
    is_service_provider: profile.is_service_provider || false,
    // Provider specific fields (if they exist)
    categories: profile.categories,
    service_locations: profile.service_locations,
    pricing_type: profile.pricing_type,
    base_price: profile.base_price, // Changed from hourly_rate to base_price
    description: profile.description,
    availability: profile.availability,
    experience_years: profile.experience_years,
  };
}

/**
 * Update provider card with provider details
 */
function updateProviderCard(profile) {
  const providerCard = document.getElementById("providerCard");
  const providerDetails = document.getElementById("providerDetails");

  if (!providerCard || !providerDetails) return;

  // Show the provider card
  providerCard.style.display = "block";

  // Extract provider data
  const providerData = extractProfileData(profile);

  let categoriesHtml = "Not specified";
  if (providerData.categories) {
    const categories =
      typeof providerData.categories === "string"
        ? providerData.categories.split(",").map((cat) => cat.trim())
        : Array.isArray(providerData.categories)
          ? providerData.categories
          : [];
    if (categories.length > 0) {
      categoriesHtml = categories
        .map((cat) => `<span class="badge badge-secondary">${cat}</span>`)
        .join(" ");
    }
  }

  let serviceLocationsHtml = "Not specified";
  if (providerData.service_locations) {
    const service_locations =
      typeof providerData.service_locations === "string"
        ? providerData.service_locations.split(",").map((loc) => loc.trim())
        : Array.isArray(providerData.service_locations)
          ? providerData.service_locations
          : [];
    if (service_locations.length > 0) {
      serviceLocationsHtml = service_locations
        .map((loc) => `<span class="badge badge-secondary">${loc}</span>`)
        .join(" ");
    }
  }

  const pricingType = providerData.pricing_type || "Not specified";
  const basePrice = providerData.base_price // Changed from hourly_rate to base_price
    ? `₹${providerData.base_price}`
    : "Not specified";
  const description = providerData.description || "No description provided";
  const availability = providerData.availability || "Not specified";
  const experience = providerData.experience_years
    ? `${providerData.experience_years} years`
    : "Not specified";

  // Populate the provider details
  providerDetails.innerHTML = `
    <div class="provider-detail">
      <strong>Service Categories:</strong> ${categoriesHtml}
    </div>
    <div class="provider-detail">
      <strong>Service Locations:</strong> ${serviceLocationsHtml}
    </div>
    <div class="provider-detail">
      <strong>Pricing Type:</strong> ${pricingType}
    </div>
    <div class="provider-detail">
      <strong>Base Price:</strong> ${basePrice}  <!-- Changed label -->
    </div>
    <div class="provider-detail">
      <strong>Availability:</strong> ${availability}
    </div>
    <div class="provider-detail">
      <strong>Experience:</strong> ${experience}
    </div>
    <div class="provider-detail">
      <strong>Description:</strong> <p>${description}</p>
    </div>
  `;
}

/**
 * Update profile image display
 */
function updateProfileImage(avatarUrl) {
  const profileImageDisplay = document.getElementById("profileImageDisplay");
  const profileIcon = document.getElementById("profileIcon");

  if (!profileImageDisplay || !profileIcon) return;

  if (avatarUrl) {
    // Check if it's already a complete URL
    let imageUrl = avatarUrl;

    // If it's a relative path (starts with /media/), prepend the base URL
    if (avatarUrl.startsWith("/media/") || avatarUrl.startsWith("media/")) {
      // Remove any leading slash to make it consistent
      const cleanPath = avatarUrl.startsWith("/")
        ? avatarUrl.substring(1)
        : avatarUrl;
      imageUrl = `http://127.0.0.1:8000/${cleanPath}`;
    }
    // If it's just a filename without path, assume it's in media folder
    else if (!avatarUrl.includes("://") && !avatarUrl.startsWith("/")) {
      imageUrl = `http://127.0.0.1:8000/media/${avatarUrl}`;
    }

    console.log("Setting profile image URL:", imageUrl);

    // Add timestamp to prevent caching issues
    const timestamp = new Date().getTime();
    const finalUrl = imageUrl.includes("?")
      ? `${imageUrl}&t=${timestamp}`
      : `${imageUrl}?t=${timestamp}`;

    // Set up error handler BEFORE setting src
    profileImageDisplay.onerror = function () {
      console.error("Failed to load profile image:", imageUrl);
      console.log("Trying fallback image...");
      profileImageDisplay.style.display = "none";
      profileIcon.style.display = "block";

      // Try a fallback approach - clear cache and try again
      if (imageUrl.includes("?t=")) {
        // Try without timestamp
        const cleanUrl = imageUrl.split("?")[0];
        console.log("Trying without timestamp:", cleanUrl);
        profileImageDisplay.src = cleanUrl;
        profileImageDisplay.style.display = "block";
      }
    };

    profileImageDisplay.onload = function () {
      console.log("Profile image loaded successfully");
    };

    // Set the image source
    profileImageDisplay.src = finalUrl;
    profileImageDisplay.style.display = "block";
    profileIcon.style.display = "none";

    // Log the actual image element for debugging
    console.log("Profile image element:", {
      src: profileImageDisplay.src,
      currentSrc: profileImageDisplay.currentSrc,
      complete: profileImageDisplay.complete,
      naturalWidth: profileImageDisplay.naturalWidth,
      naturalHeight: profileImageDisplay.naturalHeight,
    });
  } else {
    console.log("No avatar URL provided, showing default icon");
    profileImageDisplay.style.display = "none";
    profileIcon.style.display = "block";
  }
}

/**
 * Update provider status display
 */
function updateProviderStatusDisplay(isProvider) {
  const notProviderView = document.getElementById("notProviderView");
  const providerView = document.getElementById("providerView");
  const providerBadge = document.getElementById("providerBadge");
  const enrollmentForm = document.getElementById("enrollmentForm");
  const providerCard = document.getElementById("providerCard");

  if (!notProviderView || !providerView) return;

  if (isProvider) {
    // Show provider view and card, hide become provider button
    notProviderView.style.display = "none";
    providerView.style.display = "block";
    if (providerCard) {
      providerCard.style.display = "block";
    }

    if (providerBadge) {
      providerBadge.style.display = "inline-flex";
    }

    // Hide enrollment form by default
    if (enrollmentForm) {
      enrollmentForm.style.display = "none";
    }
  } else {
    // Show become provider option, hide provider views
    notProviderView.style.display = "block";
    providerView.style.display = "none";
    if (providerCard) {
      providerCard.style.display = "none";
    }

    if (providerBadge) {
      providerBadge.style.display = "none";
    }

    if (enrollmentForm) {
      enrollmentForm.style.display = "none";
    }
  }
}

/**
 * Update sidebar user info
 */
function updateSidebarUserInfo(profile) {
  const userNameElement = document.getElementById("userName");
  if (!userNameElement) return;

  const userData = extractProfileData(profile);
  const displayName = userData.username || userData.name || "User";
  userNameElement.textContent = displayName;

  // Update localStorage
  localStorage.setItem("userName", displayName);
  localStorage.setItem(
    "userIsProvider",
    userData.is_service_provider.toString(),
  );
}

/**
 * Setup profile form submission
 */
function setupProfileForm() {
  const form = document.getElementById("profileForm");
  if (!form) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    console.log("Submitting profile form...");

    // Collect form data
    const formData = new FormData();

    // Get form values (only updatable fields)
    const bio = document.getElementById("bio")?.value || "";
    const phone = document.getElementById("phone")?.value || "";
    const location = document.getElementById("location")?.value || "";

    // Only add fields that have values
    if (bio.trim()) formData.append("bio", bio.trim());
    if (phone.trim()) formData.append("phone", phone.trim());
    if (location.trim()) formData.append("location", location.trim());

    console.log("Form data:", { bio, phone, location });

    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    try {
      // Update profile via API
      const response = await api.updateProfile(formData);
      console.log("Update profile response:", response);

      showNotification("Profile updated successfully!", "success");

      // Update UI with new data
      updateProfileDisplay(response);

      // Update sidebar
      updateSidebarUserInfo(response);

      // Update global profile
      window.currentProfile = response;
    } catch (error) {
      console.error("Error updating profile:", error);

      let errorMessage = "Failed to update profile";
      if (error.message) {
        errorMessage = error.message;
      } else if (error.detail) {
        errorMessage = error.detail;
      }

      showNotification(errorMessage, "error");
    } finally {
      // Reset button
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
}

/**
 * Setup provider status and enrollment
 */
function setupProviderStatus() {
  const becomeProviderBtn = document.getElementById("becomeProviderBtn");
  const enrollmentForm = document.getElementById("providerEnrollmentForm");
  const cancelEnrollmentBtn = document.getElementById("cancelEnrollment");
  const editProviderBtn = document.getElementById("editProviderBtn");

  // Become provider button - ONLY calls becomeProvider API
  if (becomeProviderBtn) {
    becomeProviderBtn.addEventListener("click", async function () {
      const confirmBecome = confirm(
        "Are you sure you want to become a service provider? You will need to provide additional information about your services.",
      );

      if (!confirmBecome) return;

      const originalText = becomeProviderBtn.innerHTML;
      becomeProviderBtn.disabled = true;
      becomeProviderBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Updating...';

      try {
        console.log("Becoming provider...");

        // Call API to become provider - ONLY THIS API CALL
        const response = await api.becomeProvider();
        console.log("Become provider response:", response);

        showNotification(
          "You are now a service provider! Please complete your enrollment details.",
          "success",
        );

        // Update UI to show provider status
        updateProviderStatusDisplay(true);

        // Update global profile
        if (window.currentProfile) {
          window.currentProfile.is_service_provider = true;
        }

        // Show enrollment form for first time enrollment
        const enrollmentFormContainer =
          document.getElementById("enrollmentForm");
        if (enrollmentFormContainer) {
          enrollmentFormContainer.style.display = "block";
        }

        // Clear any previous form data (fresh enrollment)
        if (enrollmentForm) {
          enrollmentForm.reset();
        }
      } catch (error) {
        console.error("Error becoming provider:", error);

        let errorMessage = "Failed to become service provider";
        if (error.message) {
          errorMessage = error.message;
        } else if (error.detail) {
          errorMessage = error.detail;
        }

        showNotification(errorMessage, "error");
      } finally {
        becomeProviderBtn.disabled = false;
        becomeProviderBtn.innerHTML = originalText;
      }
    });
  }

  // Edit provider button - shows form with pre-filled data
  if (editProviderBtn) {
    editProviderBtn.addEventListener("click", function () {
      if (!window.currentProfile) {
        showNotification("No profile data available for editing", "error");
        return;
      }

      // Show enrollment form with pre-filled data
      const enrollmentFormContainer = document.getElementById("enrollmentForm");
      if (enrollmentFormContainer) {
        enrollmentFormContainer.style.display = "block";
      }

      // Pre-fill the form with existing provider data
      prefillEnrollmentForm(window.currentProfile);
    });
  }

  // Enrollment form submission - sends provider details
  if (enrollmentForm) {
    enrollmentForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      console.log("Submitting provider enrollment form...");

      // Collect enrollment data
      const categories = Array.from(
        document.querySelectorAll('input[name="categories"]:checked'),
      ).map((cb) => cb.value);

      const service_locations = Array.from(
        document.querySelectorAll('input[name="service_locations"]:checked'),
      ).map((cb) => cb.value);

      const pricingType = document.getElementById("pricingType")?.value;
      const basePrice = document.getElementById("hourlyRate")?.value; // Changed variable name
      const serviceDescription =
        document.getElementById("serviceDescription")?.value;
      const availability = document.getElementById("availability")?.value;
      const experience = document.getElementById("experience")?.value;

      // Validation
      if (categories.length === 0) {
        showNotification(
          "Please select at least one service category",
          "error",
        );
        return;
      }

      if (service_locations.length === 0) {
        showNotification(
          "Please select at least one service location",
          "error",
        );
        return;
      }

      if (!pricingType) {
        showNotification("Please select a pricing type", "error");
        return;
      }

      if (!serviceDescription || serviceDescription.trim() === "") {
        showNotification("Please provide a service description", "error");
        return;
      }

      if (!availability) {
        showNotification("Please select availability", "error");
        return;
      }

      // Prepare enrollment data - CHANGE HERE: hourly_rate → base_price
      const enrollmentData = {
        categories: categories.join(", "),
        service_locations: service_locations.join(", "),
        pricing_type: pricingType,
        base_price: basePrice ? parseFloat(basePrice) : null, // Changed key name
        description: serviceDescription.trim(),
        availability,
        experience_years: experience ? parseFloat(experience) : 0,
        is_service_provider: true,
        role: "SERVICE",
      };

      console.log("Enrollment data:", enrollmentData);

      const submitBtn = this.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Submitting...';

      try {
        // Call update profile API with provider data
        const response = await api.updateProfile(enrollmentData);
        console.log("Enrollment response:", response);

        showNotification(
          "Service provider details saved successfully!",
          "success",
        );

        // Update UI with new provider data
        updateProfileDisplay(response);
        updateProviderCard(response);

        // Update global profile
        window.currentProfile = response;

        // Hide the enrollment form
        const enrollmentFormContainer =
          document.getElementById("enrollmentForm");
        if (enrollmentFormContainer) {
          enrollmentFormContainer.style.display = "none";
        }
      } catch (error) {
        console.error("Error submitting enrollment:", error);
        showNotification("Failed to save provider details", "error");
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }

  // Cancel enrollment button
  if (cancelEnrollmentBtn) {
    cancelEnrollmentBtn.addEventListener("click", function () {
      const enrollmentFormContainer = document.getElementById("enrollmentForm");
      if (enrollmentFormContainer) {
        enrollmentFormContainer.style.display = "none";
      }
    });
  }
}

/**
 * Prefill enrollment form with existing provider data
 */
function prefillEnrollmentForm(profile) {
  if (!profile) return;

  const userData = extractProfileData(profile);

  // Prefill categories (handle both string and array formats)
  const categoryCheckboxes = document.querySelectorAll(
    'input[name="categories"]',
  );
  categoryCheckboxes.forEach((checkbox) => {
    if (userData.categories) {
      const categories =
        typeof userData.categories === "string"
          ? userData.categories.split(",").map((cat) => cat.trim())
          : Array.isArray(userData.categories)
            ? userData.categories
            : [];
      checkbox.checked = categories.includes(checkbox.value);
    } else {
      checkbox.checked = false;
    }
  });

  // Prefill service_locations (handle both string and array formats)
  const serviceLocationCheckboxes = document.querySelectorAll(
    'input[name="service_locations"]',
  );
  serviceLocationCheckboxes.forEach((checkbox) => {
    if (userData.service_locations) {
      const service_locations =
        typeof userData.service_locations === "string"
          ? userData.service_locations.split(",").map((loc) => loc.trim())
          : Array.isArray(userData.service_locations)
            ? userData.service_locations
            : [];
      checkbox.checked = service_locations.includes(checkbox.value);
    } else {
      checkbox.checked = false;
    }
  });

  // Prefill other fields
  if (userData.pricing_type) {
    setElementValue("pricingType", userData.pricing_type);
  }
  if (userData.base_price) {
    // Changed from hourly_rate to base_price
    setElementValue("hourlyRate", userData.base_price); // Keep input ID same for UI compatibility
  }
  if (userData.description) {
    setElementValue("serviceDescription", userData.description);
  }
  if (userData.availability) {
    setElementValue("availability", userData.availability);
  }
  if (userData.experience_years) {
    setElementValue("experience", userData.experience_years);
  }
}

/**
 * Setup avatar upload
 */
function setupAvatarUpload() {
  const changeAvatarBtn = document.getElementById("changeAvatarBtn");
  const avatarUpload = document.getElementById("avatarUpload");

  if (changeAvatarBtn && avatarUpload) {
    changeAvatarBtn.addEventListener("click", function () {
      avatarUpload.click();
    });

    avatarUpload.addEventListener("change", async function (e) {
      const file = e.target.files[0];
      if (!file) return;

      console.log("Selected file:", file.name, file.type, file.size);

      // Validate file type
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!validTypes.includes(file.type)) {
        showNotification(
          "Please select a valid image file (JPEG, PNG, GIF, WebP)",
          "error",
        );
        return;
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        showNotification("Image size should be less than 10MB", "error");
        return;
      }

      // Show loading
      const originalText = changeAvatarBtn.innerHTML;
      changeAvatarBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      changeAvatarBtn.disabled = true;

      try {
        // Create FormData with avatar
        const formData = new FormData();
        formData.append("avatar", file);

        console.log("Uploading avatar...");

        // Upload avatar via profile update
        const response = await api.updateProfile(formData);
        console.log("Avatar upload response:", response);

        // Update profile image display
        if (response.avatar) {
          updateProfileImage(response.avatar);
        }

        // Update global profile
        window.currentProfile = response;

        showNotification("Profile image updated successfully!", "success");
      } catch (error) {
        console.error("Error uploading avatar:", error);

        let errorMessage = "Failed to upload image";
        if (error.message) {
          errorMessage = error.message;
        } else if (error.detail) {
          errorMessage = error.detail;
        }

        showNotification(errorMessage, "error");
      } finally {
        // Reset button and file input
        changeAvatarBtn.innerHTML = originalText;
        changeAvatarBtn.disabled = false;
        avatarUpload.value = "";
      }
    });
  }
}

/**
 * Setup settings buttons
 */
function setupSettingsButtons() {
  // Change password button
  const changePasswordBtn = document.getElementById("changePassword");
  if (changePasswordBtn) {
    changePasswordBtn.addEventListener("click", function () {
      showNotification("Password change functionality is coming soon!", "info");
    });
  }
}

/**
 * Helper function to set element text
 */
function setElementText(elementId, text) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = text;
  }
}

/**
 * Helper function to set element value
 */
function setElementValue(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) {
    element.value = value;
  }
}

/**
 * Helper function to set element HTML
 */
function setElementHtml(elementId, html) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = html;
  }
}

/**
 * Show notification
 */
function showNotification(message, type = "info") {
  if (typeof appUtils !== "undefined" && appUtils.showNotification) {
    appUtils.showNotification(message, type);
  } else {
    alert(message);
  }
}
