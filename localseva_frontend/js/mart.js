/**
 * Marketplace page functionality
 * Requires authentication to access
 */

document.addEventListener("DOMContentLoaded", async function () {
  // Check authentication
  if (!api.isAuthenticated()) {
    window.location.href = "index.html";
    return;
  }

  // Initialize based on current page
  if (window.location.pathname.includes("mart.html")) {
    await initMartPage();
  } else if (window.location.pathname.includes("shop.html")) {
    await initShopPage();
  } else if (window.location.pathname.includes("add-item.html")) {
    initAddItemPage();
  }
});

/**
 * Initialize mart (marketplace home) page
 */
async function initMartPage() {
  // Setup category cards
  const categoryCards = document.querySelectorAll(".category-card");
  categoryCards.forEach((card) => {
    card.addEventListener("click", function () {
      const category = this.dataset.category;
      // Map display category to API category
      const categoryMap = {
        Electronics: "ELECTRONICS",
        Furniture: "FURNITURE",
        Clothing: "CLOTHING",
        Books: "BOOKS",
        Vehicles: "VEHICLES",
        Sports: "SPORTS",
        "Home Appliances": "HOME_APPLIANCES",
        Other: "OTHER",
      };

      const apiCategory = categoryMap[category] || category;
      window.location.href = `shop.html?category=${encodeURIComponent(
        apiCategory
      )}`;
    });
  });

  // Setup search
  const searchInput = document.getElementById("martSearch");
  if (searchInput) {
    let searchTimer;

    searchInput.addEventListener("input", function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        const term = this.value.trim();
        if (term) {
          window.location.href = `shop.html?search=${encodeURIComponent(term)}`;
        }
      }, 500);
    });

    // Enter key to search
    searchInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        const term = this.value.trim();
        if (term) {
          window.location.href = `shop.html?search=${encodeURIComponent(term)}`;
        }
      }
    });
  }

  // Load featured and recent products
  await loadFeaturedProducts();
  await loadRecentProducts();
}

/**
 * Load featured products (most viewed)
 */
async function loadFeaturedProducts() {
  const container = document.getElementById("featuredProducts");
  if (!container) return;

  try {
    // Get featured products (ordering by views)
    const products = await api.getProducts({
      ordering: "-views",
      is_sold: false,
    });

    if (!products || products.length === 0) {
      container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-star"></i>
                    <p>No featured products at the moment</p>
                </div>
            `;
      return;
    }

    // Show first 4 products
    const featured = products.slice(0, 4);
    renderProducts(featured, container);
  } catch (error) {
    console.error("Error loading featured products:", error);
    container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error loading featured products</p>
            </div>
        `;
  }
}

/**
 * Load recent products
 */
async function loadRecentProducts() {
  const container = document.getElementById("recentProducts");
  if (!container) return;

  try {
    // Get recent products (ordering by creation date)
    const products = await api.getProducts({
      ordering: "-created_at",
      is_sold: false,
    });

    if (!products || products.length === 0) {
      container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clock"></i>
                    <p>No recent products</p>
                </div>
            `;
      return;
    }

    // Show first 4 products
    const recent = products.slice(0, 4);
    renderProducts(recent, container);
  } catch (error) {
    console.error("Error loading recent products:", error);
    container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error loading recent products</p>
            </div>
        `;
  }
}

/**
 * Render products in a container
 */
function renderProducts(products, container) {
  container.innerHTML = "";

  products.forEach((product) => {
    const productCard = document.createElement("div");
    productCard.className = "card";

    // Format price
    const price = parseFloat(product.price).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    });

    productCard.innerHTML = `
            <img src="${
              product.main_image ||
              "https://via.placeholder.com/300x200?text=No+Image"
            }" 
                 alt="${product.title}" class="card-img">
            <div class="card-content">
                <h3 class="card-title">${product.title}</h3>
                <div class="card-meta">
                    <span><i class="fas fa-tag"></i> ${product.category.replace(
                      "_",
                      " "
                    )}</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${
                      product.city
                    }</span>
                    <span><i class="fas fa-eye"></i> ${product.views}</span>
                </div>
                <p class="service-description-short">
                    ${
                      product.description
                        ? product.description.length > 100
                          ? product.description.substring(0, 100) + "..."
                          : product.description
                        : "No description"
                    }
                </p>
                <div class="card-footer">
                    <span class="price">${price}</span>
                    <a href="product-detail.html?id=${
                      product.id
                    }" class="btn btn-primary btn-sm">
                        View Details
                    </a>
                </div>
            </div>
        `;

    container.appendChild(productCard);
  });
}

