/**
 * Activity page functionality
 * Requires authentication to access
 */

// Cache and state management
let activityData = {
  serviceTaken: [],
  serviceProvided: [],
  boughtItems: [],
  soldItems: [],
};
let isDataLoaded = false;
let isLoading = false;

document.addEventListener("DOMContentLoaded", async function () {
  console.log("DOM loaded - checking authentication");

  // Check authentication
  if (!api.isAuthenticated()) {
    console.log("Not authenticated, redirecting to login");
    window.location.href = "index.html";
    return;
  }

  console.log("User is authenticated, initializing activity page");

  // Initialize activity page
  await initActivityPage();
});

/**
 * Initialize activity page
 */
async function initActivityPage() {
  console.log("initActivityPage called");

  // Setup tabs
  setupTabs();

  // Setup search and filters
  setupActivityFilters();

  // Load data for initial tab
  const initialTab =
    document.querySelector(".tab-btn.active")?.dataset.tab || "serviceTaken";
  console.log("Loading data for initial tab:", initialTab);
  await loadTabData(initialTab);
}

/**
 * Setup tab switching
 */
function setupTabs() {
  console.log("Setting up tabs");

  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      console.log("Tab clicked:", button.dataset.tab);

      // Remove active class
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));

      // Add active to clicked
      button.classList.add("active");
      const tabId = button.dataset.tab;
      const tabContent = document.getElementById(tabId);

      if (tabContent) {
        tabContent.classList.add("active");
        // Load data for this tab
        await loadTabData(tabId);
      }
    });
  });
}

/**
 * Load data for specific tab
 */
async function loadTabData(tabId) {
  console.log(`loadTabData called for tab: ${tabId}`);

  const container = document.getElementById(`${tabId}Container`);
  if (!container) {
    console.error(`Container not found: ${tabId}Container`);
    return;
  }

  // Show loading
  container.innerHTML = `
    <div class="loading-skeleton" style="height: 100px;"></div>
    <div class="loading-skeleton" style="height: 100px;"></div>
    <div class="loading-skeleton" style="height: 100px;"></div>
  `;

  try {
    // Check if we need to fetch data for this tab
    const shouldFetchData =
      !isDataLoaded ||
      (tabId === "serviceTaken" && activityData.serviceTaken.length === 0) ||
      (tabId === "serviceProvided" &&
        activityData.serviceProvided.length === 0);

    if (shouldFetchData && !isLoading) {
      console.log(`Fetching data for ${tabId}...`);
      await fetchActivityData();
    }

    // Get data for this tab
    let data = [];
    switch (tabId) {
      case "serviceTaken":
        data = activityData.serviceTaken || [];
        console.log(`serviceTaken data length: ${data.length}`);
        break;
      case "serviceProvided":
        const isProvider = localStorage.getItem("userIsProvider") === "true";
        console.log(
          `Checking if provider for serviceProvided tab: ${isProvider}`,
        );
        if (!isProvider) {
          container.innerHTML = `
            <div class="empty-activity">
              <i class="fas fa-user-tie"></i>
              <h3>Provider Access Required</h3>
              <p>Only service providers can view services provided.</p>
              <button class="btn btn-primary mt-2" onclick="becomeProvider()">Become a Provider</button>
            </div>`;
          return;
        }
        data = activityData.serviceProvided || [];
        console.log(`serviceProvided data length: ${data.length}`);
        break;
      case "boughtItems":
        data = activityData.boughtItems || [];
        break;
      case "soldItems":
        data = activityData.soldItems || [];
        break;
    }

    // Apply any active filters
    data = applyFilters(tabId, data);

    // Render data
    console.log(`Rendering ${data.length} items for ${tabId}`);
    renderActivityItems(tabId, data, container);
  } catch (error) {
    console.error(`Error loading ${tabId} data:`, error);
    container.innerHTML = `
      <div class="empty-activity">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Error Loading Data</h3>
        <p>${error.message || "Please try again later"}</p>
        <button class="btn btn-primary mt-2" onclick="loadTabData('${tabId}')">Retry</button>
      </div>`;
  }
}

/**
 * Fetch activity data from API
 */
