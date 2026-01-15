/**
 * Main JavaScript - Core application functionality
 * Handles JWT authentication, theme, mobile menu, and global UI
 * Now includes marketplace utility functions
 */

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", async function () {
  // Check authentication status
  // await checkAuth();

  // Initialize UI components
  initThemeToggle();
  initMobileMenu();
  initLogout();
  setActiveNavItem();

  // Update UI based on user role
  updateUIForUserRole();

  // Initialize any tabs on the page
  initTabs();
});

/**
 * Check authentication status
 * Redirect to login if not authenticated (except on auth pages)
 */
// async function checkAuth() {
//   const isAuthPage =
//     window.location.pathname.includes("index.html") ||
//     window.location.pathname.includes("signup.html");

//   // Skip auth check for auth pages
//   if (isAuthPage) {
//     return;
//   }

//   // Check if we have a token
//   // if (!api.isAuthenticated()) {
//   //   window.location.href = "index.html";
//   //   return;
//   // }

//   // Verify token is still valid
//   const isValid = await api.verifyToken();
//   if (!isValid) {
//     // Token invalid, clear and redirect
//     api.clearTokens();
//     window.location.href = "index.html";
//     return;
//   }

//   // Update user info in UI
//   await updateUserInfo();
// }

/**
 * Update user information in the UI
 */
async function updateUserInfo() {
  try {
    const user = await api.getCurrentUser();
    if (user) {
      const userName = user.name || user.email || "User";
      localStorage.setItem("userName", userName);
      localStorage.setItem("userIsProvider", user.is_provider || false);

      // Update all elements with id "userName"
      document.querySelectorAll("#userName").forEach((el) => {
        el.textContent = userName;
      });
    }
  } catch (error) {
    console.error("Failed to update user info:", error);
  }
}

/**
 * Theme toggle functionality
 */
function initThemeToggle() {
  const themeToggle = document.getElementById("themeToggle");
  const savedTheme = localStorage.getItem("theme") || "light";

  // Set initial theme
  document.documentElement.setAttribute("data-theme", savedTheme);

  if (themeToggle) {
    // Update icon based on current theme
    updateThemeIcon(savedTheme);

    themeToggle.addEventListener("click", () => {
      const currentTheme = document.documentElement.getAttribute("data-theme");
      const newTheme = currentTheme === "light" ? "dark" : "light";

      // Update theme
      document.documentElement.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);

      // Update icon
      updateThemeIcon(newTheme);
    });
  }
}

function updateThemeIcon(theme) {
  const themeToggle = document.getElementById("themeToggle");
  if (!themeToggle) return;

  if (theme === "dark") {
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    themeToggle.title = "Switch to light theme";
  } else {
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    themeToggle.title = "Switch to dark theme";
  }
}

/**
 * Mobile menu functionality
 */
function initMobileMenu() {
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const sidebar = document.getElementById("sidebar");
  const closeSidebarBtn = document.getElementById("closeSidebar");

  if (mobileMenuBtn && sidebar) {
    mobileMenuBtn.addEventListener("click", () => {
      sidebar.classList.add("active");
      mobileMenuBtn.style.display = "none";
    });
  }

  if (closeSidebarBtn) {
    closeSidebarBtn.addEventListener("click", () => {
      sidebar.classList.remove("active");
      if (mobileMenuBtn) mobileMenuBtn.style.display = "block";
    });
  }

  // Close sidebar when clicking outside on mobile
  document.addEventListener("click", (e) => {
    if (
      window.innerWidth <= 1024 &&
      sidebar &&
      sidebar.classList.contains("active")
    ) {
      if (!sidebar.contains(e.target) && e.target !== mobileMenuBtn) {
        sidebar.classList.remove("active");
        if (mobileMenuBtn) mobileMenuBtn.style.display = "block";
      }
    }
  });
}

/**
 * Logout functionality
 */
function initLogout() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      try {
        await api.logout();
        showNotification("Logged out successfully", "success");

        // Redirect to login page
        setTimeout(() => {
          window.location.href = "index.html";
        }, 1000);
      } catch (error) {
        console.error("Logout error:", error);
        showNotification("Logout failed", "error");
      }
    });
  }
}

