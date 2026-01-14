/**
 * My Products page functionality
 */

document.addEventListener("DOMContentLoaded", async function () {
  // Check authentication
  if (!api.isAuthenticated()) {
    window.location.href = "index.html";
    return;
  }

  // Load products
  await loadMyProducts();

  // Setup tabs
  setupTabs();
});

/**
 * Load user's products
 */
async function loadMyProducts() {
  try {
    const products = await api.getMyProducts();

    // Update stats
    updateStats(products);

    // Render products
    renderProducts(products);
  } catch (error) {
    console.error("Error loading products:", error);

    const allProductsContainer = document.getElementById("allProducts");
    if (allProductsContainer) {
      allProductsContainer.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>Error loading products</h3>
                    <p>Please try again later.</p>
                </div>
            `;
    }
  }
}

/**
 * Update statistics
 */
function updateStats(products) {
  const totalProducts = products.length;
  const activeProducts = products.filter(
    (p) => p.is_active && !p.is_sold
  ).length;
  const soldProducts = products.filter((p) => p.is_sold).length;
  const totalViews = products.reduce((sum, p) => sum + (p.views || 0), 0);

  // Update stat elements
  document.getElementById("totalProducts").textContent = totalProducts;
  document.getElementById("activeProducts").textContent = activeProducts;
  document.getElementById("soldProducts").textContent = soldProducts;
  document.getElementById("totalViews").textContent =
    totalViews.toLocaleString();
}

/**
 * Render products in different tabs
 */
function renderProducts(products) {
  const allProducts = document.getElementById("allProducts");
  const activeProductsList = document.getElementById("activeProductsList");
  const soldProductsList = document.getElementById("soldProductsList");
  const inactiveProductsList = document.getElementById("inactiveProductsList");

  // Filter products
  const activeProducts = products.filter((p) => p.is_active && !p.is_sold);
  const soldProducts = products.filter((p) => p.is_sold);
  const inactiveProducts = products.filter((p) => !p.is_active);

  // Render all products
  if (allProducts) {
    if (products.length === 0) {
      allProducts.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <i class="fas fa-box-open"></i>
                    <h3>No Products Yet</h3>
                    <p>You haven't listed any products for sale.</p>
                    <a href="add-item.html" class="btn btn-primary">
                        <i class="fas fa-plus"></i> List Your First Item
                    </a>
                </div>
            `;
    } else {
      allProducts.innerHTML = products
        .map((product) => createProductCard(product))
        .join("");
    }
  }

  // Render active products
  if (activeProductsList) {
    if (activeProducts.length === 0) {
      activeProductsList.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <i class="fas fa-check-circle"></i>
                    <p>No active products</p>
                </div>
            `;
    } else {
      activeProductsList.innerHTML = activeProducts
        .map((product) => createProductCard(product))
        .join("");
    }
  }

  // Render sold products
  if (soldProductsList) {
    if (soldProducts.length === 0) {
      soldProductsList.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <i class="fas fa-tag"></i>
                    <p>No sold products</p>
                </div>
            `;
    } else {
      soldProductsList.innerHTML = soldProducts
        .map((product) => createProductCard(product))
        .join("");
    }
  }

  // Render inactive products
  if (inactiveProductsList) {
    if (inactiveProducts.length === 0) {
      inactiveProductsList.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <i class="fas fa-eye-slash"></i>
                    <p>No inactive products</p>
                </div>
            `;
    } else {
      inactiveProductsList.innerHTML = inactiveProducts
        .map((product) => createProductCard(product))
        .join("");
    }
  }

  // Add event listeners to action buttons
  setupProductActions();
}

/**
 * Create product card HTML
 */
function createProductCard(product) {
  // Format price
  const price = parseFloat(product.price).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

  // Status badge
  let statusBadge = "";
  if (product.is_sold) {
    statusBadge = '<span class="badge badge-success">Sold</span>';
  } else if (!product.is_active) {
    statusBadge = '<span class="badge badge-danger">Inactive</span>';
  } else {
    statusBadge = '<span class="badge badge-primary">Active</span>';
  }

  // Format date
  const date = new Date(product.created_at);
  const formattedDate = date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });

  return `
        <div class="card" data-product-id="${product.id}">
            <img src="${
              product.main_image ||
              "https://via.placeholder.com/300x200?text=No+Image"
            }" 
                 alt="${product.title}" class="card-img">
            ${statusBadge}
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
                    <span><i class="fas fa-eye"></i> ${
                      product.views || 0
                    }</span>
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
            </div>
        </div>
    `;
}

/**
 * Setup product action buttons
 */
function setupProductActions() {
  // Edit buttons
  document.querySelectorAll(".edit-product-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const productId = this.closest(".card").dataset.productId;
      window.location.href = `add-item.html?edit=${productId}`;
    });
  });

  // Delete buttons
  document.querySelectorAll(".delete-product-btn").forEach((btn) => {
    btn.addEventListener("click", async function () {
      const card = this.closest(".card");
      const productId = card.dataset.productId;

      if (confirm("Are you sure you want to delete this product?")) {
        try {
          await api.deleteProduct(productId);
          appUtils.showNotification("Product deleted successfully", "success");
          // Reload products
          await loadMyProducts();
        } catch (error) {
          appUtils.showNotification("Failed to delete product", "error");
        }
      }
    });
  });

  // Mark as sold buttons
  document.querySelectorAll(".mark-sold-btn").forEach((btn) => {
    btn.addEventListener("click", async function () {
      const card = this.closest(".card");
      const productId = card.dataset.productId;

      if (confirm("Mark this product as sold?")) {
        try {
          await api.updateProduct(productId, { is_sold: true });
          appUtils.showNotification("Product marked as sold", "success");
          // Reload products
          await loadMyProducts();
        } catch (error) {
          appUtils.showNotification("Failed to update product", "error");
        }
      }
    });
  });

  // Reactivate buttons
  document.querySelectorAll(".reactivate-product-btn").forEach((btn) => {
    btn.addEventListener("click", async function () {
      const card = this.closest(".card");
      const productId = card.dataset.productId;

      if (confirm("Reactivate this product?")) {
        try {
          await api.updateProduct(productId, { is_sold: false });
          appUtils.showNotification("Product reactivated", "success");
          // Reload products
          await loadMyProducts();
        } catch (error) {
          appUtils.showNotification("Failed to reactivate product", "error");
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
      document.getElementById(`tab-${tabId}`).classList.add("active");
    });
  });
}
