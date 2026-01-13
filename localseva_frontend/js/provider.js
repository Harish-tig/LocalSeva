/**
 * Provider dashboard functionality
 * Requires authentication and provider role
 */

document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    if (!api.isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }
    
    // Check if user is provider
    const isProvider = localStorage.getItem('userIsProvider') === 'true';
    if (!isProvider) {
        window.location.href = 'services.html';
        return;
    }
    
    // Initialize provider dashboard
    await initProviderDashboard();
});

/**
 * Initialize provider dashboard
 */
async function initProviderDashboard() {
    // Setup tabs
    setupProviderTabs();
    
    // Load provider services
    await loadProviderServices();
    
    // Setup action buttons
    setupProviderActions();
    
    // Load provider stats
    await loadProviderStats();
}

/**
 * Setup provider tabs
 */
function setupProviderTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', async () => {
            // Remove active class
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active to clicked
            button.classList.add('active');
            const tabId = button.dataset.tab;
            const tabContent = document.getElementById(tabId);
            
            if (tabContent) {
                tabContent.classList.add('active');
                
                // Load data for this tab
                await loadTabServices(tabId);
            }
        });
    });
    
    // Load initial tab data
    const initialTab = document.querySelector('.tab-btn.active')?.dataset.tab || 'pendingServices';
    loadTabServices(initialTab);
}

/**
 * Load provider services
 */
async function loadProviderServices() {
    try {
        const services = await api.getProviderServices();
        
        // Store services globally
        window.providerServices = services;
        
        // Update badge counts
        updateServiceBadges(services);
        
    } catch (error) {
        console.error('Error loading provider services:', error);
        appUtils.showNotification('Error loading your services', 'error');
        
        // Use empty data
        window.providerServices = {
            pending: [],
            working: [],
            completed: []
        };
    }
}

/**
 * Update service badge counts
 */
function updateServiceBadges(services) {
    const pendingCount = services.pending?.length || 0;
    const workingCount = services.working?.length || 0;
    const completedCount = services.completed?.length || 0;
    
    // Update header badges
    document.getElementById('pendingCount')?.textContent = pendingCount;
    document.getElementById('workingCount')?.textContent = workingCount;
    document.getElementById('completedCount')?.textContent = completedCount;
    
    // Update tab badges
    document.getElementById('pendingBadge')?.textContent = pendingCount;
    document.getElementById('workingBadge')?.textContent = workingCount;
    document.getElementById('completedBadge')?.textContent = completedCount;
}

/**
 * Load services for specific tab
 */
async function loadTabServices(tabId) {
    const container = document.getElementById(`${tabId}Container`);
    if (!container) return;
    
    // Show loading
    container.innerHTML = `
        <div class="loading-skeleton" style="height: 150px;"></div>
        <div class="loading-skeleton" style="height: 150px;"></div>
    `;
    
    try {
        let services = [];
        
        // Get services for this tab
        switch(tabId) {
            case 'pendingServices':
                services = window.providerServices?.pending || [];
                break;
            case 'workingServices':
                services = window.providerServices?.working || [];
                break;
            case 'completedServices':
                services = window.providerServices?.completed || [];
                break;
        }
        
        // Render services
        renderServices(tabId, services, container);
        
    } catch (error) {
        console.error(`Error loading ${tabId} services:`, error);
        container.innerHTML = '<p class="empty-services">Error loading services</p>';
    }
}

/**
 * Render services in container
 */
