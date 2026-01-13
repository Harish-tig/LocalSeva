/**
 * Service Request Functionality
 * Handles service booking requests via modal form
 * Standalone module - independent error handling
 */

// Service Request Manager
const ServiceRequestManager = {
  currentProvider: null,
  isModalInitialized: false,

  /**
   * Initialize the service request system
   */
  init: function (provider) {
    console.log("🎯 ServiceRequestManager.init() called");
    console.log("Provider data:", provider);

    this.currentProvider = provider;

    // Create modal if not exists
    this.createModal();

    // Setup event listeners
    this.setupListeners();

    console.log("✅ Service request system initialized");
  },

  /**
   * Create the request modal
   */
  createModal: function () {
    console.log("🛠️ Creating service request modal...");

    // Remove existing modal if any
    const existingModal = document.getElementById("serviceRequestModal");
    if (existingModal) {
      existingModal.remove();
    }

    // Create modal HTML
    const modalHTML = `
            <div id="serviceRequestModal" class="service-request-modal" style="display: none;">
                <div class="modal-backdrop" id="modalBackdrop"></div>
                <div class="modal-container">
                    <div class="modal-header">
                        <h3>Request Service</h3>
                        <button class="modal-close" id="modalCloseBtn">&times;</button>
                    </div>
                    
                    <form id="serviceRequestForm">
                        <div class="modal-body">
                            <input type="hidden" id="modalProviderId" value="">
                            
                            <div class="form-group">
                                <label for="modalServiceCategory">Service Category *</label>
                                <select id="modalServiceCategory" required>
                                    <option value="">Select a service category</option>
                                </select>
                                <small>Select the specific service you need</small>
                            </div>
                            
                            <div class="form-group">
                                <label for="modalDescription">Service Description *</label>
                                <textarea id="modalDescription" required placeholder="Describe the service you need in detail..."></textarea>
                                <small>Be specific about what you need done</small>
                            </div>
                            
                            <div class="form-group">
                                <label for="modalAddress">Service Address *</label>
                                <textarea id="modalAddress" required placeholder="Full address where service should be provided..."></textarea>
                                <small>Include floor, apartment number if applicable</small>
                            </div>
                            
                            <div class="form-group">
                                <label for="modalScheduledDate">Preferred Date & Time *</label>
                                <input type="datetime-local" id="modalScheduledDate" required>
                                <small>Select when you'd like the service to be done</small>
                            </div>
                            
                            <div class="form-group">
                                <label for="modalUserNotes">Additional Notes (Optional)</label>
                                <textarea id="modalUserNotes" placeholder="Any special instructions or requirements..."></textarea>
                                <small>Additional information for the service provider</small>
                            </div>
                        </div>
                        
                        <div class="modal-footer">
                            <button type="button" class="btn-cancel" id="modalCancelBtn">Cancel</button>
                            <button type="submit" class="btn-submit" id="modalSubmitBtn">Submit Request</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

    // Add modal to body
    document.body.insertAdjacentHTML("beforeend", modalHTML);

    // Add modal styles
    this.addModalStyles();

    console.log("✅ Modal created successfully");
  },

  /**
   * Add modal styles
   */
  addModalStyles: function () {
    const styleId = "service-request-modal-styles";
    if (document.getElementById(styleId)) return;

    const styles = `
            <style id="${styleId}">
                .service-request-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 9999;
                }
                
                .modal-backdrop {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                }
                
                .modal-container {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: white;
                    width: 90%;
                    max-width: 500px;
                    border-radius: 8px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
                    max-height: 90vh;
                    display: flex;
                    flex-direction: column;
                }
                
                .modal-header {
                    padding: 20px;
                    border-bottom: 1px solid #e5e7eb;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .modal-header h3 {
                    margin: 0;
                    font-size: 1.25rem;
                    font-weight: 600;
                }
                
                .modal-close {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #6b7280;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                }
                
                .modal-close:hover {
                    background: #f3f4f6;
                }
                
                .modal-body {
                    padding: 20px;
                    overflow-y: auto;
                    flex: 1;
                }
                
                .form-group {
                    margin-bottom: 20px;
                }
                
                .form-group label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: 500;
                    color: #374151;
                }
                
                .form-group select,
                .form-group textarea,
                .form-group input[type="datetime-local"] {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #d1d5db;
                    border-radius: 4px;
                    font-size: 14px;
                    box-sizing: border-box;
                }
                
                .form-group textarea {
                    resize: vertical;
                    min-height: 80px;
                }
                
                .form-group small {
                    display: block;
                    color: #6b7280;
                    font-size: 12px;
                    margin-top: 4px;
                }
                
                .modal-footer {
                    padding: 20px;
                    border-top: 1px solid #e5e7eb;
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                }
                
                .btn-cancel,
                .btn-submit {
                    padding: 10px 20px;
                    border-radius: 4px;
                    border: none;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                }
                
                .btn-cancel {
                    background: #f3f4f6;
                    color: #374151;
                    border: 1px solid #d1d5db;
                }
                
                .btn-submit {
                    background: #3b82f6;
                    color: white;
                }
                
                .btn-submit:hover {
                    background: #2563eb;
                }
                
                .btn-cancel:hover {
                    background: #e5e7eb;
                }
                
                .btn-submit:disabled {
                    background: #93c5fd;
                    cursor: not-allowed;
                }
                
                body.modal-open {
                    overflow: hidden;
                }
            </style>
        `;

    document.head.insertAdjacentHTML("beforeend", styles);
  },

  /**
   * Setup all event listeners
   */
  setupListeners: function () {
    console.log("🔗 Setting up event listeners...");

    // Remove existing listeners first
    this.removeListeners();

    // Setup modal close events
    document
      .getElementById("modalCloseBtn")
      ?.addEventListener("click", () => this.closeModal());
    document
      .getElementById("modalCancelBtn")
      ?.addEventListener("click", () => this.closeModal());
    document
      .getElementById("modalBackdrop")
      ?.addEventListener("click", () => this.closeModal());

    // Setup form submission
    const form = document.getElementById("serviceRequestForm");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleSubmit();
      });
    }

    // Setup request button
    const requestBtn = document.getElementById("requestServiceBtn");
    if (requestBtn) {
      // Clone and replace to remove existing listeners
      const newBtn = requestBtn.cloneNode(true);
      requestBtn.parentNode.replaceChild(newBtn, requestBtn);

      newBtn.addEventListener("click", () => this.openModal());
    }

    console.log("✅ Event listeners setup complete");
  },

  /**
   * Remove existing listeners
   */
  removeListeners: function () {
    // Close buttons
    const closeBtn = document.getElementById("modalCloseBtn");
    const cancelBtn = document.getElementById("modalCancelBtn");
    const backdrop = document.getElementById("modalBackdrop");

    if (closeBtn) closeBtn.replaceWith(closeBtn.cloneNode(true));
    if (cancelBtn) cancelBtn.replaceWith(cancelBtn.cloneNode(true));
    if (backdrop) backdrop.replaceWith(backdrop.cloneNode(true));

    // Form
    const form = document.getElementById("serviceRequestForm");
    if (form) form.replaceWith(form.cloneNode(true));

    // Request button
    const requestBtn = document.getElementById("requestServiceBtn");
    if (requestBtn) requestBtn.replaceWith(requestBtn.cloneNode(true));
  },

  /**
   * Open the modal
   */
  openModal: function () {
    console.log("📤 Opening service request modal...");
    console.log("Current Provider:", this.currentProvider);
    console.log("Current Provider ID:", this.currentProvider?.id);
    console.log("Current Provider ID type:", typeof this.currentProvider?.id);

    if (!this.currentProvider) {
      console.error("❌ No provider data available");
      alert("No provider information found. Please refresh the page.");
      return;
    }

    // Get modal elements
    const modal = document.getElementById("serviceRequestModal");
    const providerIdInput = document.getElementById("modalProviderId");
    const categorySelect = document.getElementById("modalServiceCategory");
    const dateInput = document.getElementById("modalScheduledDate");

    // Validate elements exist
    if (!modal || !providerIdInput || !categorySelect || !dateInput) {
      console.error("❌ Modal elements not found:");
      console.log("Modal exists:", !!modal);
      console.log("ProviderId input exists:", !!providerIdInput);
      console.log("Category select exists:", !!categorySelect);
      console.log("Date input exists:", !!dateInput);

      // Try to recreate modal
      this.createModal();
      this.setupListeners();

      // Try opening again
      setTimeout(() => this.openModal(), 100);
      return;
    }

    // Set provider ID
    providerIdInput.value = this.currentProvider.id;
    console.log("📝 Set provider ID to:", this.currentProvider.id);

    // Set min date (tomorrow 9 AM)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    const minDate = tomorrow.toISOString().slice(0, 16);

    dateInput.min = minDate;
    dateInput.value = minDate;
    console.log("📅 Set date to:", minDate);

    // Populate categories
    this.populateCategories();

    // Pre-fill address if available
    this.prefillAddress();

    // Show modal
    modal.style.display = "block";
    document.body.classList.add("modal-open");

    console.log("✅ Modal opened successfully");
  },

  /**
   * Populate categories dropdown
   */
  populateCategories: function () {
    const select = document.getElementById("modalServiceCategory");
    if (!select) {
      console.error("❌ Category select element not found");
      return;
    }

    // Clear existing options
    select.innerHTML = '<option value="">Select a service category</option>';

    if (!this.currentProvider || !this.currentProvider.categories) {
      console.warn("⚠️ No categories available for provider");
      return;
    }

    // Get categories
    let categories = [];
    try {
      if (typeof this.currentProvider.categories === "string") {
        categories = this.currentProvider.categories
          .split(",")
          .map((cat) => cat.trim());
      } else if (Array.isArray(this.currentProvider.categories)) {
        categories = this.currentProvider.categories;
      }
    } catch (error) {
      console.error("❌ Error parsing categories:", error);
      return;
    }

    // Add categories to dropdown
    categories.forEach((category) => {
      if (category && category.trim() !== "") {
        const option = document.createElement("option");
        option.value = category.trim();
        option.textContent = category.trim();
        select.appendChild(option);
      }
    });

    console.log("📋 Populated categories:", categories);
  },

  /**
   * Pre-fill address from user profile
   */
  prefillAddress: function () {
    const addressInput = document.getElementById("modalAddress");
    if (!addressInput) return;

    try {
      // First check if there's a userProfile in localStorage
      const userProfile = localStorage.getItem("userProfile");
      if (userProfile) {
        const profileData = JSON.parse(userProfile);
        if (profileData.address) {
          addressInput.value = profileData.address;
          console.log(
            "🏠 Pre-filled address from userProfile:",
            profileData.address
          );
          return;
        }
      }

      // Try to get from profile API
      if (typeof api !== "undefined" && api.getProfile) {
        api
          .getProfile()
          .then((profile) => {
            if (profile && profile.address) {
              addressInput.value = profile.address;
              console.log(
                "🏠 Pre-filled address from API profile:",
                profile.address
              );
            }
          })
          .catch((err) => {
            console.log("Could not fetch profile for address:", err);
          });
      }
    } catch (error) {
      console.warn("⚠️ Could not pre-fill address:", error);
    }
  },

  /**
   * Close the modal
   */
  closeModal: function () {
    console.log("📥 Closing modal...");

    const modal = document.getElementById("serviceRequestModal");
    if (modal) {
      modal.style.display = "none";
    }

    document.body.classList.remove("modal-open");

    // Reset form
    const form = document.getElementById("serviceRequestForm");
    if (form) {
      form.reset();
    }

    // Reset submit button
    const submitBtn = document.getElementById("modalSubmitBtn");
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Request";
    }

    console.log("✅ Modal closed");
  },

  /**
   * Handle form submission
   */
  handleSubmit: function () {
    console.log("📝 Handling form submission...");

    // Collect form data
    const formData = {
      provider_id: document.getElementById("modalProviderId")?.value,
      service_category: document.getElementById("modalServiceCategory")?.value,
      description: document.getElementById("modalDescription")?.value,
      address: document.getElementById("modalAddress")?.value,
      scheduled_date: document.getElementById("modalScheduledDate")?.value,
      user_notes: document.getElementById("modalUserNotes")?.value,
    };

    console.log("📦 Form data collected:", formData);

    // Validate
    if (!this.validateForm(formData)) {
      return;
    }

    // Format date
    formData.scheduled_date = new Date(formData.scheduled_date).toISOString();

    // Update UI
    const submitBtn = document.getElementById("modalSubmitBtn");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Processing...";
    }

    // Submit to API
    this.submitToAPI(formData);
  },

  /**
   * Validate form data
   */
  validateForm: function (formData) {
    console.log("🔍 Validating form data...");

    const requiredFields = [
      "provider_id",
      "service_category",
      "description",
      "address",
      "scheduled_date",
    ];

    for (const field of requiredFields) {
      if (!formData[field] || formData[field].trim() === "") {
        console.error(`❌ Validation failed: ${field} is required`);
        alert(`Please fill in ${field.replace("_", " ")}`);
        return false;
      }
    }

    // Validate date
    const scheduledDate = new Date(formData.scheduled_date);
    const now = new Date();
    if (scheduledDate <= now) {
      console.error("❌ Date validation failed: must be in future");
      alert("Please select a future date and time");
      return false;
    }

    console.log("✅ Form validation passed");
    return true;
  },

  submitToAPI: async function (formData) {
    console.log("🚀 Submitting to API...");
    console.log("Form Data:", formData);
    console.log("Current Provider:", this.currentProvider);

    // Debug: Log the provider ID to check
    console.log("Provider ID from form:", formData.provider_id);
    console.log("Type of provider_id:", typeof formData.provider_id);

    // Check authentication
    if (!this.checkAuthentication()) {
      console.error("❌ User not authenticated");
      alert(
        "You need to be logged in to request a service. Please login first."
      );
      return;
    }

    try {
      // Check if API function exists
      if (typeof api === "undefined") {
        throw new Error("API object not found");
      }

      if (typeof api.createBooking !== "function") {
        console.error("❌ createBooking function not found on api object");
        throw new Error("Booking functionality not available");
      }

      console.log("📡 Calling api.createBooking...");

      // Get provider username from currentProvider
      const providerUsername =
        this.currentProvider?.username || this.currentProvider?.name || "";
      console.log("Provider Username:", providerUsername);

      // Create booking data with correct field names
      const bookingData = {
        provider_id: formData.provider_id,
        provider_username: providerUsername,
        description: formData.description || "",
        address: formData.address || "",
        scheduled_date: formData.scheduled_date,
        // Optional fields
        user_notes: formData.user_notes || "",
        service_category: formData.service_category || "",
      };

      console.log("📤 Booking data for API:", bookingData);

      // Make sure provider_id is a number
      if (bookingData.provider_id) {
        const num = parseInt(bookingData.provider_id, 10);
        if (!isNaN(num)) {
          bookingData.provider_id = num;
          console.log(
            "Provider ID converted to number:",
            bookingData.provider_id
          );
        }
      }

      // Make API call
      console.log("📞 Calling api.createBooking with:", bookingData);
      const response = await api.createBooking(bookingData);

      console.log("✅ API Response:", response);

      // Success
      alert("Service request submitted successfully!");
      this.closeModal();

      console.log("🎉 Service request completed successfully!");

      // Show booking details
      if (response.id) {
        setTimeout(() => {
          if (typeof appUtils !== "undefined" && appUtils.showNotification) {
            appUtils.showNotification(
              `Booking #${response.id} created successfully! The provider will respond soon.`,
              "success"
            );
          } else {
            alert(
              `Booking #${response.id} created successfully! The provider will respond soon.`
            );
          }
        }, 1000);
      }
    } catch (error) {
      console.error("❌ API Submission Error:", error);
      console.error("Error details:", error.message);

      // Show error to user
      let errorMessage = "Failed to submit service request. ";

      if (error.message.includes("provider_id")) {
        errorMessage += "\n\nProvider ID error: " + error.message;
      } else if (
        error.message.includes("Network") ||
        error.message.includes("fetch") ||
        error.message.includes("internet")
      ) {
        errorMessage += "Network error. Please check your internet connection.";
      } else if (
        error.message.includes("401") ||
        error.message.includes("403") ||
        error.message.includes("authentication") ||
        error.message.includes("login")
      ) {
        errorMessage += "Authentication error. Please login again.";
        setTimeout(() => {
          window.location.href = "index.html";
        }, 2000);
      } else if (error.message.includes("400")) {
        errorMessage += "Invalid data. Please check your inputs and try again.";
      } else if (error.message.includes("500")) {
        errorMessage += "Server error. Please try again later.";
      } else {
        errorMessage += error.message;
      }

      alert(errorMessage);

      // Re-enable submit button
      const submitBtn = document.getElementById("modalSubmitBtn");
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Request";
      }
    }
  },

  /**
   * Check if user is authenticated
   */
  checkAuthentication: function () {
    console.log("🔐 Checking authentication...");

    // Use the same method as your api.js - check for accessToken
    const token = localStorage.getItem("accessToken");
    const isAuth = !!token;

    console.log("Access Token exists:", isAuth);
    console.log(
      "Token value:",
      token ? `${token.substring(0, 20)}...` : "None"
    );

    if (!isAuth) {
      console.error("No access token found!");
      console.log("LocalStorage keys:", Object.keys(localStorage));
    }

    return isAuth;
  },

  /**
   * Debug function - test the system
   */
  debug: function () {
    console.log("=== SERVICE REQUEST DEBUG ===");
    console.log("Current Provider:", this.currentProvider);
    console.log(
      "Modal exists:",
      !!document.getElementById("serviceRequestModal")
    );
    console.log(
      "Request button exists:",
      !!document.getElementById("requestServiceBtn")
    );
    console.log("API object exists:", typeof api !== "undefined");
    console.log(
      "API.createBooking exists:",
      typeof api?.createBooking === "function"
    );
    console.log("Access Token:", localStorage.getItem("accessToken"));
    console.log("Is authenticated:", this.checkAuthentication());
    console.log("==============================");
  },
};

