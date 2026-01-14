/**
 * Review Functionality
 * Handles fetching and submitting reviews for service providers
 */

const ReviewManager = {
  currentProvider: null,
  selectedRating: 0,
  userBookings: [],

  /**
   * Initialize the review system
   */
  init: function (provider) {
    console.log("🎯 ReviewManager.init() called");
    console.log("Provider data:", provider);

    this.currentProvider = provider;

    // Initialize review form
    this.initReviewForm();

    // Load reviews for this provider
    this.loadReviews();

    // Check if user has completed bookings with this provider
    this.checkUserBookings();

    console.log("✅ Review system initialized");
  },

  /**
   * Load reviews for the current provider
   */
  loadReviews: async function () {
    console.log("📥 Loading reviews for provider:", this.currentProvider?.id);

    if (!this.currentProvider || !this.currentProvider.id) {
      console.error("❌ No provider ID available");
      return;
    }

    try {
      // Show loading state
      this.showLoadingState();

      // Get reviews from API
      const reviews = await api.getProviderReviews(this.currentProvider.id);
      console.log("✅ Reviews loaded:", reviews);

      // Render reviews
      this.renderReviews(reviews);
    } catch (error) {
      console.error("❌ Error loading reviews:", error);
      this.showErrorState(error.message || "Failed to load reviews");
    }
  },

  /**
   * Show loading state in reviews container
   */
  showLoadingState: function () {
    const container = document.querySelector(".reviews-container");
    if (container) {
      container.innerHTML = `
        <div class="loading-skeleton" style="height: 100px; margin-bottom: 1rem; border-radius: var(--border-radius);"></div>
        <div class="loading-skeleton" style="height: 100px; border-radius: var(--border-radius);"></div>
      `;
    }
  },

  /**
   * Show error state in reviews container
   */
  showErrorState: function (errorMessage) {
    const container = document.querySelector(".reviews-container");
    if (container) {
      container.innerHTML = `
        <div class="empty-state" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
          <i class="fas fa-exclamation-circle" style="font-size: 3rem; margin-bottom: 1rem; color: var(--danger);"></i>
          <p>${errorMessage || "Failed to load reviews"}</p>
          <button class="btn btn-outline btn-sm" onclick="ReviewManager.loadReviews()">
            <i class="fas fa-redo"></i> Try Again
          </button>
        </div>
      `;
    }
  },

  /**
   * Render reviews in the container
   */
  renderReviews: function (reviews) {
    const container = document.querySelector(".reviews-container");
    if (!container) {
      console.error("❌ Reviews container not found");
      return;
    }

    if (!reviews || reviews.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
          <i class="fas fa-comment-slash" style="font-size: 3rem; margin-bottom: 1rem; color: var(--text-secondary);"></i>
          <h4>No Reviews Yet</h4>
          <p>Be the first to review this service provider!</p>
        </div>
      `;
      return;
    }

    // Calculate average rating
    const avgRating =
      reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

    // Update provider rating display if exists
    const ratingDisplay = document.querySelector(".review-rating span");
    if (ratingDisplay) {
      ratingDisplay.textContent = avgRating.toFixed(1);
    }

    // Render each review
    container.innerHTML = reviews
      .map((review) => this.createReviewHTML(review))
      .join("");

    console.log("✅ Reviews rendered successfully");
  },

  /**
   * Create HTML for a single review
   */
  createReviewHTML: function (review) {
    const reviewDate = new Date(review.created_at);
    const formattedDate = this.formatDate(reviewDate);

    // Create stars HTML based on rating
    const starsHTML = this.createStarsHTML(review.rating);

    return `
      <div class="review-item">
        <div class="review-header">
          <div class="reviewer-info">
            <i class="fas fa-user-circle"></i>
            <div>
              <h4>${review.user_name || "Anonymous User"}</h4>
              <div class="review-rating">
                ${starsHTML}
                <span>${review.rating.toFixed(1)}</span>
              </div>
            </div>
          </div>
          <span class="review-date">${formattedDate}</span>
        </div>
        <div class="review-content">
          <p>${review.comment || "No comment provided."}</p>
          ${
            review.booking
              ? `<small style="color: var(--text-secondary);">Booking #${review.booking}</small>`
              : ""
          }
        </div>
      </div>
    `;
  },

  /**
   * Create stars HTML based on rating
   */
  createStarsHTML: function (rating) {
    let starsHTML = "";
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(rating)) {
        starsHTML += '<i class="fas fa-star" style="color: #fbbf24;"></i>';
      } else if (i === Math.ceil(rating) && rating % 1 !== 0) {
        starsHTML +=
          '<i class="fas fa-star-half-alt" style="color: #fbbf24;"></i>';
      } else {
        starsHTML += '<i class="fas fa-star" style="color: #d1d5db;"></i>';
      }
    }
    return starsHTML;
  },

  /**
   * Format date to relative time (e.g., "2 weeks ago")
   */
  formatDate: function (date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
    if (diffInSeconds < 31536000)
      return `${Math.floor(diffInSeconds / 2592000)} months ago`;
    return `${Math.floor(diffInSeconds / 31536000)} years ago`;
  },

  /**
   * Initialize review form
   */
  initReviewForm: function () {
    console.log("📝 Initializing review form");

    // Setup rating stars
    this.setupRatingStars();

    // Handle form submission
    const reviewForm = document.getElementById("reviewForm");
    if (reviewForm) {
      reviewForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleReviewSubmit();
      });
    }
  },

  /**
   * Setup rating stars interaction
   */
  setupRatingStars: function () {
    const stars = document.querySelectorAll(".rating-input i");

    stars.forEach((star) => {
      star.addEventListener("click", (e) => {
        const rating = parseInt(e.target.getAttribute("data-rating"));
        this.selectRating(rating);
      });

      star.addEventListener("mouseover", (e) => {
        const rating = parseInt(e.target.getAttribute("data-rating"));
        this.highlightStars(rating);
      });

      star.addEventListener("mouseout", () => {
        this.highlightStars(this.selectedRating);
      });
    });
  },

  /**
   * Select a rating
   */
  selectRating: function (rating) {
    console.log("⭐ Selected rating:", rating);
    this.selectedRating = rating;
    this.highlightStars(rating);
  },

  /**
   * Highlight stars up to the selected rating
   */
  highlightStars: function (rating) {
    const stars = document.querySelectorAll(".rating-input i");

    stars.forEach((star, index) => {
      if (index < rating) {
        star.classList.add("active");
        star.style.color = "#fbbf24";
      } else {
        star.classList.remove("active");
        star.style.color = "var(--border-color)";
      }
    });
  },

  /**
   * Check if user has completed bookings with this provider
   */
  checkUserBookings: async function () {
    console.log(
      "🔍 Checking user bookings for provider:",
      this.currentProvider?.id
    );

    if (!this.currentProvider || !this.currentProvider.id) {
      console.error("❌ No provider ID available");
      return;
    }

    try {
      // Get all user bookings
      console.log("📋 Fetching user bookings...");
      const allBookings = await api.getBookings();
      console.log("📦 All user bookings:", allBookings);

      // Get existing reviews for this provider
      console.log("📝 Fetching existing reviews...");
      let existingReviews = [];
      try {
        existingReviews = await api.getProviderReviews(this.currentProvider.id);
        console.log("✅ Existing reviews:", existingReviews);
      } catch (reviewError) {
        console.log("No existing reviews or error fetching:", reviewError);
      }

      // Extract booking IDs that already have reviews
      const reviewedBookingIds = existingReviews.map(
        (review) => review.booking
      );
      console.log("📋 Already reviewed booking IDs:", reviewedBookingIds);

      // Filter bookings for this provider, completed status, and NOT already reviewed
      this.userBookings = allBookings.filter((booking) => {
        // Extract provider ID from booking
        let bookingProviderId;
        if (
          booking.service_provider &&
          typeof booking.service_provider === "object"
        ) {
          bookingProviderId = booking.service_provider.id;
        } else if (booking.service_provider) {
          bookingProviderId = booking.service_provider;
        } else if (booking.provider_id) {
          bookingProviderId = booking.provider_id;
        } else if (booking.service_provider_id) {
          bookingProviderId = booking.service_provider_id;
        }

        // Check if booking is for current provider
        const isForProvider = bookingProviderId == this.currentProvider.id;

        // Check if booking is completed
        const isCompleted = booking.status === "COMPLETED";

        // Check if booking already has a review
        const isAlreadyReviewed = reviewedBookingIds.includes(booking.id);

        console.log(
          `Booking #${booking.id}: For provider? ${isForProvider}, Completed? ${isCompleted}, Already reviewed? ${isAlreadyReviewed}`
        );

        return isForProvider && isCompleted && !isAlreadyReviewed;
      });

      console.log(
        "✅ Filtered available bookings for review:",
        this.userBookings
      );

      // Update review form based on bookings
      this.updateReviewForm();
    } catch (error) {
      console.error("❌ Error checking user bookings:", error);
      console.error("Error details:", error.message);
      this.userBookings = [];
      this.updateReviewForm();
    }
  },

  /**
   * Check if user has any completed bookings with this provider
   */
  checkIfAnyCompletedBookings: async function () {
    try {
      const allBookings = await api.getBookings();

      // Check if any booking is for this provider and completed
      return allBookings.some((booking) => {
        let bookingProviderId;
        if (
          booking.service_provider &&
          typeof booking.service_provider === "object"
        ) {
          bookingProviderId = booking.service_provider.id;
        } else if (booking.service_provider) {
          bookingProviderId = booking.service_provider;
        } else if (booking.provider_id) {
          bookingProviderId = booking.provider_id;
        }

        return (
          bookingProviderId == this.currentProvider.id &&
          booking.status === "COMPLETED"
        );
      });
    } catch (error) {
      console.error("Error checking completed bookings:", error);
      return false;
    }
  },

  /**
   * Update review form based on available bookings
   */
  updateReviewForm: function () {
    const reviewForm = document.getElementById("reviewForm");
    const reviewTextarea = document.getElementById("reviewText");
    const submitButton = reviewForm?.querySelector('button[type="submit"]');

    if (!reviewForm || !reviewTextarea) return;

    console.log("🔄 Updating review form. User bookings:", this.userBookings);
    console.log("User bookings length:", this.userBookings.length);

    // Remove any existing messages
    const existingMessage = reviewForm.querySelector(".no-booking-message");
    if (existingMessage) {
      existingMessage.remove();
    }

    if (this.userBookings.length === 0) {
      // No available bookings to review
      console.log("⚠️ No available bookings found for review");

      // Add visual indication
      reviewForm.style.opacity = "0.6";
      reviewForm.style.pointerEvents = "none";

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML =
          '<i class="fas fa-check-circle"></i> All Bookings Reviewed';
      }

      // Check if user has any completed bookings at all
      this.checkIfAnyCompletedBookings().then((hasCompletedBookings) => {
        let messageText;

        if (hasCompletedBookings) {
          messageText = `
            <div>
              <strong>All Bookings Reviewed!</strong>
              <br><small>You have already reviewed all your completed bookings with this provider.</small>
            </div>
          `;
        } else {
          messageText = `
            <div>
              <strong>Note:</strong> You can only review service providers after completing a booking with them.
              <br><small>Your completed bookings with this provider will appear here.</small>
            </div>
          `;
        }

        const message = document.createElement("div");
        message.className = "alert alert-info no-booking-message";
        message.innerHTML = `
          <i class="fas fa-info-circle"></i>
          ${messageText}
        `;
        reviewForm.insertBefore(message, reviewForm.firstChild);
      });
    } else {
      // User has bookings available for review
      console.log("✅ User has bookings available for review, enabling form");

      // Remove visual indication
      reviewForm.style.opacity = "1";
      reviewForm.style.pointerEvents = "auto";

      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML =
          '<i class="fas fa-paper-plane"></i> Submit Review';
      }

      // Remove booking selection dropdown if exists
      const existingSelect = reviewForm.querySelector("#bookingSelect");
      if (existingSelect) {
        existingSelect.remove();
      }

      // Add booking selection dropdown if multiple bookings
      if (this.userBookings.length > 1) {
        this.addBookingSelection();
      }

      console.log("✅ Review form is now enabled");
    }
  },

  /**
   * Add booking selection dropdown to form
   */
  addBookingSelection: function () {
    const reviewForm = document.getElementById("reviewForm");
    const existingSelect = reviewForm.querySelector("#bookingSelect");

    if (existingSelect) {
      existingSelect.remove(); // Remove existing to refresh
    }

    const bookingSelect = document.createElement("div");
    bookingSelect.className = "form-group";
    bookingSelect.innerHTML = `
      <label for="bookingSelect" class="form-label">Select Booking to Review *</label>
      <select id="bookingSelect" class="form-control" required>
        <option value="">Select a completed booking</option>
        ${this.userBookings
          .map(
            (booking) => `
          <option value="${booking.id}">
            Booking #${booking.id} - ${new Date(
              booking.scheduled_date
            ).toLocaleDateString()} - ${booking.description?.substring(0, 30)}${
              booking.description?.length > 30 ? "..." : ""
            }
          </option>
        `
          )
          .join("")}
      </select>
      <div class="form-help">Choose which completed booking you want to review</div>
    `;

    // Insert after rating input
    const ratingGroup = reviewForm.querySelector(".form-group");
    if (ratingGroup) {
      ratingGroup.parentNode.insertBefore(
        bookingSelect,
        ratingGroup.nextSibling
      );
    }
  },

  /**
   * Handle review form submission
   */
  handleReviewSubmit: async function () {
    console.log("📝 Handling review submission");

    // Validate rating
    if (this.selectedRating === 0) {
      this.showNotification("Please select a rating", "error");
      return;
    }

    // Get review text
    const reviewText = document.getElementById("reviewText")?.value;
    if (!reviewText || reviewText.trim() === "") {
      this.showNotification("Please enter your review text", "error");
      return;
    }

    // Get booking ID (if multiple bookings)
    let bookingId;
    if (this.userBookings.length > 1) {
      const bookingSelect = document.getElementById("bookingSelect");
      if (!bookingSelect || !bookingSelect.value) {
        this.showNotification("Please select a booking to review", "error");
        return;
      }
      bookingId = parseInt(bookingSelect.value);
    } else if (this.userBookings.length === 1) {
      bookingId = this.userBookings[0].id;
    } else {
      this.showNotification("No available bookings to review", "error");
      return;
    }

    // Prepare review data
    const reviewData = {
      booking: bookingId,
      provider_id: this.currentProvider.id,
      rating: this.selectedRating,
      comment: reviewText.trim(),
    };

    console.log("📦 Review data to submit:", reviewData);

    try {
      // Disable submit button
      const reviewForm = document.getElementById("reviewForm");
      const submitBtn = reviewForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Submitting...';
      submitBtn.disabled = true;

      // Submit review
      console.log("📤 Submitting review to API...");
      const response = await api.createReview(reviewData);
      console.log("✅ Review created:", response);

      // Show success message
      this.showNotification("Review submitted successfully!", "success");

      // Reset form
      this.resetReviewForm();

      // Reload reviews and update bookings list
      await this.loadReviews();
      await this.checkUserBookings(); // Refresh to remove the reviewed booking

      // Re-enable submit button
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    } catch (error) {
      console.error("❌ Error submitting review:", error);
      console.error("Error details:", error.message);

      // Show error message
      let errorMessage = "Failed to submit review. ";

      if (
        error.message.includes(
          "UNIQUE constraint failed: local_user_review.booking_id"
        )
      ) {
        errorMessage =
          "This booking has already been reviewed. Each booking can only be reviewed once.";

        // Refresh the bookings list to remove the already-reviewed booking
        setTimeout(() => {
          this.checkUserBookings();
        }, 1000);
      } else if (error.message.includes("COMPLETED")) {
        errorMessage += "You can only review completed bookings.";
      } else if (error.message.includes("own bookings")) {
        errorMessage += "You can only review your own bookings.";
      } else if (error.message.includes("Provider must match")) {
        errorMessage += "Provider doesn't match the booking.";
      } else {
        errorMessage += error.message;
      }

      this.showNotification(errorMessage, "error");

      // Re-enable submit button
      const reviewForm = document.getElementById("reviewForm");
      const submitBtn = reviewForm.querySelector('button[type="submit"]');
      submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Review';
      submitBtn.disabled = false;
    }
  },

  /**
   * Reset review form
   */
  resetReviewForm: function () {
    // Reset rating
    this.selectedRating = 0;
    this.highlightStars(0);

    // Reset textarea
    const reviewText = document.getElementById("reviewText");
    if (reviewText) reviewText.value = "";

    // Reset booking selection if exists
    const bookingSelect = document.getElementById("bookingSelect");
    if (bookingSelect) bookingSelect.value = "";
  },

  /**
   * Show notification
   */
  showNotification: function (message, type = "info") {
    // Check if appUtils exists
    if (typeof appUtils !== "undefined" && appUtils.showNotification) {
      appUtils.showNotification(message, type);
    } else {
      // Fallback alert
      alert(message);
    }
  },

  /**
   * Refresh reviews
   */
  refresh: function () {
    console.log("🔄 Refreshing review system");
    this.loadReviews();
    this.checkUserBookings();
  },

  /**
   * Debug function
   */
  debug: function () {
    console.log("=== REVIEW MANAGER DEBUG ===");
    console.log("Current Provider:", this.currentProvider);
    console.log("Current Provider ID:", this.currentProvider?.id);
    console.log("Selected Rating:", this.selectedRating);
    console.log("User Bookings:", this.userBookings);
    console.log("User Bookings Count:", this.userBookings.length);
    console.log("Review Form:", document.getElementById("reviewForm"));
    console.log(
      "Reviews Container:",
      document.querySelector(".reviews-container")
    );

    // Test API functions
    console.log("API Functions:");
    console.log(
      "- api.getBookings exists:",
      typeof api.getBookings === "function"
    );
    console.log(
      "- api.createReview exists:",
      typeof api.createReview === "function"
    );
    console.log(
      "- api.getProviderReviews exists:",
      typeof api.getProviderReviews === "function"
    );

    console.log("===========================");
  },
};

