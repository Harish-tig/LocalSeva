/**
 * Mart (Marketplace Home) Page
 */
document.addEventListener("DOMContentLoaded", async function () {
  console.log("Mart page loaded");

  // Check authentication
  if (!appUtils.checkAuth()) return;

  // Update user name
  appUtils.updateUserName();

  // Initialize mart page
  if (window.location.pathname.includes("mart.html")) {
    console.log("Initializing mart page");
    await initMartPage();
  }
});

/**
 * Initialize mart page
 */
async function initMartPage() {
  console.log("Initializing mart page...");

  // Setup category cards
  setupCategoryCards();

  // Setup search
  setupMartSearch();

  // Load featured and recent products
  console.log("Loading featured and recent products...");
  await loadFeaturedProducts();
  await loadRecentProducts();
}

/**
 * Setup category cards
 */
function setupCategoryCards() {
  const categoryCards = document.querySelectorAll(".category-card");
  categoryCards.forEach((card) => {
    card.addEventListener("click", function () {
      const category = this.dataset.category;
      window.location.href = `shop.html?category=${encodeURIComponent(
        category
      )}`;
    });
  });
}

/**
 * Setup mart search
 */
function setupMartSearch() {
  const searchInput = document.getElementById("martSearch");
  if (!searchInput) return;

  // Debounced search
  const debouncedSearch = appUtils.debounce(function () {
    const term = searchInput.value.trim();
    if (term) {
      window.location.href = `shop.html?search=${encodeURIComponent(term)}`;
    }
  }, 500);

  searchInput.addEventListener("input", debouncedSearch);

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

/**
 * Load featured products (most viewed)
 */
async function loadFeaturedProducts() {
  const container = document.getElementById("featuredProducts");
  if (!container) {
    console.error("Featured products container not found");
    return;
  }

  // Show loading skeletons
  appUtils.showLoadingSkeletons(container, 4);

  try {
    console.log("Fetching featured products...");
    const products = await marketplaceAPI.getProducts({
      ordering: "-views",
      is_sold: false,
    });

    console.log("Featured products received:", products);

    if (!products || products.length === 0) {
      appUtils.showEmptyState(
        container,
        "No featured products yet",
        "fas fa-star"
      );
      return;
    }

    // Show first 4 products
    const featured = products.slice(0, 4);
    renderProductGrid(featured, container);
  } catch (error) {
    console.error("Error loading featured products:", error);
    appUtils.showErrorState(container, error);
  }
}

/**
 * Load recent products
 */
async function loadRecentProducts() {
  const container = document.getElementById("recentProducts");
  if (!container) {
    console.error("Recent products container not found");
    return;
  }

  // Show loading skeletons
  appUtils.showLoadingSkeletons(container, 4);

  try {
    console.log("Fetching recent products...");
    const products = await marketplaceAPI.getProducts({
      ordering: "-created_at",
      is_sold: false,
    });

    console.log("Recent products received:", products);

    if (!products || products.length === 0) {
      appUtils.showEmptyState(container, "No recent products", "fas fa-clock");
      return;
    }

    // Show first 4 products
    const recent = products.slice(0, 4);
    renderProductGrid(recent, container);
  } catch (error) {
    console.error("Error loading recent products:", error);
    appUtils.showErrorState(container, error);
  }
}

/**
 * Render products in grid
 */
function renderProductGrid(products, container) {
  if (!products || products.length === 0) {
    appUtils.showEmptyState(container, "No products found", "fas fa-box-open");
    return;
  }

  container.innerHTML = "";

  products.forEach((product) => {
    const productCard = appUtils.createProductCard(product);
    container.appendChild(productCard);
  });
}
