/**
 * My Products page functionality
 */

// Store products data for reference
let currentProductsData = [];

document.addEventListener("DOMContentLoaded", async function () {
  console.log("My Products page loaded");

  // Check authentication
  if (!api.isAuthenticated()) {
    window.location.href = "index.html";
    return;
  }

  // Load products
  await loadMyProducts();

  // Setup tabs
  setupTabs();

  // Setup theme toggle
  setupThemeToggle();

  // Setup logout button
  setupLogoutButton();

  // Setup sidebar
  setupSidebar();
});

/**
 * Load user's products
 */
async function loadMyProducts() {
  console.log("Loading my products...");

  try {
    // Show loading state for all containers
    showLoadingState();

    // Get user's products
    const products = await api.getMyProducts();

    // Store products data for later use
    currentProductsData = products || [];

    console.log("My products received:", products);

    if (!products || products.length === 0) {
      console.log("No products found");
      showEmptyState();
      return;
    } else {
      console.log(`Found ${products.length} products`);
    }

    // Update stats
    updateStats(products);

    // Render products
    renderProducts(products);
  } catch (error) {
    console.error("Error loading products:", error);
    showErrorState(error);
  }
}

/**
 * Show loading state in all containers
 */
function showLoadingState() {
  const loadingHTML = `
    <div class="loading-skeleton" style="height: 300px; border-radius: var(--border-radius);"></div>
    <div class="loading-skeleton" style="height: 300px; border-radius: var(--border-radius);"></div>
    <div class="loading-skeleton" style="height: 300px; border-radius: var(--border-radius);"></div>
  `;

  const containers = [
    "allProducts",
    "activeProductsList",
    "soldProductsList",
    "inactiveProductsList",
  ];

  containers.forEach((containerId) => {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = loadingHTML;
    }
  });
}

/**
 * Show empty state when no products
 */
function showEmptyState() {
  const emptyStateHTML = `
    <div class="empty-state" style="grid-column: 1 / -1;">
      <i class="fas fa-box-open"></i>
      <h3>No Products Yet</h3>
      <p>You haven't added any products to sell.</p>
      <a href="add-item.html" class="btn btn-primary">
        <i class="fas fa-plus"></i> Add Your First Product
      </a>
    </div>
  `;

  const containers = [
    "allProducts",
    "activeProductsList",
    "soldProductsList",
    "inactiveProductsList",
  ];

  containers.forEach((containerId) => {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = emptyStateHTML;
    }
  });

  // Update stats to 0
  updateStats([]);
}

/**
 * Show error state
 */
function showErrorState(error) {
  const errorHTML = `
    <div class="empty-state" style="grid-column: 1 / -1;">
      <i class="fas fa-exclamation-circle"></i>
      <h3>Error loading products</h3>
      <p>Please try again later.</p>
      <p style="font-size: 0.875rem; margin-top: 0.5rem; color: var(--danger-color);">
        ${error.message || "API error"}
      </p>
      <button onclick="loadMyProducts()" class="btn btn-outline" style="margin-top: 1rem;">
        <i class="fas fa-redo"></i> Retry
      </button>
    </div>
  `;

  const containers = [
    "allProducts",
    "activeProductsList",
    "soldProductsList",
    "inactiveProductsList",
  ];

  containers.forEach((containerId) => {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = errorHTML;
    }
  });
}

/**
 * Update statistics
 */
