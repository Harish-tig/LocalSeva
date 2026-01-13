/**
 * Marketplace page functionality
 * Requires authentication to access
 */

document.addEventListener("DOMContentLoaded", async function () {
  // Check authentication
  // if (!api.isAuthenticated()) {
  //   window.location.href = "index.html";
  //   return;
  // }

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
      window.location.href = `shop.html?category=${encodeURIComponent(
        category
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
 * Load featured products
 */
async function loadFeaturedProducts() {
  const container = document.getElementById("featuredProducts");
  if (!container) return;

  try {
    // Get featured products (you might need to adjust this filter)
    const products = await api.getProducts({ featured: true });

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
    // Get recent products (you might need to adjust this filter)
    const products = await api.getProducts({ recent: true });

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
    productCard.innerHTML = `
            <img src="${
              product.image ||
              product.images?.[0] ||
              api.mockData.products[0].image
            }" 
                 alt="${product.name}" class="card-img">
            <div class="card-content">
                <h3 class="card-title">${product.name}</h3>
                <div class="card-meta">
                    <span><i class="fas fa-tag"></i> ${
                      product.category || "Product"
                    }</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${
                      product.location || "Local"
                    }</span>
                </div>
                <div class="card-footer">
                    <span class="price">${appUtils.formatCurrency(
                      product.price
                    )}</span>
                    <a href="product-detail.html?id=${
                      product.id
                    }" class="btn btn-primary btn-sm">
                        View
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
  const locationFilter = document.getElementById("shopLocationFilter");
  const sortBy = document.getElementById("sortBy");
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
  [categoryFilter, locationFilter, sortBy].forEach((filter) => {
    if (filter) {
      filter.addEventListener("change", () => {
        loadShopProducts();
      });
    }
  });

  // Clear filters
  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      if (searchInput) searchInput.value = "";
      if (categoryFilter) categoryFilter.value = "";
      if (locationFilter) locationFilter.value = "";
      if (sortBy) sortBy.value = "recent";

      // Update URL
      const url = new URL(window.location);
      url.search = "";
      window.history.replaceState({}, "", url);

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
        <div class="loading-skeleton" style="height: 250px; border-radius: var(--border-radius); grid-column: 1 / -1;"></div>
        <div class="loading-skeleton" style="height: 250px; border-radius: var(--border-radius);"></div>
        <div class="loading-skeleton" style="height: 250px; border-radius: var(--border-radius);"></div>
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

  const locationFilter = document.getElementById("shopLocationFilter");
  if (locationFilter && locationFilter.value) {
    filters.location = locationFilter.value;
  }

  const sortBy = document.getElementById("sortBy");
  if (sortBy && sortBy.value) {
    filters.ordering =
      sortBy.value === "price_low"
        ? "price"
        : sortBy.value === "price_high"
        ? "-price"
        : "-created_at";
  }

  try {
    const products = await api.getProducts(filters);

    if (!products || products.length === 0) {
      container.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <i class="fas fa-search"></i>
                    <h3>No products found</h3>
                    <p>Try adjusting your filters or check back later.</p>
                </div>
            `;
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
    productCard.innerHTML = `
            <img src="${
              product.image ||
              product.images?.[0] ||
              api.mockData.products[0].image
            }" 
                 alt="${product.name}" class="card-img">
            <div class="card-content">
                <h3 class="card-title">${product.name}</h3>
                <div class="card-meta">
                    <span><i class="fas fa-tag"></i> ${
                      product.category || "Product"
                    }</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${
                      product.location || "Local"
                    }</span>
                    ${
                      product.rating
                        ? `<span><i class="fas fa-star"></i> ${product.rating}</span>`
                        : ""
                    }
                </div>
                <p>${
                  product.description
                    ? product.description.length > 100
                      ? product.description.substring(0, 100) + "..."
                      : product.description
                    : "No description"
                }</p>
                <div class="card-footer">
                    <span class="price">${appUtils.formatCurrency(
                      product.price
                    )}</span>
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
 * Initialize add item page
 */
function initAddItemPage() {
  const form = document.getElementById("addItemForm");
  if (!form) return;

  // Character count for description
  const description = document.getElementById("itemDescription");
  const charCount = document.getElementById("charCount");

  if (description && charCount) {
    description.addEventListener("input", function () {
      charCount.textContent = this.value.length;

      if (this.value.length > 1000) {
        charCount.style.color = "var(--danger-color)";
      } else if (this.value.length > 800) {
        charCount.style.color = "var(--warning-color)";
      } else {
        charCount.style.color = "var(--text-secondary)";
      }
    });
  }

  // Form submission
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!validateItemForm()) {
      return;
    }

    const formData = getItemFormData();

    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Listing Item...';

    try {
      // Call API to add product
      const result = await api.addProduct(formData);

      appUtils.showNotification("Item listed successfully!", "success");

      // Redirect to product page
      setTimeout(() => {
        window.location.href = `product-detail.html?id=${result.id}`;
      }, 1500);
    } catch (error) {
      console.error("Error adding item:", error);
      appUtils.showNotification(
        "Failed to list item. Please try again.",
        "error"
      );

      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
}

/**
 * Validate add item form
 */
function validateItemForm() {
  const itemName = document.getElementById("itemName");
  const itemCategory = document.getElementById("itemCategory");
  const itemPrice = document.getElementById("itemPrice");
  const itemDescription = document.getElementById("itemDescription");
  const itemLocation = document.getElementById("itemLocation");

  let isValid = true;

  // Basic validation
  if (!itemName.value.trim()) {
    isValid = false;
    itemName.classList.add("error");
  } else {
    itemName.classList.remove("error");
  }

  if (!itemCategory.value) {
    isValid = false;
    itemCategory.classList.add("error");
  } else {
    itemCategory.classList.remove("error");
  }

  if (!itemPrice.value || parseFloat(itemPrice.value) <= 0) {
    isValid = false;
    itemPrice.classList.add("error");
  } else {
    itemPrice.classList.remove("error");
  }

  if (!itemDescription.value.trim()) {
    isValid = false;
    itemDescription.classList.add("error");
  } else if (itemDescription.value.length > 1000) {
    isValid = false;
    itemDescription.classList.add("error");
    appUtils.showNotification(
      "Description must be 1000 characters or less",
      "error"
    );
  } else {
    itemDescription.classList.remove("error");
  }

  if (!itemLocation.value) {
    isValid = false;
    itemLocation.classList.add("error");
  } else {
    itemLocation.classList.remove("error");
  }

  if (!isValid) {
    appUtils.showNotification(
      "Please fill in all required fields correctly",
      "error"
    );
  }

  return isValid;
}

/**
 * Get form data from add item form
 */
function getItemFormData() {
  const contactMethods = Array.from(
    document.querySelectorAll('input[name="contactMethods"]:checked')
  ).map((cb) => cb.value);

  return {
    name: document.getElementById("itemName").value.trim(),
    category: document.getElementById("itemCategory").value,
    condition: document.getElementById("itemCondition").value,
    price: parseFloat(document.getElementById("itemPrice").value),
    description: document.getElementById("itemDescription").value.trim(),
    location: document.getElementById("itemLocation").value,
    meetup_preference: document.getElementById("meetupPreference").value,
    contact_methods: contactMethods,
    // Note: Image upload would need separate handling
  };
}
