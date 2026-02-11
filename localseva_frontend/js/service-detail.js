/**
 * Service Detail page functionality
 */

document.addEventListener("DOMContentLoaded", async function () {
  console.log("🏁 Service Detail page loading...");

  // Check authentication
  if (!api.isAuthenticated()) {
    console.log("❌ User not authenticated, redirecting to login");
    window.location.href = "index.html";
    return;
  }

  // Get service ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const serviceId = urlParams.get("id");

  if (!serviceId) {
    console.log("❌ No service ID found in URL, redirecting to services");
    window.location.href = "services.html";
    return;
  }

  console.log("🔍 Loading service details for ID:", serviceId);

  // Load service details
  await loadServiceDetails(serviceId);
});

/**
 * Load service details from API
 */
async function loadServiceDetails(serviceId) {
  const container = document.getElementById("serviceDetail");
  if (!container) {
    console.error("❌ Service detail container not found");
    return;
  }

  // Show loading state
  container.innerHTML = `
    <div class="loading-skeleton" style="height: 400px; border-radius: var(--border-radius);"></div>
  `;

  try {
    console.log("📡 Fetching providers from API...");

    // Get all providers and find the one with matching ID
    const providers = await api.getProviders();
    console.log("✅ Providers fetched:", providers);

    const provider = providers.find((p) => p.id == serviceId);
    console.log("🔍 Found provider:", provider);

    if (!provider) {
      throw new Error("Service not found");
    }

    // Store provider globally for use in request service AND review system
    window.currentProvider = provider;
    console.log("💾 Provider stored globally:", window.currentProvider);

    // Render service details
    renderServiceDetails(provider);

    // Initialize service request functionality
    if (typeof ServiceRequestManager !== "undefined") {
      ServiceRequestManager.init(provider);
    } else {
      console.error("❌ ServiceRequestManager not loaded!");
    }

    // Initialize review system
    if (typeof ReviewManager !== "undefined") {
      ReviewManager.init(provider);
    } else {
      console.error("❌ ReviewManager not loaded!");
    }
  } catch (error) {
    console.error("❌ Error loading service details:", error);
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-circle"></i>
        <h3>Error loading service details</h3>
        <p>${error.message || "Please try again later."}</p>
        <a href="services.html" class="btn btn-outline">Back to Services</a>
      </div>
    `;
  }
}

/**
 * Render service details
 */
function renderServiceDetails(provider) {
  console.log("🎨 Rendering service details for:", provider.username);

  const container = document.getElementById("serviceDetail");
  if (!container) {
    console.error("❌ Container not found");
    return;
  }

  // Format categories - handle different data types
  let categories = [];
  let categoriesText = "General";

  if (provider.categories) {
    console.log("📋 Original categories:", provider.categories);

    if (typeof provider.categories === "string") {
      categories = provider.categories.split(",").map((cat) => cat.trim());
    } else if (Array.isArray(provider.categories)) {
      categories = provider.categories;
    } else {
      categories = [String(provider.categories)];
    }
    categoriesText = categories.join(", ");
    console.log("📝 Processed categories:", categories);
  }

  // Format price
  let priceDisplay = "Contact for price";
  if (provider.pricing_type === "HOURLY" && provider.hourly_rate) {
    priceDisplay = `₹${parseFloat(provider.hourly_rate).toFixed(2)}/hour`;
  } else if (provider.base_price) {
    priceDisplay = `₹${parseFloat(provider.base_price).toFixed(2)}`;
  }
  console.log("💰 Price display:", priceDisplay);

  // Format availability
  const availabilityText = provider.is_available
    ? "Available"
    : "Currently Busy";
  const availabilityClass = provider.is_available
    ? "badge-success"
    : "badge-warning";
  const availabilityIcon = provider.is_available
    ? "fa-check-circle"
    : "fa-clock";

  console.log("📅 Availability:", availabilityText);

  // Get avatar or use category-based image
  let avatarUrl = provider.avatar;
  if (!avatarUrl) {
    // If no avatar from API, use a default based on category
    avatarUrl = getDefaultImageUrl(categories[0] || "General");
  }
  console.log("🖼️ Avatar URL:", avatarUrl);

  container.innerHTML = `
    <div class="detail-header">
      <div class="detail-images">
        <img src="${avatarUrl}" 
             alt="${provider.username}"
             onerror="this.src='https://via.placeholder.com/300x200?text=Service'"
             style="width: 100%; height: 300px; object-fit: cover; border-radius: 8px;">
      </div>
      <div class="detail-info">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
          <h1>${provider.username || provider.name || "Provider"}</h1>
          <span class="badge ${availabilityClass}" style="padding: 0.5rem 1rem; font-size: 0.9rem;">
            <i class="fas ${availabilityIcon}"></i>
            ${availabilityText}
          </span>
        </div>
        
        <div class="detail-meta" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
          <div class="detail-meta-item" style="display: flex; align-items: center; gap: 0.5rem;">
            <i class="fas fa-tag" style="color: var(--primary);"></i>
            <span>${categoriesText}</span>
          </div>
          <div class="detail-meta-item" style="display: flex; align-items: center; gap: 0.5rem;">
            <i class="fas fa-map-marker-alt" style="color: var(--primary);"></i>
            <span>${provider.location || "Location not specified"}</span>
          </div>
          <div class="detail-meta-item" style="display: flex; align-items: center; gap: 0.5rem;">
            <i class="fas fa-star" style="color: #fbbf24;"></i>
            <span>${provider.rating ? provider.rating.toFixed(1) : "0.0"} (${provider.total_reviews || 0} reviews)</span>
          </div>
          <div class="detail-meta-item" style="display: flex; align-items: center; gap: 0.5rem;">
            <i class="fas fa-briefcase" style="color: var(--primary);"></i>
            <span>${provider.experience_years || 0} years experience</span>
          </div>
          <div class="detail-meta-item" style="display: flex; align-items: center; gap: 0.5rem;">
            <i class="fas fa-money-bill-wave" style="color: #10b981;"></i>
            <span>${priceDisplay}</span>
          </div>
          
          <div class="detail-meta-item" style="display: flex; align-items: center; gap: 0.5rem;">
            <i class="fas fa-check-circle" style="color: #10b981;"></i>
            <span>${provider.completed_bookings_count || 0} completed jobs</span>
          </div>
        </div>
        
        <div class="service-description" style="margin-bottom: 2rem; padding: 1.5rem; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h3 style="margin-top: 0; margin-bottom: 1rem; color: #374151;">Service Details</h3>
          <div style="display: grid; gap: 0.5rem;">
            <p style="margin: 0; color: #6b7280;"><strong>Service Areas:</strong> ${
              provider.service_locations || provider.location || "Not specified"
            }</p>
            <p style="margin: 0; color: #6b7280;"><strong>Availability:</strong> ${
              provider.availability || "Flexible"
            }</p>
            <p style="margin: 0; color: #6b7280;"><strong>Pricing:</strong> ${priceDisplay}</p>
          </div>
        </div>
        
        <div class="detail-actions" style="display: flex; gap: 1rem; margin-top: 2rem;">
          <button class="btn btn-primary" id="requestServiceBtn" style="flex: 1; padding: 1rem; font-size: 1rem;">
            <i class="fas fa-calendar-check"></i> Request Service
          </button>
          <button class="btn btn-outline" id="contactProviderBtn" style="flex: 1; padding: 1rem; font-size: 1rem;">
            <i class="fas fa-envelope"></i> Contact Provider
          </button>
        </div>
      </div>
    </div>
  `;

  console.log("✅ Service details rendered successfully");

  // Add event listeners for action buttons
  document
    .getElementById("contactProviderBtn")
    ?.addEventListener("click", () => {
      console.log("📞 Contact button clicked");
      if (provider.phone) {
        appUtils.showNotification(
          `Contact provider at: ${provider.phone}`,
          "info",
        );
      } else if (provider.email) {
        appUtils.showNotification(
          `Contact provider at: ${provider.email}`,
          "info",
        );
      } else {
        appUtils.showNotification(
          "No contact information available",
          "warning",
        );
      }
    });
}

/**
 * Get default image URL based on category
 * This is a helper function that's only used if the API doesn't provide an avatar
 */
function getDefaultImageUrl(categories) {
  if (!categories) {
    console.log("📸 No category provided, using default image");
    return "https://via.placeholder.com/300x200?text=Service";
  }

  console.log("📸 Getting image for category:", categories);

  const category = categories.toLowerCase();
  if (category.includes("cleaning")) {
    return "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop";
  } else if (category.includes("plumbing")) {
    return "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop";
  } else if (category.includes("repair")) {
    return "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=300&fit=crop";
  } else if (category.includes("carpenter") || category.includes("wood")) {
    return "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=300&fit=crop";
  } else if (
    category.includes("electrical") ||
    category.includes("electrician")
  ) {
    return "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=300&fit=crop";
  } else if (category.includes("ceramic") || category.includes("tile")) {
    return "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=400&h=300&fit=crop";
  } else if (category.includes("fitness")) {
    return "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop";
  } else if (category.includes("delivery") || category.includes("moving")) {
    return "https://images.unsplash.com/photo-1556742111-a301b5f64d6d?w=400&h=300&fit=crop";
  } else if (category.includes("education") || category.includes("tutor")) {
    return "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop";
  }

  console.log("📸 Using generic service image");
  return "https://via.placeholder.com/300x200?text=Service";
}

// Add console test functions
window.testServiceDetail = {
  getProviderInfo: function () {
    return window.currentProvider;
  },

  testRequestService: function () {
    const requestBtn = document.getElementById("requestServiceBtn");
    if (requestBtn) {
      console.log("🔘 Clicking request service button...");
      requestBtn.click();
    } else {
      console.error("❌ Request button not found");
    }
  },

  checkElements: function () {
    console.log("🔍 Checking DOM elements:");
    console.log(
      "- Service detail container:",
      document.getElementById("serviceDetail"),
    );
    console.log(
      "- Request button:",
      document.getElementById("requestServiceBtn"),
    );
    console.log(
      "- Contact button:",
      document.getElementById("contactProviderBtn"),
    );
    console.log("- Current provider:", window.currentProvider);
    console.log("- ServiceRequestManager:", typeof ServiceRequestManager);
    console.log("- ReviewManager:", typeof ReviewManager);
  },
};

console.log("✅ service-detail.js loaded successfully");