/**
 * Initialize shop (product listing) page
 */
async function initShopPage() {
  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const category = urlParams.get("category");
  const search = urlParams.get("search");

  // Update page title if category is selected
  if (category) {
    const pageHeader = document.querySelector(".page-header h1");
    if (pageHeader) {
      pageHeader.textContent = `${category.replace("_", " ")} - Products`;
    }
  }

  // Set initial filter values
  if (category) {
    const categoryFilter = document.getElementById("shopCategoryFilter");
    if (categoryFilter) categoryFilter.value = category;
  }

  if (search) {
    const searchInput = document.getElementById("shopSearch");
    if (searchInput) searchInput.value = search;
  }

  // Setup filters
  setupShopFilters();

  // Load products
  await loadShopProducts();
}

/**
 * Setup shop page filters
 */
function setupShopFilters() {
  const searchInput = document.getElementById("shopSearch");
  const categoryFilter = document.getElementById("shopCategoryFilter");
  const conditionFilter = document.getElementById("shopConditionFilter");
  const cityFilter = document.getElementById("shopCityFilter");
  const minPriceFilter = document.getElementById("minPrice");
  const maxPriceFilter = document.getElementById("maxPrice");
  const sortBy = document.getElementById("sortBy");
  const showSoldCheckbox = document.getElementById("showSold");
  const clearBtn = document.getElementById("clearShopFilters");

  // Debounced search
  let searchTimer;
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        loadShopProducts();
      }, 300);
    });
  }

  // Other filters
  [
    categoryFilter,
    conditionFilter,
    cityFilter,
    sortBy,
    showSoldCheckbox,
  ].forEach((filter) => {
    if (filter) {
      filter.addEventListener("change", () => {
        loadShopProducts();
      });
    }
  });

  // Price filters with debounce
  [minPriceFilter, maxPriceFilter].forEach((filter) => {
    if (filter) {
      filter.addEventListener("input", function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
          loadShopProducts();
        }, 500);
      });
    }
  });

  // Clear filters
  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      if (searchInput) searchInput.value = "";
      if (categoryFilter) categoryFilter.value = "";
      if (conditionFilter) conditionFilter.value = "";
      if (cityFilter) cityFilter.value = "";
      if (minPriceFilter) minPriceFilter.value = "";
      if (maxPriceFilter) maxPriceFilter.value = "";
      if (sortBy) sortBy.value = "-created_at";
      if (showSoldCheckbox) showSoldCheckbox.checked = false;

      // Update URL
      const url = new URL(window.location);
      url.search = "";
      window.history.replaceState({}, "", url);

      // Update page title
      const pageHeader = document.querySelector(".page-header h1");
      if (pageHeader) {
        pageHeader.textContent = "All Products";
      }

      // Reload products
      loadShopProducts();
    });
  }
}

/**
 * Load products for shop page with filters
 */