function updateStats(products) {
  if (!products || !Array.isArray(products)) {
    console.error("Invalid products data:", products);
    products = [];
  }

  const totalProducts = products.length;
  const activeProducts = products.filter(
    (p) => p.is_active && !p.is_sold,
  ).length;
  const soldProducts = products.filter((p) => p.is_sold).length;
  const totalViews = products.reduce((sum, p) => sum + (p.views || 0), 0);

  console.log("Product stats:", {
    totalProducts,
    activeProducts,
    soldProducts,
    totalViews,
  });

  // Update stat elements
  const totalProductsEl = document.getElementById("totalProducts");
  const activeProductsEl = document.getElementById("activeProducts");
  const soldProductsEl = document.getElementById("soldProducts");
  const totalViewsEl = document.getElementById("totalViews");

  if (totalProductsEl) totalProductsEl.textContent = totalProducts;
  if (activeProductsEl) activeProductsEl.textContent = activeProducts;
  if (soldProductsEl) soldProductsEl.textContent = soldProducts;
  if (totalViewsEl) totalViewsEl.textContent = totalViews.toLocaleString();
}

/**
 * Render products in different tabs
 */
function renderProducts(products) {
  if (!products || !Array.isArray(products)) {
    console.error("Invalid products data for rendering:", products);
    products = [];
  }

  // Filter products
  const activeProducts = products.filter((p) => p.is_active && !p.is_sold);
  const soldProducts = products.filter((p) => p.is_sold);
  const inactiveProducts = products.filter((p) => !p.is_active && !p.is_sold);

  console.log("Filtered products:", {
    all: products.length,
    active: activeProducts.length,
    sold: soldProducts.length,
    inactive: inactiveProducts.length,
  });

  // Helper function to render empty state for specific tabs
  const renderTabEmptyState = (message, icon = "fas fa-box-open") => `
    <div class="empty-state" style="grid-column: 1 / -1;">
      <i class="${icon}"></i>
      <h3>${message}</h3>
      <a href="add-item.html" class="btn btn-primary">
        <i class="fas fa-plus"></i> Add New Product
      </a>
    </div>
  `;

  // Render all products
  const allProductsContainer = document.getElementById("allProducts");
  if (allProductsContainer) {
    if (products.length === 0) {
      allProductsContainer.innerHTML = renderTabEmptyState(
        "No Products Yet",
        "fas fa-box-open",
      );
    } else {
      allProductsContainer.innerHTML = products
        .map((product) => createProductCard(product))
        .join("");
    }
  }

  // Render active products
  const activeProductsList = document.getElementById("activeProductsList");
  if (activeProductsList) {
    if (activeProducts.length === 0) {
      activeProductsList.innerHTML = renderTabEmptyState(
        "No Active Products",
        "fas fa-check-circle",
      );
    } else {
      activeProductsList.innerHTML = activeProducts
        .map((product) => createProductCard(product))
        .join("");
    }
  }

  // Render sold products
  const soldProductsList = document.getElementById("soldProductsList");
  if (soldProductsList) {
    if (soldProducts.length === 0) {
      soldProductsList.innerHTML = renderTabEmptyState(
        "No Sold Products",
        "fas fa-tag",
      );
    } else {
      soldProductsList.innerHTML = soldProducts
        .map((product) => createProductCard(product))
        .join("");
    }
  }

  // Render inactive products
  const inactiveProductsList = document.getElementById("inactiveProductsList");
  if (inactiveProductsList) {
    if (inactiveProducts.length === 0) {
      inactiveProductsList.innerHTML = renderTabEmptyState(
        "No Inactive Products",
        "fas fa-eye-slash",
      );
    } else {
      inactiveProductsList.innerHTML = inactiveProducts
        .map((product) => createProductCard(product))
        .join("");
    }
  }

  // Add event listeners to action buttons
  setTimeout(() => {
    setupProductActions();
  }, 100);
}

/**
 * Create product card HTML
 */
