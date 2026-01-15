/**
 * Shop (Product Listing) Page
 */
document.addEventListener("DOMContentLoaded", async function () {
  console.log("Shop page loaded");

  // Check authentication
  if (!appUtils.checkAuth()) return;

  // Update user name
  appUtils.updateUserName();

  // Initialize shop page
  if (window.location.pathname.includes("shop.html")) {
    console.log("Initializing shop page");
    await initShopPage();
  }
});

/**
 * Initialize shop page
 */
async function initShopPage() {
  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const category = urlParams.get("category");
  const search = urlParams.get("search");

  console.log("URL parameters:", { category, search });

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
  const debouncedSearch = appUtils.debounce(() => {
    loadShopProducts();
  }, 300);

  if (searchInput) {
    searchInput.addEventListener("input", debouncedSearch);
  }

  // Other filters - add change listeners
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
  const debouncedPriceFilter = appUtils.debounce(() => {
    loadShopProducts();
  }, 500);

  [minPriceFilter, maxPriceFilter].forEach((filter) => {
    if (filter) {
      filter.addEventListener("input", debouncedPriceFilter);
    }
  });

  // Clear filters
  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      // Clear all filter values
      if (searchInput) searchInput.value = "";
      if (categoryFilter) categoryFilter.value = "";
      if (conditionFilter) conditionFilter.value = "";
      if (cityFilter) cityFilter.value = "";
      if (minPriceFilter) minPriceFilter.value = "";
      if (maxPriceFilter) maxPriceFilter.value = "";
      if (sortBy) sortBy.value = "-created_at";
      if (showSoldCheckbox) showSoldCheckbox.checked = true;

      // Clear URL parameters
      const url = new URL(window.location);
      url.search = "";
      window.history.replaceState({}, "", url);

      // Reset page title
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
 * Load products with filters
 */
async function loadShopProducts() {
  const container = document.getElementById("productsContainer");
  if (!container) {
    console.error("Products container not found");
    return;
  }

  console.log("Loading shop products...");

  // Show loading skeletons
  appUtils.showLoadingSkeletons(container, 3);

  // Build filters object
  const filters = buildFilters();

  console.log("Applying filters:", filters);

  try {
    const products = await marketplaceAPI.getProducts(filters);

    console.log("Shop products received:", products);

    renderShopProducts(products);
  } catch (error) {
    console.error("Error loading products:", error);
    appUtils.showErrorState(container, error);
  }
}

/**
 * Build filters object from form inputs
 */
function buildFilters() {
  const filters = {};

  // Text search
  const searchInput = document.getElementById("shopSearch");
  if (searchInput && searchInput.value.trim()) {
    filters.search = searchInput.value.trim();
  }

  // Category filter
  const categoryFilter = document.getElementById("shopCategoryFilter");
  if (categoryFilter && categoryFilter.value) {
    filters.category = categoryFilter.value;
  }

  // Condition filter
  const conditionFilter = document.getElementById("shopConditionFilter");
  if (conditionFilter && conditionFilter.value) {
    filters.condition = conditionFilter.value;
  }

  // City filter
  const cityFilter = document.getElementById("shopCityFilter");
  if (cityFilter && cityFilter.value) {
    filters.city = cityFilter.value;
  }

  // Price filters
  const minPriceFilter = document.getElementById("minPrice");
  if (minPriceFilter && minPriceFilter.value) {
    filters.min_price = parseFloat(minPriceFilter.value);
  }

  const maxPriceFilter = document.getElementById("maxPrice");
  if (maxPriceFilter && maxPriceFilter.value) {
    filters.max_price = parseFloat(maxPriceFilter.value);
  }

  // Sort order
  const sortBy = document.getElementById("sortBy");
  if (sortBy && sortBy.value) {
    filters.ordering = sortBy.value;
  }

  // Show sold items
  const showSoldCheckbox = document.getElementById("showSold");
  if (showSoldCheckbox && !showSoldCheckbox.checked) {
    filters.is_sold = false;
  }

  return filters;
}

/**
 * Render products in shop grid
 */
function renderShopProducts(products) {
  const container = document.getElementById("productsContainer");
  if (!container) return;

  if (!products || products.length === 0) {
    appUtils.showEmptyState(container, "No products found", "fas fa-search");

    // Add clear filters button to empty state
    const clearBtn = document.getElementById("clearShopFilters");
    if (clearBtn) {
      const emptyState = container.querySelector(".empty-state");
      if (emptyState) {
        const button = document.createElement("button");
        button.className = "btn btn-outline mt-2";
        button.textContent = "Clear All Filters";
        button.addEventListener("click", () => clearBtn.click());
        emptyState.appendChild(button);
      }
    }

    return;
  }

  container.innerHTML = "";

  products.forEach((product) => {
    const productCard = appUtils.createProductCard(product);
    container.appendChild(productCard);
  });
}