// Make globally available
window.ReviewManager = ReviewManager;

// Auto-initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  console.log("🏁 Review system loaded");

  // Check if we have a current provider from service-detail.js
  if (window.currentProvider) {
    console.log(
      "🎯 Initializing review system for provider:",
      window.currentProvider
    );
    ReviewManager.init(window.currentProvider);
  } else {
    console.log("⏳ Waiting for provider data...");
    // Check every 500ms for provider data
    const checkInterval = setInterval(() => {
      if (window.currentProvider) {
        clearInterval(checkInterval);
        console.log(
          "🎯 Initializing review system for provider:",
          window.currentProvider
        );
        ReviewManager.init(window.currentProvider);
      }
    }, 500);
  }
});

// Test functions
window.testReviewSystem = {
  initWithDummyProvider: function () {
    const dummyProvider = {
      id: 1,
      username: "Test Provider",
      name: "Test Provider",
      rating: 4.5,
      total_reviews: 10,
    };
    ReviewManager.init(dummyProvider);
  },

  simulateRating: function (rating) {
    ReviewManager.selectRating(rating);
  },

  testWithDummyBookings: function () {
    // Simulate having bookings
    ReviewManager.userBookings = [
      {
        id: 1,
        service_provider: 1,
        status: "COMPLETED",
        scheduled_date: "2024-01-15T10:00:00Z",
        description: "Test booking",
      },
      {
        id: 2,
        service_provider: 1,
        status: "COMPLETED",
        scheduled_date: "2024-01-20T14:00:00Z",
        description: "Another test booking",
      },
    ];
    ReviewManager.updateReviewForm();
    console.log("✅ Added dummy bookings for testing");
  },

  clearDummyBookings: function () {
    ReviewManager.userBookings = [];
    ReviewManager.updateReviewForm();
    console.log("✅ Cleared dummy bookings");
  },

  forceEnableForm: function () {
    const reviewForm = document.getElementById("reviewForm");
    if (reviewForm) {
      reviewForm.style.opacity = "1";
      reviewForm.style.pointerEvents = "auto";
      const submitBtn = reviewForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML =
          '<i class="fas fa-paper-plane"></i> Submit Review';
      }

      // Remove warning message
      const warningMsg = reviewForm.querySelector(".no-booking-message");
      if (warningMsg) warningMsg.remove();

      console.log("✅ Forced form enabled for testing");
    }
  },
};