function createProductCard(product) {
  if (!product) return "";

  // Format price - handle different price formats
  let price = "N/A";
  try {
    if (product.price) {
      if (typeof product.price === "string") {
        price = appUtils.formatCurrency(parseFloat(product.price));
      } else if (typeof product.price === "number") {
        price = appUtils.formatCurrency(product.price);
      } else {
        price = "₹" + product.price;
      }
    }
  } catch (error) {
    console.error("Error formatting price:", error);
    price = "N/A";
  }

  // Status badge
  let statusBadge = "";
  let statusText = "";
  if (product.is_sold) {
    statusBadge = "badge-success";
    statusText = "Sold";
  } else if (!product.is_active) {
    statusBadge = "badge-danger";
    statusText = "Inactive";
  } else {
    statusBadge = "badge-primary";
    statusText = "Active";
  }

  // Format date
  let formattedDate = "N/A";
  try {
    if (product.created_at) {
      const date = new Date(product.created_at);
      formattedDate = date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  } catch (error) {
    console.error("Error formatting date:", error);
  }

  // Get condition
  const conditionLabel = product.condition
    ? product.condition.replace("_", " ")
    : "Not specified";
  const conditionClass = product.condition
    ? `badge-${product.condition.toLowerCase()}`
    : "badge-secondary";

  // Get image URL
  let imageUrl = "https://via.placeholder.com/300x200?text=No+Image";
  if (product.main_image) {
    if (product.main_image.startsWith("http")) {
      imageUrl = product.main_image;
    } else if (product.main_image.startsWith("/media/")) {
      imageUrl = "http://127.0.0.1:8000" + product.main_image;
    } else {
      imageUrl = product.main_image;
    }
  }

  // Truncate description
  let description = product.description || "No description provided";
  if (description.length > 100) {
    description = description.substring(0, 100) + "...";
  }

  // Get category display name
  const category = product.category
    ? product.category.replace(/_/g, " ")
    : "Uncategorized";

  return `
    <div class="card product-card" data-product-id="${product.id}">
      <div class="card-image-container">
        <img src="${imageUrl}" 
             alt="${product.title || "Product"}" 
             class="card-img"
             onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
        <span class="badge ${statusBadge}" style="position: absolute; top: 10px; right: 10px; z-index: 1;">${statusText}</span>
      </div>
      <div class="card-content">
        <h3 class="card-title">${product.title || "Untitled Product"}</h3>
        <div class="card-meta">
          <span><i class="fas fa-tag"></i> ${category}</span>
          <span><i class="fas fa-map-marker-alt"></i> ${
            product.city || "Unknown"
          }</span>
          <span><i class="fas fa-eye"></i> ${product.views || 0}</span>
        </div>
        <div class="product-condition">
          <span class="badge ${conditionClass}">
            ${conditionLabel}
          </span>
        </div>
        <p class="product-description-short">
          ${description}
        </p>
        <div class="card-footer">
          <span class="price">${price}</span>
          <small>${formattedDate}</small>
        </div>
      </div>
      <div class="card-actions">
        <a href="product-detail.html?id=${
          product.id
        }" class="btn btn-sm btn-outline">
          <i class="fas fa-eye"></i> View
        </a>
        ${
          !product.is_sold && product.is_active
            ? `
            <button class="btn btn-sm btn-primary edit-product-btn">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-sm btn-danger delete-product-btn">
              <i class="fas fa-trash"></i> Delete
            </button>
            <button class="btn btn-sm btn-success mark-sold-btn">
              <i class="fas fa-check"></i> Sold
            </button>
          `
            : ""
        }
        ${
          product.is_sold
            ? `
            <button class="btn btn-sm btn-outline reactivate-product-btn">
              <i class="fas fa-redo"></i> Reactivate
            </button>
          `
            : ""
        }
        ${
          !product.is_active && !product.is_sold
            ? `
            <button class="btn btn-sm btn-outline activate-product-btn">
              <i class="fas fa-toggle-on"></i> Activate
            </button>
          `
            : ""
        }
      </div>
    </div>
  `;
}

/**
 * Setup product action buttons
 */
function setupProductActions() {
  console.log("Setting up product actions...");

  // Edit buttons
  document.querySelectorAll(".edit-product-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const productId = this.closest(".product-card").dataset.productId;
      window.location.href = `add-item.html?edit=${productId}`;
    });
  });

  // Delete buttons
  document.querySelectorAll(".delete-product-btn").forEach((btn) => {
    btn.addEventListener("click", async function () {
      const card = this.closest(".product-card");
      const productId = card.dataset.productId;
      const productTitle = card.querySelector(".card-title").textContent;

      if (confirm(`Are you sure you want to delete "${productTitle}"?`)) {
        try {
          await api.deleteProduct(productId);
          appUtils.showNotification("Product deleted successfully", "success");
          // Reload products
          await loadMyProducts();
        } catch (error) {
          console.error("Delete error:", error);
          appUtils.showNotification(
            "Failed to delete product: " + error.message,
            "error",
          );
        }
      }
    });
  });

  // Mark as sold buttons
  document.querySelectorAll(".mark-sold-btn").forEach((btn) => {
    btn.addEventListener("click", async function () {
      const card = this.closest(".product-card");
      const productId = card.dataset.productId;
      const productTitle = card.querySelector(".card-title").textContent;

      if (confirm(`Mark "${productTitle}" as sold?`)) {
        try {
          // Find the product data from our stored array
          const productData = currentProductsData.find(
            (p) => p.id == productId,
          );

          if (!productData) {
            throw new Error("Product data not found");
          }

          // Create FormData with ALL required fields
          const formData = new FormData();

          // Add all required fields from current product data
          formData.append("title", productData.title || "");
          formData.append("description", productData.description || "");
          formData.append("category", productData.category || "");
          formData.append("condition", productData.condition || "");
          formData.append("price", productData.price || "");
          formData.append("address", productData.address || "");
          formData.append("city", productData.city || "");

          // Add optional fields if they exist
          if (productData.contact_phone) {
            formData.append("contact_phone", productData.contact_phone);
          }
          if (productData.contact_whatsapp) {
            formData.append("contact_whatsapp", productData.contact_whatsapp);
          }
          if (productData.contact_email) {
            formData.append("contact_email", productData.contact_email);
          }

          // Add the fields we want to update
          formData.append("is_sold", "true");
          formData.append("is_active", "false");

          await api.updateProduct(productId, formData);
          appUtils.showNotification("Product marked as sold", "success");
          // Reload products
          await loadMyProducts();
        } catch (error) {
          console.error("Mark sold error:", error);
          appUtils.showNotification(
            "Failed to update product: " + error.message,
            "error",
          );
        }
      }
    });
  });

  // Reactivate buttons
  document.querySelectorAll(".reactivate-product-btn").forEach((btn) => {
    btn.addEventListener("click", async function () {
      const card = this.closest(".product-card");
      const productId = card.dataset.productId;
      const productTitle = card.querySelector(".card-title").textContent;

      if (confirm(`Reactivate "${productTitle}"?`)) {
        try {
          // Find the product data from our stored array
          const productData = currentProductsData.find(
            (p) => p.id == productId,
          );

          if (!productData) {
            throw new Error("Product data not found");
          }

          // Create FormData with ALL required fields
          const formData = new FormData();

          // Add all required fields from current product data
          formData.append("title", productData.title || "");
          formData.append("description", productData.description || "");
          formData.append("category", productData.category || "");
          formData.append("condition", productData.condition || "");
          formData.append("price", productData.price || "");
          formData.append("address", productData.address || "");
          formData.append("city", productData.city || "");

          // Add optional fields if they exist
          if (productData.contact_phone) {
            formData.append("contact_phone", productData.contact_phone);
          }
          if (productData.contact_whatsapp) {
            formData.append("contact_whatsapp", productData.contact_whatsapp);
          }
          if (productData.contact_email) {
            formData.append("contact_email", productData.contact_email);
          }

          // Add the fields we want to update
          formData.append("is_sold", "false");
          formData.append("is_active", "true");

          await api.updateProduct(productId, formData);
          appUtils.showNotification("Product reactivated", "success");
          // Reload products
          await loadMyProducts();
        } catch (error) {
          console.error("Reactivate error:", error);
          appUtils.showNotification(
            "Failed to reactivate product: " + error.message,
            "error",
          );
        }
      }
    });
  });

  // Activate buttons (for inactive products)
  document.querySelectorAll(".activate-product-btn").forEach((btn) => {
    btn.addEventListener("click", async function () {
      const card = this.closest(".product-card");
      const productId = card.dataset.productId;
      const productTitle = card.querySelector(".card-title").textContent;

      if (confirm(`Activate "${productTitle}"?`)) {
        try {
          // Find the product data from our stored array
          const productData = currentProductsData.find(
            (p) => p.id == productId,
          );

          if (!productData) {
            throw new Error("Product data not found");
          }

          // Create FormData with ALL required fields
          const formData = new FormData();

          // Add all required fields from current product data
          formData.append("title", productData.title || "");
          formData.append("description", productData.description || "");
          formData.append("category", productData.category || "");
          formData.append("condition", productData.condition || "");
          formData.append("price", productData.price || "");
          formData.append("address", productData.address || "");
          formData.append("city", productData.city || "");

          // Add optional fields if they exist
          if (productData.contact_phone) {
            formData.append("contact_phone", productData.contact_phone);
          }
          if (productData.contact_whatsapp) {
            formData.append("contact_whatsapp", productData.contact_whatsapp);
          }
          if (productData.contact_email) {
            formData.append("contact_email", productData.contact_email);
          }

          // Add the field we want to update
          formData.append("is_active", "true");

          await api.updateProduct(productId, formData);
          appUtils.showNotification("Product activated", "success");
          // Reload products
          await loadMyProducts();
        } catch (error) {
          console.error("Activate error:", error);
          appUtils.showNotification(
            "Failed to activate product: " + error.message,
            "error",
          );
        }
      }
    });
  });
}