async function fetchActivityData() {
  if (isLoading) {
    console.log("Already loading data, skipping...");
    return;
  }

  isLoading = true;
  try {
    console.log("fetchActivityData: Starting to load data...");

    const isProvider = localStorage.getItem("userIsProvider") === "true";
    console.log("Is provider:", isProvider);

    // Fetch user bookings (services taken)
    console.log("Fetching user bookings (services taken)...");
    const userBookings = await api.apiRequest("bookings/?type=user", "GET");
    console.log("User bookings (service taken):", userBookings);

    let providerBookings = [];

    // Only fetch provider bookings if user is a provider
    if (isProvider) {
      console.log("Fetching provider bookings (services provided)...");
      providerBookings = await api.apiRequest("bookings/?type=provider", "GET");
      console.log("Provider bookings (service provided):", providerBookings);
    }

    // Process user bookings (services taken)
    const serviceTaken = [];
    if (userBookings && Array.isArray(userBookings)) {
      userBookings.forEach((booking) => {
        const activityItem = {
          id: booking.id,
          name: booking.description,
          description: booking.description,
          provider:
            booking.provider_name || `Provider ${booking.service_provider}`,
          client: booking.user_name || `User ${booking.user}`,
          address: booking.address,
          date: booking.scheduled_date || booking.created_at,
          quoted_price: booking.quote_price,
          final_price: booking.final_price,
          price: booking.final_price || booking.quote_price || "0.00",
          status: booking.status,
          provider_notes: booking.provider_notes,
          user_notes: booking.user_notes,
          created_at: booking.created_at,
          updated_at: booking.updated_at,
          quoted_at: booking.quoted_at,
          accepted_at: booking.accepted_at,
          started_at: booking.started_at,
          completed_at: booking.completed_at,
          user_id: booking.user,
          provider_id: booking.service_provider,
          price_distribution_note: booking.price_distribution_note || "",
        };
        serviceTaken.push(activityItem);
      });
    }

    // Process provider bookings (services provided)
    const serviceProvided = [];
    if (providerBookings && Array.isArray(providerBookings)) {
      providerBookings.forEach((booking) => {
        const activityItem = {
          id: booking.id,
          name: booking.description,
          description: booking.description,
          provider:
            booking.provider_name || `Provider ${booking.service_provider}`,
          client: booking.user_name || `User ${booking.user}`,
          address: booking.address,
          date: booking.scheduled_date || booking.created_at,
          quoted_price: booking.quote_price,
          final_price: booking.final_price,
          price: booking.final_price || booking.quote_price || "0.00",
          status: booking.status,
          provider_notes: booking.provider_notes,
          user_notes: booking.user_notes,
          created_at: booking.created_at,
          updated_at: booking.updated_at,
          quoted_at: booking.quoted_at,
          accepted_at: booking.accepted_at,
          started_at: booking.started_at,
          completed_at: booking.completed_at,
          user_id: booking.user,
          provider_id: booking.service_provider,
          price_distribution_note: booking.price_distribution_note || "",
        };
        serviceProvided.push(activityItem);
      });
    }

    // Update cache
    activityData = {
      serviceTaken,
      serviceProvided,
      boughtItems: [],
      soldItems: [],
    };

    isDataLoaded = true;

    console.log("Data fetched successfully:");
    console.log(`- serviceTaken: ${serviceTaken.length} items`);
    console.log(`- serviceProvided: ${serviceProvided.length} items`);
  } catch (error) {
    console.error("Error fetching activity data:", error);
    appUtils.showNotification(
      "Error loading activity data: " + error.message,
      "error",
    );
    throw error;
  } finally {
    isLoading = false;
  }
}

/**
 * Apply filters to data
 */
