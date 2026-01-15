/**
 * Utility functions for the marketplace
 */

const appUtils = {
  /**
   * Format currency (INR)
   */
  formatCurrency: function (amount) {
    if (amount === null || amount === undefined) return "₹ 0";
    const num = parseFloat(amount);
    if (isNaN(num)) return "₹ 0";
    return (
      "₹ " +
      num.toLocaleString("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })
    );
  },

  /**
   * Get condition label
   */
  getConditionLabel: function (condition) {
    const conditions = {
      NEW: "Brand New",
      LIKE_NEW: "Like New",
      GOOD: "Good",
      FAIR: "Fair",
      POOR: "Poor",
    };
    return conditions[condition] || condition;
  },

  /**
   * Get condition CSS class
   */
  getConditionClass: function (condition) {
    const classes = {
      NEW: "badge-success",
      LIKE_NEW: "badge-info",
      GOOD: "badge-primary",
      FAIR: "badge-warning",
      POOR: "badge-secondary",
    };
    return classes[condition] || "badge-secondary";
  },

  /**
   * Format date
   */
  formatDate: function (dateString) {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch (error) {
      return dateString;
    }
  },

  /**
   * Show loading skeleton
   */
  showLoadingSkeletons: function (container, count = 3, type = "product") {
    let skeletons = "";
    const height = type === "product" ? "300px" : "200px";

    for (let i = 0; i < count; i++) {
      skeletons += `
                <div class="loading-skeleton" style="height: ${height}; border-radius: var(--border-radius);"></div>
            `;
    }

    container.innerHTML = skeletons;
  },

  /**
   * Debounce function for search/filter inputs
   */
  debounce: function (func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Create product card element
   */
  createProductCard: function (product) {
    const productCard = document.createElement("div");
    productCard.className = "card product-card";

    // Format price
    const price = this.formatCurrency(product.price);

    // Get condition
    const conditionLabel = this.getConditionLabel(product.condition);
    const conditionClass = this.getConditionClass(product.condition);

    // Truncate description
    const description = product.description
      ? product.description.length > 100
        ? product.description.substring(0, 100) + "..."
        : product.description
      : "No description";

    productCard.innerHTML = `
            <div class="card-image-container">
                <img src="${
                  product.main_image ||
                  "https://via.placeholder.com/300x200?text=No+Image"
                }" 
                     alt="${product.title}" class="card-img" 
                     onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
                ${product.is_sold ? '<div class="sold-badge">SOLD</div>' : ""}
            </div>
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
                    <a href="product-detail.html?id=${
                      product.id
                    }" class="btn btn-primary btn-sm">
                        View Details
                    </a>
                </div>
            </div>
        `;

    return productCard;
  },

  /**
   * Show empty state
   */
  showEmptyState: function (
    container,
    message = "No items found",
    icon = "fas fa-search"
  ) {
    container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem;">
                <i class="${icon}" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                <h3 style="margin-bottom: 0.5rem;">${message}</h3>
                <p style="color: var(--text-muted);">Try adjusting your search or filters</p>
            </div>
        `;
  },

  /**
   * Show error state
   */
  showErrorState: function (container, error) {
    container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem;">
                <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: var(--danger-color); margin-bottom: 1rem;"></i>
                <h3 style="margin-bottom: 0.5rem;">Error loading content</h3>
                <p style="color: var(--text-muted);">${
                  error.message || "Please try again later"
                }</p>
            </div>
        `;
  },

  /**
   * Check authentication
   */
  checkAuth: function () {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      window.location.href = "index.html";
      return false;
    }
    return true;
  },

  /**
   * Update user name in UI
   */
  updateUserName: function () {
    const userName = localStorage.getItem("userName") || "User";
    document.querySelectorAll("#userName").forEach((el) => {
      el.textContent = userName;
    });
  },
};

// Make it globally available
window.appUtils = appUtils;