/**
 * Setup tab functionality
 */
function setupTabs() {
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Remove active class from all buttons and contents
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));

      // Add active class to clicked button
      button.classList.add("active");

      // Show corresponding content
      const tabId = button.getAttribute("data-tab");
      const tabContent = document.getElementById(`tab-${tabId}`);
      if (tabContent) {
        tabContent.classList.add("active");
      }
    });
  });
}

/**
 * Setup theme toggle
 */
function setupThemeToggle() {
  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const currentTheme = document.documentElement.getAttribute("data-theme");
      const newTheme = currentTheme === "dark" ? "light" : "dark";

      document.documentElement.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);

      const icon = themeToggle.querySelector("i");
      if (icon) {
        icon.className = newTheme === "dark" ? "fas fa-sun" : "fas fa-moon";
      }
    });
  }
}

/**
 * Setup logout button
 */
function setupLogoutButton() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        await api.logout();
        window.location.href = "index.html";
      } catch (error) {
        console.error("Logout error:", error);
        window.location.href = "index.html";
      }
    });
  }
}

/**
 * Setup sidebar
 */
function setupSidebar() {
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const sidebar = document.getElementById("sidebar");
  const closeSidebar = document.getElementById("closeSidebar");

  if (mobileMenuBtn && sidebar) {
    mobileMenuBtn.addEventListener("click", () => {
      sidebar.classList.add("active");
    });
  }

  if (closeSidebar && sidebar) {
    closeSidebar.addEventListener("click", () => {
      sidebar.classList.remove("active");
    });
  }

  // Close sidebar when clicking outside
  document.addEventListener("click", (e) => {
    if (
      sidebar &&
      sidebar.classList.contains("active") &&
      !sidebar.contains(e.target) &&
      e.target !== mobileMenuBtn
    ) {
      sidebar.classList.remove("active");
    }
  });
}

// Make loadMyProducts available globally for retry button
window.loadMyProducts = loadMyProducts;