/**
 * Update UI based on user role (provider/client)
 */
function updateUIForUserRole() {
  const isProvider = localStorage.getItem("userIsProvider") === "true";

  // Show/hide provider-only elements
  const providerElements = document.querySelectorAll(".provider-only");
  providerElements.forEach((el) => {
    if (isProvider) {
      el.style.display = "block";
      el.classList.remove("disabled");
    } else {
      el.style.display = "none";
      el.classList.add("disabled");
    }
  });

  // Update provider badge in profile
  const providerBadge = document.getElementById("providerBadge");
  if (providerBadge) {
    providerBadge.style.display = isProvider ? "inline-flex" : "none";
  }
}

/**
 * Initialize tab functionality
 */
function initTabs() {
  const tabContainers = document.querySelectorAll(".tabs-container");
  tabContainers.forEach((container) => {
    const tabButtons = container.querySelectorAll(".tab-btn");
    const tabContents = container.querySelectorAll(".tab-content");

    tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        // Remove active class from all buttons and contents
        tabButtons.forEach((btn) => btn.classList.remove("active"));
        tabContents.forEach((content) => content.classList.remove("active"));

        // Add active class to clicked button
        button.classList.add("active");

        // Show corresponding content
        const tabId = button.getAttribute("data-tab");
        const tabContent = document.getElementById(tabId);
        if (tabContent) {
          tabContent.classList.add("active");
        }
      });
    });
  });
}

/**
 * Set active navigation item based on current page
 */