async function loadShopProducts() {
  const container = document.getElementById("productsContainer");
  if (!container) return;

  // Show loading
  container.innerHTML = `
        <div class="loading-skeleton" style="height: 300px; border-radius: var(--border-radius);"></div>
        <div class="loading-skeleton" style="height: 300px; border-radius: var(--border-radius);"></div>
        <div class="loading-skeleton" style="height: 300px; border-radius: var(--border-radius);"></div>
    `;

  // Build filters
  const filters = {};

  const searchInput = document.getElementById("shopSearch");
  if (searchInput && searchInput.value) {
    filters.search = searchInput.value;
  }

  const categoryFilter = document.getElementById("shopCategoryFilter");
  if (categoryFilter && categoryFilter.value) {
    filters.category = categoryFilter.value;
  }

  const conditionFilter = document.getElementById("shopConditionFilter");
  if (conditionFilter && conditionFilter.value) {
    filters.condition = conditionFilter.value;
  }

  const cityFilter = document.getElementById("shopCityFilter");
  if (cityFilter && cityFilter.value) {
    filters.city = cityFilter.value;
  }

  const minPriceFilter = document.getElementById("minPrice");
  if (minPriceFilter && minPriceFilter.value) {
    filters.min_price = parseFloat(minPriceFilter.value);
  }

  const maxPriceFilter = document.getElementById("maxPrice");
  if (maxPriceFilter && maxPriceFilter.value) {
    filters.max_price = parseFloat(maxPriceFilter.value);
  }

  const sortBy = document.getElementById("sortBy");
  if (sortBy && sortBy.value) {
    filters.ordering = sortBy.value;
  }

  const showSoldCheckbox = document.getElementById("showSold");
  if (showSoldCheckbox && !showSoldCheckbox.checked) {
    filters.is_sold = false;
  }

  try {
    const products = await api.getProducts(filters);

    if (!products || products.length === 0) {
      container.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <i class="fas fa-search"></i>
                    <h3>No products found</h3>
                    <p>Try adjusting your filters or check back later.</p>
                    <button id="clearFiltersBtn" class="btn btn-outline">
                        Clear All Filters
                    </button>
                </div>
            `;

      // Add event listener to clear filters button
      document
        .getElementById("clearFiltersBtn")
        ?.addEventListener("click", () => {
          const clearBtn = document.getElementById("clearShopFilters");
          if (clearBtn) clearBtn.click();
        });
      return;
    }

    renderShopProducts(products);
  } catch (error) {
    console.error("Error loading products:", error);
    container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Error loading products</h3>
                <p>Please try again later.</p>
            </div>
        `;
  }
}

/**
 * Render products in shop grid
 */
function renderShopProducts(products) {
  const container = document.getElementById("productsContainer");
  if (!container) return;

  container.innerHTML = "";

  products.forEach((product) => {
    const productCard = document.createElement("div");
    productCard.className = "card";

    // Format price
    const price = parseFloat(product.price).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    });

    // Condition badge
    const conditionLabels = {
      NEW: "New",
      LIKE_NEW: "Like New",
      GOOD: "Good",
      FAIR: "Fair",
      POOR: "Poor",
    };

    productCard.innerHTML = `
            ${product.is_sold ? '<div class="sold-overlay">SOLD</div>' : ""}
            <img src="${
              product.main_image ||
              "https://via.placeholder.com/300x200?text=No+Image"
            }" 
                 alt="${product.title}" class="card-img">
            <div class="card-content">
                <h3 class="card-title">${product.title}</h3>
                <div class="card-meta">
                    <span><i class="fas fa-tag"></i> ${product.category.replace(
                      "_",
                      " "
                    )}</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${
                      product.city
                    }</span>
                    <span><i class="fas fa-eye"></i> ${product.views}</span>
                </div>
                <div class="product-condition">
                    <span class="badge badge-primary">
                        ${
                          conditionLabels[product.condition] ||
                          product.condition
                        }
                    </span>
                </div>
                <p class="service-description-short">
                    ${
                      product.description
                        ? product.description.length > 100
                          ? product.description.substring(0, 100) + "..."
                          : product.description
                        : "No description"
                    }
                </p>
                <div class="card-footer">
                    <span class="price">${price}</span>
                    <a href="product-detail.html?id=${
                      product.id
                    }" class="btn btn-primary btn-sm">
                        View Details
                    </a>
                </div>
            </div>
        `;

    container.appendChild(productCard);
  });
}