function applyFilters(tabId, items) {
  const activeTab = document.getElementById(tabId);
  if (!activeTab) return items;

  let filteredItems = [...items];
  const searchInput = document.getElementById("activitySearch");
  const searchTerm = searchInput?.value.toLowerCase() || "";

  // Apply search filter
  if (searchTerm) {
    filteredItems = filteredItems.filter(
      (item) =>
        (item.name || item.description || "")
          .toLowerCase()
          .includes(searchTerm) ||
        (item.address || "").toLowerCase().includes(searchTerm) ||
        (item.user_notes || "").toLowerCase().includes(searchTerm) ||
        (item.provider_notes || "").toLowerCase().includes(searchTerm) ||
        (item.price_distribution_note || "")
          .toLowerCase()
          .includes(searchTerm) ||
        (item.client || "").toLowerCase().includes(searchTerm) ||
        (item.provider || "").toLowerCase().includes(searchTerm),
    );
  }

  // Apply status filter
  const statusFilter = activeTab.querySelector('select[id$="Status"]');
  if (statusFilter && statusFilter.value !== "all") {
    const filterValue = statusFilter.value.toLowerCase();

    filteredItems = filteredItems.filter((item) => {
      const itemStatus = item.status ? item.status.toLowerCase() : "";

      // Map filter values to actual API status values
      if (filterValue === "completed") {
        return itemStatus === "completed";
      } else if (filterValue === "in-progress") {
        return itemStatus === "in_progress";
      } else if (filterValue === "pending") {
        return itemStatus === "pending";
      } else if (filterValue === "cancelled") {
        return itemStatus === "cancelled";
      } else if (filterValue === "rejected") {
        return itemStatus === "rejected";
      } else if (filterValue === "quote_given") {
        return itemStatus === "quote_given";
      } else if (filterValue === "accepted") {
        return itemStatus === "accepted";
      }

      return itemStatus.includes(filterValue.replace("-", "_"));
    });
  }

  // Apply date filter
  const dateFilter = activeTab.querySelector('select[id$="Date"]');
  if (dateFilter && dateFilter.value !== "all") {
    filteredItems = filteredItems.filter((item) => {
      const itemDate = new Date(item.date || item.created_at);
      const now = new Date();

      switch (dateFilter.value) {
        case "last-week":
          const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return itemDate >= lastWeek;
        case "last-month":
          const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return itemDate >= lastMonth;
        case "last-3-months":
          const last3Months = new Date(
            now.getTime() - 90 * 24 * 60 * 60 * 1000,
          );
          return itemDate >= last3Months;
        case "this-year":
          return itemDate.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    });
  }

  return filteredItems;
}

/**
 * Render activity items
 */
function renderActivityItems(tabId, items, container) {
  if (!items || items.length === 0) {
    container.innerHTML = `
      <div class="empty-activity">
        <i class="fas fa-inbox"></i>
        <h3>No ${getTabTitle(tabId)}</h3>
        <p>${getEmptyMessage(tabId)}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = "";

  items.forEach((item) => {
    const activityItem = document.createElement("div");
    activityItem.className = "activity-item card";
    activityItem.style.marginBottom = "1rem";

    // Get status badge class
    const statusClass = getStatusClass(item.status);
    const statusText = getStatusText(item.status);

    activityItem.innerHTML = `
      <div class="activity-header">
        <div class="activity-title">
          <h4>${item.name || item.description || "Booking"}</h4>
          <span class="badge ${statusClass}">${statusText}</span>
        </div>
        <div class="activity-price">
          <strong>${appUtils.formatCurrency(item.price)}</strong>
          ${
            item.final_price && item.final_price !== item.quoted_price
              ? `<small class="text-muted">(Quoted: ${appUtils.formatCurrency(
                  item.quoted_price,
                )})</small>`
              : ""
          }
        </div>
      </div>
      
      <div class="activity-details">
        <div class="activity-meta">
          <span><i class="fas fa-user"></i> ${getOtherParty(tabId, item)}</span>
          <span><i class="fas fa-calendar"></i> ${appUtils.formatDate(
            item.date,
          )}</span>
          ${
            item.completed_at
              ? `<span><i class="fas fa-check-circle"></i> Completed: ${appUtils.formatDate(
                  item.completed_at,
                )}</span>`
              : ""
          }
        </div>
        
        ${
          item.address
            ? `<p class="activity-address"><i class="fas fa-map-marker-alt"></i> ${item.address}</p>`
            : ""
        }
        
        ${
          item.user_notes
            ? `
          <div class="activity-notes">
            <strong><i class="fas fa-sticky-note"></i> Client Notes:</strong>
            <p>${item.user_notes}</p>
          </div>`
            : ""
        }
        
        ${
          item.provider_notes && tabId === "serviceProvided"
            ? `
          <div class="activity-notes">
            <strong><i class="fas fa-sticky-note"></i> Your Notes:</strong>
            <p>${item.provider_notes}</p>
          </div>`
            : ""
        }
        
        ${
          item.provider_notes && tabId === "serviceTaken"
            ? `
          <div class="activity-notes">
            <strong><i class="fas fa-sticky-note"></i> Provider Notes:</strong>
            <p>${item.provider_notes}</p>
          </div>`
            : ""
        }
        
        ${
          item.price_distribution_note
            ? `
          <div class="activity-notes" style="background-color: #f8f9fa; padding: 0.75rem; border-radius: 6px; margin-top: 0.5rem;">
            <strong><i class="fas fa-money-bill-wave"></i> Price Distribution:</strong>
            <p style="margin-bottom: 0;">${item.price_distribution_note}</p>
          </div>`
            : ""
        }
      </div>
      
      <div class="activity-actions">
        ${getActionButtons(tabId, item)}
        <small class="text-muted">Created: ${appUtils.formatDate(
          item.created_at,
        )}</small>
      </div>
    `;

    // Add click handler for details
    activityItem.addEventListener("click", (e) => {
      if (!e.target.closest(".btn")) {
        viewBookingDetails(item.id, tabId);
      }
    });

    container.appendChild(activityItem);
  });
}

/**
 * Get title for tab
 */
function getTabTitle(tabId) {
  const titles = {
    serviceTaken: "services taken",
    serviceProvided: "services provided",
    boughtItems: "items purchased",
    soldItems: "items sold",
  };
  return titles[tabId] || "activities";
}

/**
 * Get empty message for tab
 */
function getEmptyMessage(tabId) {
  const messages = {
    serviceTaken: "You haven't booked any services yet.",
    serviceProvided: "You haven't provided any services yet.",
    boughtItems: "You haven't purchased any items yet.",
    soldItems: "You haven't sold any items yet.",
  };
  return messages[tabId] || "No activities found.";
}

/**
 * Get status badge class based on Django status
 */
function getStatusClass(status) {
  if (!status) return "badge-secondary";

  const statusLower = status.toLowerCase();

  if (statusLower === "completed") {
    return "badge-success";
  } else if (statusLower === "in_progress") {
    return "badge-warning";
  } else if (statusLower === "pending") {
    return "badge-info";
  } else if (statusLower === "quote_given") {
    return "badge-primary";
  } else if (statusLower === "accepted") {
    return "badge-primary";
  } else if (statusLower === "cancelled" || statusLower === "rejected") {
    return "badge-danger";
  }

  return "badge-secondary";
}

/**
 * Get display text for status
 */
function getStatusText(status) {
  if (!status) return "Unknown";

  const statusMap = {
    pending: "Pending",
    quote_given: "Quote Given",
    accepted: "Accepted",
    in_progress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
    rejected: "Rejected",
  };

  return (
    statusMap[status.toLowerCase()] ||
    status
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

/**
 * Get other party name (provider/client/buyer/seller)
 */
function getOtherParty(tabId, item) {
  switch (tabId) {
    case "serviceTaken":
      return `Provider: ${item.provider}`;
    case "serviceProvided":
      return `Client: ${item.client}`;
    case "boughtItems":
      return item.seller || "Seller";
    case "soldItems":
      return item.buyer || "Buyer";
    default:
      return "User";
  }
}

/**
 * Get action buttons for activity item
 */
function getActionButtons(tabId, item) {
  let buttons = `<button class="btn btn-outline btn-sm" onclick="viewBookingDetails(${item.id}, '${tabId}')">
    <i class="fas fa-eye"></i> Details
  </button>`;

  // Contact button for services
  if (tabId === "serviceTaken" || tabId === "serviceProvided") {
    const contactId =
      tabId === "serviceTaken" ? item.provider_id : item.user_id;
    buttons += `<button class="btn btn-outline btn-sm" onclick="contactUser(${contactId})">
      <i class="fas fa-comment"></i> Contact
    </button>`;
  }

  // Action buttons for provider
  if (tabId === "serviceProvided") {
    if (item.status === "PENDING") {
      buttons += `<button class="btn btn-primary btn-sm" onclick="showGiveQuoteModal(${item.id})">
        <i class="fas fa-dollar-sign"></i> Give Quote
      </button>`;
      buttons += `<button class="btn btn-danger btn-sm" onclick="updateBookingStatus(${item.id}, 'REJECTED', '${tabId}')">
        <i class="fas fa-times"></i> Reject
      </button>`;
    } else if (item.status === "ACCEPTED") {
      buttons += `<button class="btn btn-primary btn-sm" onclick="updateBookingStatus(${item.id}, 'IN_PROGRESS', '${tabId}')">
        <i class="fas fa-play"></i> Start Service
      </button>`;
    } else if (item.status === "IN_PROGRESS") {
      buttons += `<button class="btn btn-success btn-sm" onclick="showCompleteServiceModal(${item.id}, '${tabId}')">
        <i class="fas fa-check"></i> Complete
      </button>`;
    }
  }

  // Action buttons for customer
  if (tabId === "serviceTaken") {
    if (item.status === "QUOTE_GIVEN") {
      buttons += `<button class="btn btn-success btn-sm" onclick="updateBookingStatus(${item.id}, 'ACCEPTED', '${tabId}')">
        <i class="fas fa-check"></i> Accept Quote
      </button>`;
      buttons += `<button class="btn btn-danger btn-sm" onclick="updateBookingStatus(${item.id}, 'REJECTED', '${tabId}')">
        <i class="fas fa-times"></i> Reject Quote
      </button>`;
    }
    if (item.status === "PENDING") {
      buttons += `<button class="btn btn-danger btn-sm" onclick="updateBookingStatus(${item.id}, 'CANCELLED', '${tabId}')">
        <i class="fas fa-times"></i> Cancel
      </button>`;
    }
  }

  return buttons;
}

/**
 * Setup activity filters
 */
function setupActivityFilters() {
  // Search functionality
  const searchInput = document.getElementById("activitySearch");
  if (searchInput) {
    let searchTimer;
    searchInput.addEventListener("input", function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        filterActivity();
      }, 300);
    });
  }

  // Status filters
  const statusFilters = document.querySelectorAll('select[id$="Status"]');
  statusFilters.forEach((filter) => {
    filter.addEventListener("change", filterActivity);
  });

  // Date filters
  const dateFilters = document.querySelectorAll('select[id$="Date"]');
  dateFilters.forEach((filter) => {
    filter.addEventListener("change", filterActivity);
  });
}

/**
 * Filter activity items
 */
function filterActivity() {
  const activeTab = document.querySelector(".tab-content.active");
  if (!activeTab) return;

  const tabId = activeTab.id;
  const container = document.getElementById(`${tabId}Container`);

  if (!container) return;

  // Get data for this tab
  let data = [];
  switch (tabId) {
    case "serviceTaken":
      data = activityData.serviceTaken || [];
      break;
    case "serviceProvided":
      data = activityData.serviceProvided || [];
      break;
    case "boughtItems":
      data = activityData.boughtItems || [];
      break;
    case "soldItems":
      data = activityData.soldItems || [];
      break;
  }

  // Apply filters
  data = applyFilters(tabId, data);

  // Re-render filtered items
  renderActivityItems(tabId, data, container);
}

/**
 * View booking details
 */
async function viewBookingDetails(bookingId, tabType) {
  try {
    // Fetch booking details
    const booking = await api.apiRequest(`bookings/${bookingId}/`, "GET");

    // Show booking details in a modal
    showBookingDetailsModal(booking, tabType);
  } catch (error) {
    console.error("Error fetching booking details:", error);
    appUtils.showNotification("Error loading booking details", "error");
  }
}

/**
 * Ensure modal styles are added to the document
 */
function ensureModalStyles() {
  if (!document.querySelector("#modal-styles")) {
    const style = document.createElement("style");
    style.id = "modal-styles";
    style.textContent = `
      .modal-overlay {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        background: rgba(0,0,0,0.7) !important;
        backdrop-filter: blur(8px) !important;
        -webkit-backdrop-filter: blur(8px) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        z-index: 9999 !important;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
      }
      
      .modal-overlay.active {
        opacity: 1 !important;
        visibility: visible !important;
        display: flex !important;
      }
      
      .modal-content {
        background: var(--card-bg, #ffffff) !important;
        border-radius: 12px !important;
        padding: 2rem !important;
        width: 90% !important;
        max-width: 500px !important;
        max-height: 85vh !important;
        overflow-y: auto !important;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3) !important;
        transform: translateY(-20px);
        transition: transform 0.3s ease;
        position: relative !important;
        z-index: 10000 !important;
      }
      
      .modal-overlay.active .modal-content {
        transform: translateY(0) !important;
      }
      
      .modal-header {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        margin-bottom: 1.5rem !important;
        padding-bottom: 1rem !important;
        border-bottom: 1px solid var(--border-color, #e1e1e1) !important;
      }
      
      .modal-header h3 {
        margin: 0 !important;
        font-size: 1.5rem !important;
        font-weight: 600 !important;
        color: var(--text-primary, #333333) !important;
      }
      
      .modal-close {
        background: none !important;
        border: none !important;
        font-size: 1.75rem !important;
        cursor: pointer !important;
        color: var(--text-secondary, #666666) !important;
        width: 36px !important;
        height: 36px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        border-radius: 50% !important;
        transition: all 0.2s ease !important;
      }
      
      .modal-close:hover {
        background: var(--bg-hover, #f5f5f5) !important;
        color: var(--text-primary, #333333) !important;
      }
      
      .modal-body {
        margin-bottom: 1.5rem !important;
      }
      
      .modal-footer {
        display: flex !important;
        gap: 0.75rem !important;
        justify-content: flex-end !important;
        padding-top: 1.5rem !important;
        border-top: 1px solid var(--border-color, #e1e1e1) !important;
      }
      
      /* Form styles for quote modal */
      .form-group {
        margin-bottom: 1.5rem !important;
      }
      
      .form-label {
        display: block !important;
        margin-bottom: 0.5rem !important;
        font-weight: 500 !important;
        color: var(--text-primary, #333333) !important;
      }
      
      .form-control {
        width: 100% !important;
        padding: 0.75rem !important;
        border: 1px solid var(--border-color, #e1e1e1) !important;
        border-radius: 8px !important;
        background: var(--input-bg, #ffffff) !important;
        color: var(--text-primary, #333333) !important;
        font-size: 1rem !important;
        transition: border-color 0.2s ease !important;
      }
      
      .form-control:focus {
        outline: none !important;
        border-color: var(--primary-color, #007bff) !important;
        box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1) !important;
      }
      
      textarea.form-control {
        min-height: 100px !important;
        resize: vertical !important;
        font-family: inherit !important;
      }
      
      /* Detail rows in booking modal */
      .detail-row {
        margin-bottom: 1rem !important;
        padding-bottom: 1rem !important;
        border-bottom: 1px solid var(--border-light, #f0f0f0) !important;
      }
      
      .detail-row:last-child {
        margin-bottom: 0 !important;
        padding-bottom: 0 !important;
        border-bottom: none !important;
      }
      
      .detail-row strong {
        display: block !important;
        margin-bottom: 0.25rem !important;
        color: var(--text-secondary, #666666) !important;
        font-size: 0.9rem !important;
        font-weight: 500 !important;
      }
      
      .detail-row span, .detail-row p {
        color: var(--text-primary, #333333) !important;
        font-size: 1rem !important;
      }
      
      .detail-row p {
        margin: 0.5rem 0 0 0 !important;
        line-height: 1.5 !important;
      }
      
      /* Button styles */
      .btn {
        padding: 0.625rem 1.25rem !important;
        border-radius: 8px !important;
        font-weight: 500 !important;
        font-size: 0.95rem !important;
        transition: all 0.2s ease !important;
        cursor: pointer !important;
        border: 1px solid transparent !important;
      }
      
      .btn-primary {
        background: var(--primary-color, #007bff) !important;
        color: white !important;
        border-color: var(--primary-color, #007bff) !important;
      }
      
      .btn-primary:hover {
        background: var(--primary-dark, #0056b3) !important;
        border-color: var(--primary-dark, #0056b3) !important;
        transform: translateY(-1px) !important;
        box-shadow: 0 4px 12px rgba(0, 123, 255, 0.2) !important;
      }
      
      .btn-secondary {
        background: var(--secondary-bg, #6c757d) !important;
        color: white !important;
        border-color: var(--secondary-bg, #6c757d) !important;
      }
      
      .btn-secondary:hover {
        background: var(--secondary-dark, #545b62) !important;
        border-color: var(--secondary-dark, #545b62) !important;
      }
      
      .btn-danger {
        background: var(--danger-color, #dc3545) !important;
        color: white !important;
        border-color: var(--danger-color, #dc3545) !important;
      }
      
      .btn-danger:hover {
        background: var(--danger-dark, #bd2130) !important;
        border-color: var(--danger-dark, #bd2130) !important;
      }
      
      .btn-success {
        background: var(--success-color, #28a745) !important;
        color: white !important;
        border-color: var(--success-color, #28a745) !important;
      }
      
      .btn-success:hover {
        background: var(--success-dark, #1e7e34) !important;
        border-color: var(--success-dark, #1e7e34) !important;
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * Show booking details modal
 */
function showBookingDetailsModal(booking, tabType) {
  // Ensure styles are loaded
  ensureModalStyles();

  // Close any existing modal first
  closeModal();
  closeGiveQuoteModal();
  closeCompleteServiceModal();

  // Create modal HTML
  const modalHTML = `
    <div class="modal-overlay" id="bookingModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Booking Details</h3>
          <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
          <div class="booking-details">
            <h4 style="margin: 0 0 1.5rem 0; font-size: 1.25rem;">${booking.description}</h4>
            
            <div class="detail-row">
              <strong>Status:</strong>
              <span class="badge ${getStatusClass(booking.status)}" style="display: inline-block; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.875rem; font-weight: 500;">
                ${getStatusText(booking.status)}
              </span>
            </div>
            
            <div class="detail-row">
              <strong>Scheduled Date:</strong>
              <span>${appUtils.formatDate(booking.scheduled_date)}</span>
            </div>
            
            <div class="detail-row">
              <strong>Quoted Price:</strong>
              <span>${appUtils.formatCurrency(booking.quote_price)}</span>
            </div>
            
            ${
              booking.final_price
                ? `
            <div class="detail-row">
              <strong>Final Price:</strong>
              <span>${appUtils.formatCurrency(booking.final_price)}</span>
            </div>`
                : ""
            }
            
            <div class="detail-row">
              <strong>Address:</strong>
              <span>${booking.address}</span>
            </div>
            
            <div class="detail-row">
              <strong>Client:</strong>
              <span>${booking.user_name || "N/A"}</span>
            </div>
            
            <div class="detail-row">
              <strong>Provider:</strong>
              <span>${booking.provider_name || "N/A"}</span>
            </div>
            
            ${
              booking.user_notes
                ? `
            <div class="detail-row">
              <strong>Client Notes:</strong>
              <p>${booking.user_notes}</p>
            </div>`
                : ""
            }
            
            ${
              booking.provider_notes
                ? `
            <div class="detail-row">
              <strong>Provider Notes:</strong>
              <p>${booking.provider_notes}</p>
            </div>`
                : ""
            }
            
            ${
              booking.price_distribution_note
                ? `
            <div class="detail-row">
              <strong>Price Distribution Notes:</strong>
              <p>${booking.price_distribution_note}</p>
            </div>`
                : ""
            }
            
            ${
              booking.quoted_at
                ? `
            <div class="detail-row">
              <strong>Quoted At:</strong>
              <span>${appUtils.formatDate(booking.quoted_at)}</span>
            </div>`
                : ""
            }
            
            ${
              booking.accepted_at
                ? `
            <div class="detail-row">
              <strong>Accepted At:</strong>
              <span>${appUtils.formatDate(booking.accepted_at)}</span>
            </div>`
                : ""
            }
            
            ${
              booking.started_at
                ? `
            <div class="detail-row">
              <strong>Started At:</strong>
              <span>${appUtils.formatDate(booking.started_at)}</span>
            </div>`
                : ""
            }
            
            ${
              booking.completed_at
                ? `
            <div class="detail-row">
              <strong>Completed At:</strong>
              <span>${appUtils.formatDate(booking.completed_at)}</span>
            </div>`
                : ""
            }
            
            <div class="detail-row">
              <strong>Created:</strong>
              <span>${appUtils.formatDate(booking.created_at)}</span>
            </div>
            
            <div class="detail-row">
              <strong>Last Updated:</strong>
              <span>${appUtils.formatDate(booking.updated_at)}</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal()">Close</button>
          ${getModalActionButtons(booking, tabType)}
        </div>
      </div>
    </div>
  `;

  // Add modal to body
  const modalContainer = document.createElement("div");
  modalContainer.innerHTML = modalHTML;
  document.body.appendChild(modalContainer);

  // Add active class with delay for animation
  setTimeout(() => {
    const modal = document.getElementById("bookingModal");
    if (modal) {
      modal.classList.add("active");
    }
  }, 10);
}

/**
 * Get action buttons for modal footer
 */
function getModalActionButtons(booking, tabType) {
  let buttons = "";

  if (tabType === "serviceProvided") {
    if (booking.status === "PENDING") {
      buttons += `<button class="btn btn-primary" onclick="showGiveQuoteModal(${booking.id})">Give Quote</button>`;
      buttons += `<button class="btn btn-danger" onclick="updateBookingStatus(${booking.id}, 'REJECTED', '${tabType}')">Reject</button>`;
    } else if (booking.status === "ACCEPTED") {
      buttons += `<button class="btn btn-primary" onclick="updateBookingStatus(${booking.id}, 'IN_PROGRESS', '${tabType}')">Start Service</button>`;
    } else if (booking.status === "IN_PROGRESS") {
      buttons += `<button class="btn btn-success" onclick="showCompleteServiceModal(${booking.id}, '${tabType}')">Complete Service</button>`;
    }
  } else if (tabType === "serviceTaken") {
    if (booking.status === "QUOTE_GIVEN") {
      buttons += `<button class="btn btn-success" onclick="updateBookingStatus(${booking.id}, 'ACCEPTED', '${tabType}')">Accept Quote</button>`;
      buttons += `<button class="btn btn-danger" onclick="updateBookingStatus(${booking.id}, 'REJECTED', '${tabType}')">Reject Quote</button>`;
    }
    if (booking.status === "PENDING") {
      buttons += `<button class="btn btn-danger" onclick="updateBookingStatus(${booking.id}, 'CANCELLED', '${tabType}')">Cancel Booking</button>`;
    }
  }

  return buttons;
}

/**
 * Show modal for giving a quote
 */
function showGiveQuoteModal(bookingId) {
  // Ensure styles are loaded
  ensureModalStyles();

  // Close any existing modal first
  closeModal();
  closeGiveQuoteModal();
  closeCompleteServiceModal();

  // Create modal HTML
  const modalHTML = `
    <div class="modal-overlay" id="giveQuoteModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Give Quote</h3>
          <button class="modal-close" onclick="closeGiveQuoteModal()">&times;</button>
        </div>
        <div class="modal-body">
          <form id="giveQuoteForm" onsubmit="event.preventDefault(); submitQuote(${bookingId})">
            <div class="form-group">
              <label for="quotePrice" class="form-label">Quote Price (₹)</label>
              <input 
                type="number" 
                step="0.01" 
                min="0" 
                class="form-control" 
                id="quotePrice" 
                required 
                placeholder="Enter price"
                style="font-size: 1.1rem; font-weight: 500;"
              >
            </div>
            <div class="form-group">
              <label for="providerNotes" class="form-label">Provider Notes (Optional)</label>
              <textarea 
                class="form-control" 
                id="providerNotes" 
                rows="4" 
                placeholder="Add any notes for the client, such as:
• What's included in the service
• Any special requirements
• Estimated timeline
• Additional costs if any"
              ></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeGiveQuoteModal()">Cancel</button>
          <button class="btn btn-primary" onclick="submitQuote(${bookingId})">Submit Quote</button>
        </div>
      </div>
    </div>
  `;

  // Add modal to body
  const modalContainer = document.createElement("div");
  modalContainer.innerHTML = modalHTML;
  document.body.appendChild(modalContainer);

  // Add active class with delay for animation
  setTimeout(() => {
    const modal = document.getElementById("giveQuoteModal");
    if (modal) {
      modal.classList.add("active");
    }
  }, 10);

  // Focus on the price input
  setTimeout(() => {
    const priceInput = document.getElementById("quotePrice");
    if (priceInput) {
      priceInput.focus();
      // Auto-select the text
      priceInput.select();
    }
  }, 50);
}

/**
 * Show modal for completing a service
 */
function showCompleteServiceModal(bookingId, tabType) {
  // Ensure styles are loaded
  ensureModalStyles();

  // Close any existing modal first
  closeModal();
  closeGiveQuoteModal();
  closeCompleteServiceModal();

  // Create modal HTML
  const modalHTML = `
    <div class="modal-overlay" id="completeServiceModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Complete Service</h3>
          <button class="modal-close" onclick="closeCompleteServiceModal()">&times;</button>
        </div>
        <div class="modal-body">
          <form id="completeServiceForm" onsubmit="event.preventDefault(); submitCompleteService(${bookingId}, '${tabType}')">
            <div class="form-group">
              <label for="finalPrice" class="form-label">
                Final Price (₹)
                <small class="text-muted" style="font-weight: normal;">Leave blank to use quoted price</small>
              </label>
              <input 
                type="number" 
                step="0.01" 
                min="0" 
                class="form-control" 
                id="finalPrice" 
                placeholder="Enter final price (optional)"
                style="font-size: 1.1rem;"
              >
            </div>
            <div class="form-group">
              <label for="priceDistributionNote" class="form-label">
                Price Distribution Notes (Optional)
                <small class="text-muted" style="font-weight: normal;">e.g., money distribution, additional work details, etc.</small>
              </label>
              <textarea 
                class="form-control" 
                id="priceDistributionNote" 
                rows="4" 
                placeholder="Example:
• 80% to provider, 20% to platform
• Additional materials cost: ₹500
• Service completed as discussed
• Any special instructions followed"
              ></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeCompleteServiceModal()">Cancel</button>
          <button class="btn btn-success" onclick="submitCompleteService(${bookingId}, '${tabType}')">
            <i class="fas fa-check"></i> Mark as Completed
          </button>
        </div>
      </div>
    </div>
  `;

  // Add modal to body
  const modalContainer = document.createElement("div");
  modalContainer.innerHTML = modalHTML;
  document.body.appendChild(modalContainer);

  // Add active class with delay for animation
  setTimeout(() => {
    const modal = document.getElementById("completeServiceModal");
    if (modal) {
      modal.classList.add("active");
    }
  }, 10);

  // Focus on the price input
  setTimeout(() => {
    const priceInput = document.getElementById("finalPrice");
    if (priceInput) {
      priceInput.focus();
    }
  }, 50);
}

/**
 * Close booking details modal with animation
 */
function closeModal() {
  const modal = document.getElementById("bookingModal");
  if (modal) {
    modal.classList.remove("active");
    setTimeout(() => {
      modal.remove();
    }, 300);
  }
}

/**
 * Close the give quote modal with animation
 */
function closeGiveQuoteModal() {
  const modal = document.getElementById("giveQuoteModal");
  if (modal) {
    modal.classList.remove("active");
    setTimeout(() => {
      modal.remove();
    }, 300);
  }
}

/**
 * Close the complete service modal with animation
 */
function closeCompleteServiceModal() {
  const modal = document.getElementById("completeServiceModal");
  if (modal) {
    modal.classList.remove("active");
    setTimeout(() => {
      modal.remove();
    }, 300);
  }
}

/**
 * Submit the quote to the backend
 */
async function submitQuote(bookingId) {
  const quotePrice = document.getElementById("quotePrice")?.value;
  const providerNotes = document.getElementById("providerNotes")?.value;

  if (!quotePrice || quotePrice.trim() === "" || parseFloat(quotePrice) <= 0) {
    appUtils.showNotification("Please enter a valid quote price.", "error");
    const priceInput = document.getElementById("quotePrice");
    if (priceInput) {
      priceInput.focus();
      priceInput.select();
    }
    return;
  }

  try {
    const updateData = {
      quote_price: parseFloat(quotePrice),
      provider_notes: providerNotes || "",
    };

    // Show loading
    const submitBtn = document.querySelector("#giveQuoteModal .btn-primary");
    if (submitBtn) {
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Submitting...';
      submitBtn.disabled = true;
    }

    const response = await api.apiRequest(
      `bookings/${bookingId}/`,
      "PUT",
      updateData,
    );

    appUtils.showNotification("Quote given successfully!", "success");

    // Refresh data
    isDataLoaded = false;

    // Close modal
    closeGiveQuoteModal();

    // Reload current tab
    const activeTab = document.querySelector(".tab-content.active");
    if (activeTab) {
      const tabId = activeTab.id;
      await loadTabData(tabId);
    }
  } catch (error) {
    console.error("Error giving quote:", error);
    appUtils.showNotification(
      `Failed to give quote: ${error.message}`,
      "error",
    );

    // Reset button
    const submitBtn = document.querySelector("#giveQuoteModal .btn-primary");
    if (submitBtn) {
      submitBtn.innerHTML = "Submit Quote";
      submitBtn.disabled = false;
    }
  }
}

/**
 * Submit completed service to backend
 */
async function submitCompleteService(bookingId, tabType) {
  const finalPriceInput = document.getElementById("finalPrice");
  const priceDistributionNoteInput = document.getElementById(
    "priceDistributionNote",
  );

  const finalPrice = finalPriceInput?.value;
  const priceDistributionNote = priceDistributionNoteInput?.value || "";

  // Prepare update data
  const updateData = {
    status: "COMPLETED",
  };

  // Add final price if provided
  if (finalPrice && finalPrice.trim() !== "" && parseFloat(finalPrice) > 0) {
    updateData.final_price = parseFloat(finalPrice);
  }

  // Add price distribution note if provided
  if (priceDistributionNote.trim() !== "") {
    updateData.price_distribution_note = priceDistributionNote;
  }

  try {
    // Show loading
    const submitBtn = document.querySelector(
      "#completeServiceModal .btn-success",
    );
    if (submitBtn) {
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Completing...';
      submitBtn.disabled = true;
    }

    const response = await api.apiRequest(
      `bookings/${bookingId}/`,
      "PUT",
      updateData,
    );

    appUtils.showNotification("Service marked as completed!", "success");

    // Refresh data
    isDataLoaded = false;

    // Close modal
    closeCompleteServiceModal();

    // Reload current tab
    const activeTab = document.querySelector(".tab-content.active");
    if (activeTab) {
      const tabId = activeTab.id;
      await loadTabData(tabId);
    }

    // Also close booking details modal if it's open
    closeModal();
  } catch (error) {
    console.error("Error completing service:", error);
    appUtils.showNotification(
      `Failed to complete service: ${error.message}`,
      "error",
    );

    // Reset button
    const submitBtn = document.querySelector(
      "#completeServiceModal .btn-success",
    );
    if (submitBtn) {
      submitBtn.innerHTML = '<i class="fas fa-check"></i> Mark as Completed';
      submitBtn.disabled = false;
    }
  }
}

/**
 * Give quote for a booking
 */
async function giveQuote(bookingId) {
  showGiveQuoteModal(bookingId);
}

/**
 * Contact user
 */
function contactUser(userId) {
  appUtils.showNotification(`Opening chat with user ${userId}`, "info");
  // In a real app, you would open a chat interface
}

/**
 * Update booking status
 */
async function updateBookingStatus(bookingId, status, tabType) {
  // Handle COMPLETED status separately with modal
  if (status === "COMPLETED" && tabType === "serviceProvided") {
    showCompleteServiceModal(bookingId, tabType);
    return;
  }

  try {
    let confirmMsg = "";

    switch (status) {
      case "REJECTED":
        // Check if it's the provider rejecting a booking or the client rejecting a quote
        if (tabType === "serviceProvided") {
          confirmMsg = "Are you sure you want to reject this booking?";
        } else if (tabType === "serviceTaken") {
          confirmMsg = "Are you sure you want to reject this quote?";
        } else {
          confirmMsg = `Are you sure you want to change status to ${status}?`;
        }
        break;
      case "CANCELLED":
        confirmMsg = "Are you sure you want to cancel this booking?";
        break;
      case "ACCEPTED":
        confirmMsg = "Are you sure you want to accept this quote?";
        break;
      case "IN_PROGRESS":
        confirmMsg = "Are you ready to start this service?";
        break;
      default:
        confirmMsg = `Are you sure you want to change status to ${status}?`;
    }

    if (!confirm(confirmMsg)) return;

    const updateData = { status: status };

    const response = await api.apiRequest(
      `bookings/${bookingId}/`,
      "PUT",
      updateData,
    );

    appUtils.showNotification(
      `Booking ${status.toLowerCase()} successfully!`,
      "success",
    );

    // Refresh data
    isDataLoaded = false;

    // Reload current tab
    const activeTab = document.querySelector(".tab-content.active");
    if (activeTab) {
      const tabId = activeTab.id;
      await loadTabData(tabId);
    }

    // Close modal if open
    closeModal();
  } catch (error) {
    console.error("Error updating booking status:", error);
    appUtils.showNotification(
      `Failed to update booking: ${error.message}`,
      "error",
    );
  }
}

/**
 * Complete service (provider action) - Now uses modal
 */
async function completeService(bookingId, tabType) {
  showCompleteServiceModal(bookingId, tabType);
}

/**
 * Become a provider
 */
async function becomeProvider() {
  try {
    await api.becomeProvider();
    appUtils.showNotification("You are now a service provider!", "success");
    // Update UI
    document.querySelectorAll(".provider-only").forEach((el) => {
      el.style.display = "block";
    });
    // Refresh data
    isDataLoaded = false;
    await loadTabData("serviceProvided");
  } catch (error) {
    appUtils.showNotification(
      `Failed to become provider: ${error.message}`,
      "error",
    );
  }
}

/**
 * Close modals with Escape key
 */
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeModal();
    closeGiveQuoteModal();
    closeCompleteServiceModal();
  }
});

/**
 * Close any open modal when clicking outside
 */
document.addEventListener("click", function (event) {
  const bookingModal = document.getElementById("bookingModal");
  const giveQuoteModal = document.getElementById("giveQuoteModal");
  const completeServiceModal = document.getElementById("completeServiceModal");

  if (bookingModal && bookingModal.classList.contains("active")) {
    if (event.target === bookingModal) {
      closeModal();
    }
  }

  if (giveQuoteModal && giveQuoteModal.classList.contains("active")) {
    if (event.target === giveQuoteModal) {
      closeGiveQuoteModal();
    }
  }

  if (
    completeServiceModal &&
    completeServiceModal.classList.contains("active")
  ) {
    if (event.target === completeServiceModal) {
      closeCompleteServiceModal();
    }
  }
});