function renderServices(tabId, services, container) {
    if (!services || services.length === 0) {
        container.innerHTML = `
            <div class="empty-services">
                <i class="fas fa-inbox"></i>
                <h3>No ${getServiceTabTitle(tabId)}</h3>
                <p>${getServiceEmptyMessage(tabId)}</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    services.forEach(service => {
        const serviceCard = document.createElement('div');
        serviceCard.className = 'service-card';
        
        serviceCard.innerHTML = `
            <div class="service-header">
                <div class="service-title">${service.title || 'Service'}</div>
                <div class="service-status" style="color: ${getStatusColor(tabId)}">
                    ${getStatusText(tabId)}
                </div>
            </div>
            
            <div class="service-meta">
                <span><i class="fas fa-user"></i> ${service.client || 'Client'}</span>
                <span><i class="fas fa-calendar"></i> ${appUtils.formatDate(service.date || service.created_at)}</span>
                <span><i class="fas fa-map-marker-alt"></i> ${service.location || 'Location'}</span>
                <span><i class="fas fa-dollar-sign"></i> ${appUtils.formatCurrency(service.price)}</span>
            </div>
            
            ${service.notes ? `
            <div class="service-note">
                <strong>Client Note:</strong> ${service.notes}
            </div>
            ` : ''}
            
            <div class="service-actions">
                ${getServiceActions(tabId, service.id)}
            </div>
        `;
        
        container.appendChild(serviceCard);
    });
}

/**
 * Get title for service tab
 */
function getServiceTabTitle(tabId) {
    const titles = {
        pendingServices: 'pending services',
        workingServices: 'services in progress',
        completedServices: 'completed services'
    };
    return titles[tabId] || 'services';
}

/**
 * Get empty message for service tab
 */
function getServiceEmptyMessage(tabId) {
    const messages = {
        pendingServices: 'No pending service requests.',
        workingServices: 'No services in progress.',
        completedServices: 'No completed services yet.'
    };
    return messages[tabId] || 'No services found.';
}

/**
 * Get status color for tab
 */
function getStatusColor(tabId) {
    const colors = {
        pendingServices: 'var(--warning-color)',
        workingServices: 'var(--primary-color)',
        completedServices: 'var(--success-color)'
    };
    return colors[tabId] || 'var(--text-secondary)';
}

/**
 * Get status text for tab
 */
function getStatusText(tabId) {
    const texts = {
        pendingServices: 'Pending',
        workingServices: 'In Progress',
        completedServices: 'Completed'
    };
    return texts[tabId] || 'Unknown';
}

/**
 * Get action buttons for service
 */
function getServiceActions(tabId, serviceId) {
    switch(tabId) {
        case 'pendingServices':
            return `
                <button class="btn btn-success btn-sm" onclick="updateServiceStatus(${serviceId}, 'working')">
                    <i class="fas fa-check"></i> Accept
                </button>
                <button class="btn btn-danger btn-sm" onclick="rejectService(${serviceId})">
                    <i class="fas fa-times"></i> Reject
                </button>
                <button class="btn btn-outline btn-sm" onclick="contactClient(${serviceId})">
                    <i class="fas fa-message"></i> Message
                </button>
            `;
        case 'workingServices':
            return `
                <button class="btn btn-success btn-sm" onclick="updateServiceStatus(${serviceId}, 'completed')">
                    <i class="fas fa-flag-checkered"></i> Complete
                </button>
                <button class="btn btn-outline btn-sm" onclick="contactClient(${serviceId})">
                    <i class="fas fa-message"></i> Message
                </button>
            `;
        case 'completedServices':
            return `
                <button class="btn btn-outline btn-sm" onclick="viewServiceDetails(${serviceId})">
                    <i class="fas fa-eye"></i> Details
                </button>
                <button class="btn btn-outline btn-sm" onclick="createInvoice(${serviceId})">
                    <i class="fas fa-receipt"></i> Invoice
                </button>
            `;
        default:
            return '';
    }
}

/**
 * Setup provider action buttons
 */
function setupProviderActions() {
    // Accept all button
    const acceptAllBtn = document.getElementById('acceptAllBtn');
    if (acceptAllBtn) {
        acceptAllBtn.addEventListener('click', async function() {
            if (confirm('Accept all pending service requests?')) {
                appUtils.showNotification('Processing...', 'info');
                // This would need backend support for bulk updates
            }
        });
    }
    
    // Complete all button
    const completeAllBtn = document.getElementById('completeAllBtn');
    if (completeAllBtn) {
        completeAllBtn.addEventListener('click', async function() {
            if (confirm('Mark all working services as complete?')) {
                appUtils.showNotification('Processing...', 'info');
                // This would need backend support for bulk updates
            }
        });
    }
    
    // Refresh button
    const refreshBtn = document.getElementById('refreshPendingBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async function() {
            await loadProviderServices();
            const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab;
            if (activeTab) {
                await loadTabServices(activeTab);
            }
            appUtils.showNotification('Services refreshed', 'success');
        });
    }
    
    // Tool buttons
    const toolButtons = document.querySelectorAll('.tool-card button');
    toolButtons.forEach(button => {
        button.addEventListener('click', function() {
            const toolName = this.closest('.tool-card').querySelector('h3').textContent;
            appUtils.showNotification(`Opening ${toolName}`, 'info');
        });
    });
}

/**
 * Load provider statistics
 */
async function loadProviderStats() {
    try {
        // This would come from a separate API endpoint
        // For now, calculate from services
        const services = window.providerServices;
        
        const totalPending = services.pending?.length || 0;
        const totalWorking = services.working?.length || 0;
        const totalCompleted = services.completed?.length || 0;
        const totalServices = totalPending + totalWorking + totalCompleted;
        
        // Calculate earnings (simplified)
        let totalEarnings = 0;
        if (services.completed) {
            services.completed.forEach(service => {
                const price = parseFloat((service.price || '0').replace('$', '')) || 0;
                totalEarnings += price;
            });
        }
        
        // Update stats display
        document.getElementById('totalServices')?.textContent = totalServices;
        document.getElementById('avgRating')?.textContent = '4.8'; // Would come from API
        document.getElementById('completionRate')?.textContent = totalServices > 0 ? 
            Math.round((totalCompleted / totalServices) * 100) + '%' : '0%';
        document.getElementById('totalEarnings')?.textContent = `$${totalEarnings}`;
        
    } catch (error) {
        console.error('Error loading provider stats:', error);
    }
}

/**
 * Update service status
 */
async function updateServiceStatus(serviceId, status) {
    try {
        await api.updateServiceStatus(serviceId, status);
        
        const statusText = status === 'working' ? 'accepted' : 
                          status === 'completed' ? 'completed' : status;
        
        appUtils.showNotification(`Service ${statusText} successfully`, 'success');
        
        // Reload services
        await loadProviderServices();
        const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab;
        if (activeTab) {
            await loadTabServices(activeTab);
        }
        
        // Reload stats
        await loadProviderStats();
        
    } catch (error) {
        console.error('Error updating service status:', error);
        appUtils.showNotification('Failed to update service status', 'error');
    }
}

/**
 * Reject service (placeholder)
 */
function rejectService(serviceId) {
    if (confirm('Are you sure you want to reject this service?')) {
        appUtils.showNotification('Service rejected', 'info');
        // This would call an API endpoint to reject the service
    }
}

/**
 * Contact client (placeholder)
 */
function contactClient(serviceId) {
    appUtils.showNotification('Opening chat with client', 'info');
}

/**
 * View service details (placeholder)
 */
function viewServiceDetails(serviceId) {
    window.location.href = `service-detail.html?id=${serviceId}`;
}

/**
 * Create invoice (placeholder)
 */
function createInvoice(serviceId) {
    appUtils.showNotification('Creating invoice', 'info');
}