// Make it globally available
window.ServiceRequestManager = ServiceRequestManager;

// Auto-initialize if we have a provider ID in URL
document.addEventListener("DOMContentLoaded", function () {
  console.log("🏁 Service request system loaded");

  // Check if we're on a service detail page
  const urlParams = new URLSearchParams(window.location.search);
  const serviceId = urlParams.get("id");

  if (serviceId) {
    console.log("🔍 Detected service detail page for ID:", serviceId);

    // Check if we need to wait for page to load provider
    console.log(
      "Will wait for service-detail.js to call ServiceRequestManager.init()"
    );
  }
});

/**
 * Test functions for debugging
 */

// Test modal creation
window.testModal = function () {
  console.log("🧪 Testing modal creation...");
  ServiceRequestManager.createModal();
  ServiceRequestManager.setupListeners();
  console.log("✅ Test complete");
};

// Test with dummy provider
window.testWithDummyProvider = function () {
  console.log("🧪 Testing with dummy provider...");
  const dummyProvider = {
    id: 1,
    username: "Test Provider",
    categories: "Cleaning, Plumbing, Electrical",
    location: "Test Location",
  };

  ServiceRequestManager.init(dummyProvider);
  ServiceRequestManager.openModal();
  console.log("✅ Test complete");
};

// Test API call directly
window.testDirectBooking = async function (providerId = null) {
  console.log("🧪 Testing API call directly...");

  if (!ServiceRequestManager.checkAuthentication()) {
    alert("Not authenticated. Please login first.");
    return;
  }

  const testData = {
    provider_id: providerId || 1,
    service_category: "Cleaning",
    description: "Test service request from console",
    address: "123 Test Street, Mumbai",
    scheduled_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    user_notes: "Test notes from console",
  };

  console.log("Test data:", testData);

  try {
    if (typeof api === "undefined") {
      throw new Error("API object not found");
    }

    if (typeof api.createBooking !== "function") {
      throw new Error("createBooking function not found");
    }

    console.log("Calling api.createBooking with:", testData);
    const result = await api.createBooking(testData);
    console.log("✅ API Test Result:", result);
    alert("Test booking created: " + JSON.stringify(result));
    return result;
  } catch (error) {
    console.error("❌ API Test Error:", error);
    alert("Test failed: " + error.message);
    throw error;
  }
};

// Test authentication
window.testAuth = function () {
  console.log("=== AUTHENTICATION TEST ===");
  console.log("LocalStorage accessToken:", localStorage.getItem("accessToken"));
  console.log(
    "LocalStorage refreshToken:",
    localStorage.getItem("refreshToken")
  );
  console.log("LocalStorage userProfile:", localStorage.getItem("userProfile"));
  console.log("LocalStorage userName:", localStorage.getItem("userName"));
  console.log(
    "Is authenticated (ServiceRequestManager):",
    ServiceRequestManager.checkAuthentication()
  );
  console.log(
    "api.isAuthenticated exists:",
    typeof api !== "undefined" && api.isAuthenticated ? "Yes" : "No"
  );
  if (typeof api !== "undefined" && api.isAuthenticated) {
    console.log("api.isAuthenticated():", api.isAuthenticated());
  }
  console.log("==========================");
};

console.log("✅ service-request.js loaded successfully");