function setActiveNavItem() {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  // Update sidebar links
  const sidebarLinks = document.querySelectorAll(".sidebar-nav a");
  sidebarLinks.forEach((link) => {
    const linkPage = link.getAttribute("href");
    if (linkPage === currentPage) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  // Update bottom navigation
  const bottomNavLinks = document.querySelectorAll(".bottom-nav a");
  bottomNavLinks.forEach((link) => {
    const linkPage = link.getAttribute("href");
    if (linkPage === currentPage) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

/**
 * Show notification to user
 */
function showNotification(message, type = "info") {
  // Remove existing notifications
  const existing = document.querySelectorAll(".notification");
  existing.forEach((n) => n.remove());

  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${
              type === "success"
                ? "fa-check-circle"
                : type === "error"
                ? "fa-exclamation-circle"
                : type === "warning"
                ? "fa-exclamation-triangle"
                : "fa-info-circle"
            }"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close"><i class="fas fa-times"></i></button>
    `;

  // Add styles if not already present
  if (!document.querySelector("#notification-styles")) {
    const style = document.createElement("style");
    style.id = "notification-styles";
    style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background-color: var(--card-bg);
                color: var(--text-color);
                border-radius: var(--border-radius-sm);
                padding: 1rem 1.5rem;
                box-shadow: var(--shadow);
                border-left: 4px solid var(--primary-color);
                display: flex;
                align-items: center;
                justify-content: space-between;
                min-width: 300px;
                max-width: 400px;
                z-index: 1000;
                animation: slideIn 0.3s ease;
            }
            .notification-success { border-left-color: var(--success-color); }
            .notification-error { border-left-color: var(--danger-color); }
            .notification-warning { border-left-color: var(--warning-color); }
            .notification-content { display: flex; align-items: center; gap: 0.75rem; flex: 1; }
            .notification-close { background: none; border: none; color: var(--text-secondary); cursor: pointer; }
            @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
        `;
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);

  // Auto remove after 5 seconds
  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease";
    notification.addEventListener("animationend", () => notification.remove());
  }, 5000);

  // Close button
  notification
    .querySelector(".notification-close")
    .addEventListener("click", () => {
      notification.style.animation = "slideOut 0.3s ease";
      notification.addEventListener("animationend", () =>
        notification.remove()
      );
    });
}

/**
 * Format date for display
 */
function formatDate(dateString) {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    return dateString;
  }
}

/**
 * Format currency for display (services)
 */
function formatCurrency(amount) {
  if (typeof amount === "string" && amount.startsWith("$")) {
    return amount;
  }

  const num = parseFloat(amount);
  if (isNaN(num)) return "$0.00";

  return `$${num.toFixed(2)}`;
}

/**
 * Format currency for marketplace (INR)
 */
function formatMarketplaceCurrency(amount) {
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
}

/**
 * Get condition label for marketplace products
 */
function getConditionLabel(condition) {
  const conditions = {
    NEW: "Brand New",
    LIKE_NEW: "Like New",
    GOOD: "Good",
    FAIR: "Fair",
    POOR: "Poor",
  };
  return conditions[condition] || condition;
}

/**
 * Get condition CSS class for marketplace products
 */
function getConditionClass(condition) {
  const classes = {
    NEW: "badge-success",
    LIKE_NEW: "badge-info",
    GOOD: "badge-primary",
    FAIR: "badge-warning",
    POOR: "badge-secondary",
  };
  return classes[condition] || "badge-secondary";
}

/**
 * Create product card element for marketplace
 */
function createProductCard(product) {
  const productCard = document.createElement("div");
  productCard.className = "card product-card";

  // Format price
  const price = formatMarketplaceCurrency(product.price);

  // Get condition
  const conditionLabel = getConditionLabel(product.condition);
  const conditionClass = getConditionClass(product.condition);

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
        <span><i class="fas fa-tag"></i> ${
          product.category ? product.category.replace("_", " ") : "N/A"
        }</span>
        <span><i class="fas fa-map-marker-alt"></i> ${
          product.city || "N/A"
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
        <a href="product-detail.html?id=${
          product.id
        }" class="btn btn-primary btn-sm">
          View Details
        </a>
      </div>
    </div>
  `;

  return productCard;
}

/**
 * Show loading skeletons
 */
function showLoadingSkeletons(container, count = 3, type = "product") {
  let skeletons = "";
  const height = type === "product" ? "300px" : "200px";

  for (let i = 0; i < count; i++) {
    skeletons += `
      <div class="loading-skeleton" style="height: ${height}; border-radius: var(--border-radius);"></div>
    `;
  }

  container.innerHTML = skeletons;
}

/**
 * Show empty state
 */
function showEmptyState(
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
}

/**
 * Show error state
 */
function showErrorState(container, error) {
  container.innerHTML = `
    <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem;">
      <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: var(--danger-color); margin-bottom: 1rem;"></i>
      <h3 style="margin-bottom: 0.5rem;">Error loading content</h3>
      <p style="color: var(--text-muted);">${
        error.message || "Please try again later"
      }</p>
    </div>
  `;
}

/**
 * Debounce function for search/filter inputs
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Check authentication
 */
function checkAuth() {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    window.location.href = "index.html";
    return false;
  }
  return true;
}

/**
 * Update user name in UI
 */
function updateUserName() {
  const userName = localStorage.getItem("userName") || "User";
  document.querySelectorAll("#userName").forEach((el) => {
    el.textContent = userName;
  });
}

/**
 * Get default image for services
 */
function getDefaultImage(categories) {
  if (!categories) return "https://via.placeholder.com/300x200?text=Service";

  const category = categories.toLowerCase();
  if (category.includes("cleaning")) {
    return "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop";
  } else if (category.includes("plumbing")) {
    return "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop";
  } else if (category.includes("repair")) {
    return "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=300&fit=crop";
  }
  return "https://via.placeholder.com/300x200?text=Service";
}

/**
 * Validate form
 */
function validateForm(form) {
  const required = form.querySelectorAll("[required]");
  let isValid = true;

  required.forEach((field) => {
    if (!field.value.trim()) {
      isValid = false;
      field.classList.add("error");
    } else {
      field.classList.remove("error");
    }
  });

  return isValid;
}

/**
 * Export utility functions
 */
window.appUtils = {
  // Core functions
  showNotification,
  formatDate,
  formatCurrency, // For services ($)
  updateUIForUserRole,

  // Service functions
  getDefaultImage,
  validateForm,

  // Marketplace functions
  getConditionLabel,
  getConditionClass,
  createProductCard,
  showLoadingSkeletons,
  showEmptyState,
  showErrorState,
  debounce,
  checkAuth,
  updateUserName,
  formatMarketplaceCurrency, // For marketplace (₹)

  // Alias for backward compatibility
  formatCurrencyINR: function (amount) {
    return this.formatMarketplaceCurrency(amount);
  },
};