// Test function to debug review creation
window.testReviewCreation = async function () {
  console.log("🧪 Testing review creation...");

  if (!window.currentProvider) {
    console.error("No current provider found");
    return;
  }

  // Get the first completed booking
  const bookings = await api.getBookings();
  const completedBooking = bookings.find(
    (b) =>
      b.provider_id == window.currentProvider.id && b.status === "COMPLETED"
  );

  if (!completedBooking) {
    console.error("No completed booking found for testing");
    return;
  }

  console.log("Using booking for test:", completedBooking);

  const testReviewData = {
    booking: completedBooking.id,
    provider_id: window.currentProvider.id,
    rating: 5,
    comment: "Test review from debug function",
  };

  console.log("Test review data:", testReviewData);

  try {
    const result = await api.createReview(testReviewData);
    console.log("✅ Test review created:", result);
    return result;
  } catch (error) {
    console.error("❌ Test review failed:", error);
    throw error;
  }
};

// Test the booking filter directly
window.testBookingFilter = async function () {
  console.log("🧪 Testing booking filter...");

  if (!window.currentProvider) {
    console.error("No current provider found");
    return;
  }

  try {
    const bookings = await api.getBookings();
    console.log("All bookings:", bookings);

    const providerId = window.currentProvider.id;
    console.log("Current provider ID:", providerId);

    // Test different ways to extract provider ID
    bookings.forEach((booking) => {
      console.log("\n--- Booking ID:", booking.id, "---");
      console.log("Booking object:", booking);
      console.log("booking.service_provider:", booking.service_provider);
      console.log("booking.provider_id:", booking.provider_id);
      console.log("booking.service_provider_id:", booking.service_provider_id);
      console.log("Booking status:", booking.status);

      // Extract provider ID
      let bookingProviderId;
      if (
        booking.service_provider &&
        typeof booking.service_provider === "object"
      ) {
        bookingProviderId = booking.service_provider.id;
      } else if (booking.service_provider) {
        bookingProviderId = booking.service_provider;
      } else if (booking.provider_id) {
        bookingProviderId = booking.provider_id;
      } else if (booking.service_provider_id) {
        bookingProviderId = booking.service_provider_id;
      }

      console.log("Extracted provider ID:", bookingProviderId);
      console.log("Matches current provider?", bookingProviderId == providerId);
      console.log("Is completed?", booking.status === "COMPLETED");
    });
  } catch (error) {
    console.error("Error testing booking filter:", error);
  }
};

console.log("✅ review.js loaded successfully");
