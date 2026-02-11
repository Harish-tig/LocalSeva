/**
 * Services page functionality
 * Requires authentication to access
 */

document.addEventListener("DOMContentLoaded", async function () {
  // Check authentication
  if (!api.isAuthenticated()) {
    window.location.href = "index.html";
    return;
  }

  // Initialize services page
  await initServicesPage();
});

/**
 * Initialize services page
 */
async function initServicesPage() {
  // Load services
  await loadServices();

  // Setup filters
  setupFilters();

  // Setup search
  setupSearch();
}

// Store all services for client-side filtering
let allServices = [];

/**
 * Load services from API
 */
async function loadServices() {
  const container = document.getElementById("servicesContainer");
  if (!container) return;

  // Show loading state
  container.innerHTML = `
    <div class="loading-skeleton" style="height: 250px; border-radius: var(--border-radius); grid-column: 1 / -1;"></div>
    <div class="loading-skeleton" style="height: 250px; border-radius: var(--border-radius);"></div>
    <div class="loading-skeleton" style="height: 250px; border-radius: var(--border-radius);"></div>
  `;

  try {
    // Get providers from API
    const providers = await api.getProviders();
    console.log("Providers data:", providers); // Debug log

    // Check if we have providers
    if (!providers || providers.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <i class="fas fa-search"></i>
          <h3>No services found</h3>
          <p>Try adjusting your filters or check back later for new services.</p>
        </div>
      `;
      return;
    }

    // Map providers to service format
    const services = providers.map((provider) => {
      // Handle categories - could be string, array, or null
      let category = "Service";
      let categoriesArray = ["General"];

      if (provider.categories) {
        if (typeof provider.categories === "string") {
          // If it's a string, split by comma
          categoriesArray = provider.categories
            .split(",")
            .map((cat) => cat.trim());
          category = categoriesArray[0] || "Service";
        } else if (Array.isArray(provider.categories)) {
          // If it's already an array
          categoriesArray = provider.categories;
          category = categoriesArray[0] || "Service";
        } else {
          // If it's something else (like object or number)
          categoriesArray = [String(provider.categories)];
          category = String(provider.categories);
        }
      }

      // Get the primary category for display
      const primaryCategory = category;

      return {
        id: provider.id,
        name: provider.username || provider.name || "Unknown Provider",
        category: primaryCategory,
        location: provider.location || "Not specified",
        rating: provider.rating || 0,
        description:
          provider.bio || provider.description || "No description available",
        availability: provider.is_available ? "Available" : "Busy",
        price:
          provider.hourly_rate || provider.base_price || "Contact for price",
        pricing_type: provider.pricing_type,
        image: provider.avatar || getDefaultImage(primaryCategory),
        total_reviews: provider.total_reviews || 0,
        experience_years: provider.experience_years || 0,
        service_locations:
          provider.service_locations || provider.location || "Not specified",
        categories: categoriesArray.join(", "),
        categoriesArray: categoriesArray, // Store as array for filtering
        completed_bookings_count: provider.completed_bookings_count || 0, // ADD THIS LINE
      };
    });

    // Store all services for client-side filtering
    allServices = services;
    console.log("Processed services:", services); // Debug log

    // Render services
    renderServices(services);
  } catch (error) {
    console.error("Error loading services:", error);
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <i class="fas fa-exclamation-circle"></i>
        <h3>Error loading services</h3>
        <p>${error.message || "Please try again later."}</p>
        <button onclick="loadServices()" class="btn btn-outline">Retry</button>
      </div>
    `;
  }
}

/**
 * Get default image based on category
 */
function getDefaultImage(category) {
  if (!category) return "https://via.placeholder.com/300x200?text=Service";

  const categoryLower = category.toLowerCase();

  // Return appropriate Unsplash image based on category
  if (categoryLower.includes("cleaning")) {
    return "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop";
  } else if (
    categoryLower.includes("carpenter") ||
    categoryLower.includes("wood") ||
    categoryLower.includes("furniture")
  ) {
    return "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=300&fit=crop";
  } else if (
    categoryLower.includes("electrical") ||
    categoryLower.includes("electrician")
  ) {
    return "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=300&fit=crop";
  } else if (
    categoryLower.includes("plumbing") ||
    categoryLower.includes("plumber")
  ) {
    return "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop";
  } else if (
    categoryLower.includes("ceramic") ||
    categoryLower.includes("tile") ||
    categoryLower.includes("marble")
  ) {
    return "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=400&h=300&fit=crop";
  } else if (
    categoryLower.includes("fitness") ||
    categoryLower.includes("trainer") ||
    categoryLower.includes("gym")
  ) {
    return "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop";
  } else if (
    categoryLower.includes("delivery") ||
    categoryLower.includes("moving") ||
    categoryLower.includes("transport")
  ) {
    return "https://images.unsplash.com/photo-1556742111-a301b5f64d6d?w=400&h=300&fit=crop";
  } else if (
    categoryLower.includes("education") ||
    categoryLower.includes("tutor") ||
    categoryLower.includes("teacher")
  ) {
    return "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop";
  }

  // Default image for any other category
  return "https://via.placeholder.com/300x200?text=Service";
}

/**
 * Render services in grid
 */
function renderServices(services) {
  const container = document.getElementById("servicesContainer");
  if (!container) return;

  container.innerHTML = "";

  if (services.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <i class="fas fa-search"></i>
        <h3>No services found</h3>
        <p>Try adjusting your filters or check back later for new services.</p>
      </div>
    `;
    return;
  }

  services.forEach((service) => {
    const serviceCard = document.createElement("div");
    serviceCard.className = "card";

    // Format price display
    let priceDisplay = "Contact for price";
    if (
      service.pricing_type === "HOURLY" &&
      service.price &&
      service.price !== "Contact for price"
    ) {
      priceDisplay = `₹${parseFloat(service.price).toFixed(2)}/hr`;
    } else if (service.price && service.price !== "Contact for price") {
      priceDisplay = `₹${parseFloat(service.price).toFixed(2)}`;
    }

    // Get appropriate icon for category
    const categoryIcon = getCategoryIcon(service.category);

    serviceCard.innerHTML = `
      <img src="${service.image}" 
           alt="${service.name}" 
           class="card-img"
           onerror="this.src='https://via.placeholder.com/300x200?text=Service'">
      <div class="card-content">
        <div class="card-header">
          <h3 class="card-title">${service.name}</h3>
          <span class="badge ${
            service.availability === "Available"
              ? "badge-success"
              : "badge-warning"
          }">
            ${service.availability}
          </span>
        </div>
        <div class="card-meta">
          <span><i class="${categoryIcon}"></i> ${service.category}</span>
          <span><i class="fas fa-map-marker-alt"></i> ${service.location || "Local"}</span>
          <span><i class="fas fa-star"></i> ${service.rating.toFixed(1)}</span>
          <span><i class="fas fa-check-circle"></i> ${service.completed_bookings_count || 0} jobs</span>
        </div>
        <p class="service-description-short">${service.description.substring(
          0,
          100,
        )}${service.description.length > 100 ? "..." : ""}</p>
        <div class="card-footer">
          <span class="price">${priceDisplay}</span>
          <a href="service-detail.html?id=${
            service.id
          }" class="btn btn-primary btn-sm">
            View Details
          </a>
        </div>
      </div>
    `;

    container.appendChild(serviceCard);
  });
}

/**
 * Get Font Awesome icon for category
 */
function getCategoryIcon(category) {
  if (!category) return "fas fa-tag";

  const categoryLower = category.toLowerCase();
  if (categoryLower.includes("cleaning")) return "fas fa-broom";
  if (categoryLower.includes("carpenter")) return "fas fa-hammer";
  if (categoryLower.includes("electrical")) return "fas fa-bolt";
  if (categoryLower.includes("plumbing")) return "fas fa-faucet";
  if (categoryLower.includes("ceramic")) return "fas fa-tile";
  if (categoryLower.includes("fitness")) return "fas fa-dumbbell";
  if (categoryLower.includes("delivery") || categoryLower.includes("moving"))
    return "fas fa-truck";
  if (categoryLower.includes("education") || categoryLower.includes("tutor"))
    return "fas fa-graduation-cap";
  return "fas fa-tag";
}

/**
 * Setup filter functionality
 */
function setupFilters() {
  // Category filter buttons
  const categoryButtons = document.querySelectorAll(".category-filter");
  categoryButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      // Update active state
      categoryButtons.forEach((b) => b.classList.remove("active"));
      this.classList.add("active");

      // Apply filters
      applyFilters();
    });
  });

  // Location filter
  const locationFilter = document.getElementById("locationFilter");
  if (locationFilter) {
    locationFilter.addEventListener("change", applyFilters);
  }

  // Clear filters button
  const clearBtn = document.getElementById("clearFilters");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      // Reset filters
      document.querySelectorAll(".category-filter").forEach((btn) => {
        if (btn.dataset.category === "all") {
          btn.classList.add("active");
        } else {
          btn.classList.remove("active");
        }
      });

      if (locationFilter) locationFilter.value = "";

      const searchInput = document.getElementById("servicesSearch");
      if (searchInput) searchInput.value = "";

      // Render all services
      renderServices(allServices);
    });
  }
}

/**
 * Setup search functionality
 */
function setupSearch() {
  const searchInput = document.getElementById("servicesSearch");
  if (!searchInput) return;

  let searchTimer;

  searchInput.addEventListener("input", function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(applyFilters, 300);
  });
}

/**
 * Apply filters (client-side filtering)
 */
function applyFilters() {
  // Get active category
  const activeCategory = document.querySelector(".category-filter.active");
  const selectedCategory = activeCategory
    ? activeCategory.dataset.category
    : "all";

  // Get location filter
  const locationFilter = document.getElementById("locationFilter");
  const selectedLocation = locationFilter ? locationFilter.value : "";

  // Get search term
  const searchInput = document.getElementById("servicesSearch");
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";

  // Filter services
  let filteredServices = allServices;

  // Apply category filter
  if (selectedCategory && selectedCategory !== "all") {
    filteredServices = filteredServices.filter((service) => {
      const serviceCategory = service.category
        ? service.category.toLowerCase()
        : "";
      const serviceCategories = service.categories
        ? service.categories.toLowerCase()
        : "";

      return (
        serviceCategory.includes(selectedCategory.toLowerCase()) ||
        serviceCategories.includes(selectedCategory.toLowerCase())
      );
    });
  }

  // Apply location filter
  if (selectedLocation) {
    filteredServices = filteredServices.filter((service) => {
      const serviceLocation = service.location
        ? service.location.toLowerCase()
        : "";
      const serviceServiceLocations = service.service_locations
        ? service.service_locations.toLowerCase()
        : "";

      return (
        serviceLocation.includes(selectedLocation.toLowerCase()) ||
        serviceServiceLocations.includes(selectedLocation.toLowerCase())
      );
    });
  }

  // Apply search filter
  if (searchTerm) {
    filteredServices = filteredServices.filter((service) => {
      const serviceName = service.name ? service.name.toLowerCase() : "";
      const serviceDescription = service.description
        ? service.description.toLowerCase()
        : "";
      const serviceCategory = service.category
        ? service.category.toLowerCase()
        : "";
      const serviceCategories = service.categories
        ? service.categories.toLowerCase()
        : "";

      return (
        serviceName.includes(searchTerm) ||
        serviceDescription.includes(searchTerm) ||
        serviceCategory.includes(searchTerm) ||
        serviceCategories.includes(searchTerm)
      );
    });
  }

  // Render filtered services
  renderServices(filteredServices);
}
