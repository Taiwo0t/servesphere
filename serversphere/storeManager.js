// Store Manager System

const ORDER_STORAGE_KEY = 'allOrders';
const FAVORITES_STORAGE_PREFIX = 'favoriteStores';
const COMPLETED_ORDER_SEEN_PREFIX = 'seenCompletedOrders';
let showFavoriteStoresOnly = false;
let storeSearchTerm = '';
let activeFilterSort = null; // Track which filter/sort is active

// Load user profile from localStorage
function loadUserProfile() {
    const userData = localStorage.getItem('serversphereUser');
    const userProfileSection = document.getElementById('userProfileSection');
    const signInPrompt = document.getElementById('signInPrompt');
    const profileNameSidebar = document.getElementById('profileNameSidebar');
    const profileEmailSidebar = document.getElementById('profileEmailSidebar');
    const profileAvatarSidebar = document.getElementById('profileAvatarSidebar');
    const logoutSection = document.getElementById('logoutSection');
    const sellerDashboardSection = document.getElementById('sellerDashboardSection');
    const sellerDashboardLink = document.getElementById('sellerDashboardLink');
    const headerSellerDashboardBtn = document.getElementById('headerSellerDashboardBtn');
    const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');

    if (userData) {
        const user = JSON.parse(userData);
        const sellerStore = getSellerStoreForUser(user);
        
        // Show profile section
        if (userProfileSection) userProfileSection.style.display = 'block';
        if (signInPrompt) signInPrompt.style.display = 'none';
        if (logoutSection) logoutSection.style.display = 'block';
        if (sellerDashboardSection) sellerDashboardSection.style.display = sellerStore ? 'block' : 'none';
        if (sellerDashboardLink && sellerStore) {
            sellerDashboardLink.href = `owner-dashboard.html?storeId=${sellerStore.id}`;
        }
        if (headerSellerDashboardBtn) {
            if (sellerStore) {
                headerSellerDashboardBtn.style.display = 'inline-flex';
                headerSellerDashboardBtn.href = `owner-dashboard.html?storeId=${sellerStore.id}`;
            } else {
                headerSellerDashboardBtn.style.display = 'none';
            }
        }

        // Update profile information
        if (profileNameSidebar) profileNameSidebar.textContent = user.name;
        if (profileEmailSidebar) profileEmailSidebar.textContent = user.email;

        // Set avatar with first letter
        if (profileAvatarSidebar) {
            const firstLetter = user.name.charAt(0).toUpperCase();
            profileAvatarSidebar.textContent = firstLetter;
            profileAvatarSidebar.style.backgroundColor = generateColorFromName(user.name);
        }

        // Setup logout button
        if (sidebarLogoutBtn) {
            sidebarLogoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                if (confirm('Are you sure you want to sign out?')) {
                    localStorage.removeItem('serversphereUser');
                    window.location.href = 'foodpage.html';
                }
            });
        }
    } else {
        // Show sign in prompt
        if (userProfileSection) userProfileSection.style.display = 'none';
        if (signInPrompt) signInPrompt.style.display = 'block';
        if (logoutSection) logoutSection.style.display = 'none';
        if (sellerDashboardSection) sellerDashboardSection.style.display = 'none';
        if (headerSellerDashboardBtn) headerSellerDashboardBtn.style.display = 'none';
    }
}

function getSellerStoreForUser(user) {
    if (!user) {
        return null;
    }

    const stores = JSON.parse(localStorage.getItem('foodStores')) || [];
    const userEmail = (user.email || '').trim().toLowerCase();

    if (userEmail) {
        const matchedStore = stores.find(store => (store.email || '').trim().toLowerCase() === userEmail);
        if (matchedStore) {
            return matchedStore;
        }
    }

    const ownerStoreId = parseInt(sessionStorage.getItem('ownerStoreId') || localStorage.getItem('ownerStoreId'), 10);
    if (Number.isInteger(ownerStoreId)) {
        return stores.find(store => store.id === ownerStoreId) || null;
    }

    return null;
}

function getFavoritesStorageKey() {
    const user = getSignedInUser();
    const userScope = user?.email ? user.email.trim().toLowerCase() : 'guest';
    return `${FAVORITES_STORAGE_PREFIX}:${userScope}`;
}

function getFavoriteStoreIds() {
    try {
        const storedFavorites = JSON.parse(localStorage.getItem(getFavoritesStorageKey())) || [];
        return Array.isArray(storedFavorites)
            ? storedFavorites.map(id => Number(id)).filter(Number.isInteger)
            : [];
    } catch (error) {
        console.warn('Unable to read favorites.', error);
        return [];
    }
}

function saveFavoriteStoreIds(favoriteStoreIds) {
    localStorage.setItem(getFavoritesStorageKey(), JSON.stringify(favoriteStoreIds));
}

function isFavoriteStore(storeId) {
    return getFavoriteStoreIds().includes(Number(storeId));
}

function toggleFavoriteStore(storeId) {
    const numericStoreId = Number(storeId);
    const favoriteStoreIds = getFavoriteStoreIds();
    const updatedFavorites = favoriteStoreIds.includes(numericStoreId)
        ? favoriteStoreIds.filter(id => id !== numericStoreId)
        : [...favoriteStoreIds, numericStoreId];

    saveFavoriteStoreIds(updatedFavorites);
    updateFavoritesButtonState();
    refreshFoodPageStores();
}

function updateFavoritesButtonState() {
    const favoritesToggleBtn = document.getElementById('favoritesToggleBtn');
    const favoritesCountBadge = document.getElementById('favoritesCountBadge');
    const favoriteCount = getFavoriteStoreIds().length;

    if (favoritesToggleBtn) {
        favoritesToggleBtn.classList.toggle('active', showFavoriteStoresOnly);
        favoritesToggleBtn.setAttribute('aria-label', showFavoriteStoresOnly ? 'Show all stores' : 'Show favorite stores');
    }

    if (favoritesCountBadge) {
        if (favoriteCount > 0) {
            favoritesCountBadge.textContent = favoriteCount > 99 ? '99+' : String(favoriteCount);
            favoritesCountBadge.style.display = 'inline-block';
        } else {
            favoritesCountBadge.style.display = 'none';
        }
    }
}

function getVisibleStores(stores) {
    let visibleStores = stores;

    // Filter by category if we're on a browsing page
    const category = window.currentCategory;
    if (category) {
        visibleStores = visibleStores.filter(store => {
            const storeType = store.type || 'Food';
            return storeType.toLowerCase() === category.toLowerCase();
        });
    }

    if (showFavoriteStoresOnly) {
        const favoriteStoreIds = getFavoriteStoreIds();
        visibleStores = visibleStores.filter(store => favoriteStoreIds.includes(Number(store.id)));
    }

    if (storeSearchTerm) {
        const normalizedSearch = storeSearchTerm.toLowerCase();
        visibleStores = visibleStores.filter(store => (store.name || '').toLowerCase().includes(normalizedSearch));
    }

    // Apply active filter/sort
    if (activeFilterSort === 'price') {
        // Sort by lowest delivery cost (assuming cheaper stores have lower ratings or we could add a price field)
        visibleStores = visibleStores.sort((a, b) => {
            const aPrice = a.estimatedPrice || 0;
            const bPrice = b.estimatedPrice || 0;
            return aPrice - bPrice;
        });
    } else if (activeFilterSort === 'rating') {
        // Sort by highest rating first
        visibleStores = visibleStores.sort((a, b) => {
            const aRating = a.rating || 4.5;
            const bRating = b.rating || 4.5;
            return bRating - aRating;
        });
    } else if (activeFilterSort === 'delivery') {
        // Sort by fastest delivery time
        visibleStores = visibleStores.sort((a, b) => {
            const aTime = parseDeliveryMinutes(a.deliveryTime || '30-45 mins');
            const bTime = parseDeliveryMinutes(b.deliveryTime || '30-45 mins');
            return aTime - bTime;
        });
    } else if (activeFilterSort === 'open') {
        // Filter to only open stores
        visibleStores = visibleStores.filter(store => store.isOpen === true);
    } else if (activeFilterSort === 'location') {
        // Basic location sort (could be enhanced with geolocation)
        // For now, just ensure stores with addresses are shown first
        visibleStores = visibleStores.sort((a, b) => {
            const hasAddrA = (a.address || '').length > 0 ? 0 : 1;
            const hasAddrB = (b.address || '').length > 0 ? 0 : 1;
            return hasAddrA - hasAddrB;
        });
    }

    return visibleStores;
}

function parseDeliveryMinutes(deliveryTime) {
    if (!deliveryTime) return 45;
    const match = deliveryTime.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 45;
}

function updateSearchStatus(visibleCount) {
    const statusElement = document.getElementById('storeSearchStatus');
    if (!statusElement) {
        return;
    }

    if (!storeSearchTerm) {
        statusElement.style.display = 'none';
        statusElement.textContent = '';
        return;
    }

    statusElement.style.display = 'block';
    statusElement.textContent = `Search completed: ${visibleCount} store${visibleCount === 1 ? '' : 's'} found for "${storeSearchTerm}".`;
}

function refreshFoodPageStores() {
    const stores = JSON.parse(localStorage.getItem('foodStores')) || [];
    
    // If we're on a browsing page with a specific category, filter by that category
    const category = window.currentCategory;
    if (category) {
        const filteredStores = stores.filter(store => {
            const storeType = store.type || 'Food';
            return storeType.toLowerCase() === category.toLowerCase();
        });
        displayStores(filteredStores);
    } else {
        // If no category specified, show all stores (for foodpage.html)
        displayStores(stores);
    }
}

function setupStoreSearch() {
    const searchInput = document.getElementById('storeSearchInput');
    const searchButton = document.getElementById('storeSearchBtn');

    if (!searchInput || !searchButton || searchInput.dataset.bound === 'true') {
        return;
    }

    const applySearch = () => {
        storeSearchTerm = searchInput.value.trim();
        refreshFoodPageStores();
    };

    searchInput.dataset.bound = 'true';
    searchInput.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            applySearch();
        }
    });
    searchButton.addEventListener('click', applySearch);
}

function setupFavoritesToggle() {
    const favoritesToggleBtn = document.getElementById('favoritesToggleBtn');

    if (!favoritesToggleBtn || favoritesToggleBtn.dataset.bound === 'true') {
        updateFavoritesButtonState();
        return;
    }

    favoritesToggleBtn.dataset.bound = 'true';
    favoritesToggleBtn.addEventListener('click', () => {
        showFavoriteStoresOnly = !showFavoriteStoresOnly;
        updateFavoritesButtonState();
        refreshFoodPageStores();
    });

    updateFavoritesButtonState();
}

function setupStoreFilters() {
    const filterButtons = {
        'filterLocation': 'location',
        'filterPrice': 'price',
        'filterRating': 'rating',
        'filterDelivery': 'delivery',
        'filterOpen': 'open'
    };

    for (const [btnId, filterType] of Object.entries(filterButtons)) {
        const btn = document.getElementById(btnId);
        if (!btn || btn.dataset.bound === 'true') continue;

        btn.dataset.bound = 'true';

        btn.addEventListener('click', () => {
            // Toggle filter off if clicking the same one
            if (activeFilterSort === filterType) {
                activeFilterSort = null;
                btn.classList.remove('active');
            } else {
                // Remove active class from all filter buttons
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                // Set new active filter
                activeFilterSort = filterType;
                btn.classList.add('active');
            }
            refreshFoodPageStores();
        });
    }
}

// Generate a color based on user name for avatar
function generateColorFromName(name) {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

// Initialize stores from localStorage
function initializeStores() {
    const stores = JSON.parse(localStorage.getItem('foodStores')) || [];
    setupFavoritesToggle();
    setupStoreSearch();
    setupStoreFilters();
    displayStores(stores);
    updateFoodPageCartSummary();
    setupFoodPageCheckout();
    setupMyOrdersView();
    
    // Setup real-time updates listener
    window.addEventListener('storesUpdated', function() {
        const updatedStores = JSON.parse(localStorage.getItem('foodStores')) || [];
        displayStores(updatedStores);
        updateFoodPageCartSummary();
    });
    
    // Listen for storage changes from other tabs
    window.addEventListener('storage', function(e) {
        if (e.key === 'foodStores') {
            const updatedStores = JSON.parse(e.newValue) || [];
            displayStores(updatedStores);
        }

        if (!e.key || e.key === 'foodStores' || e.key.startsWith('cart_')) {
            updateFoodPageCartSummary();
        }

        if (!e.key || e.key === ORDER_STORAGE_KEY) {
            renderMyOrders();
            updateMyOrdersNotificationBadge();
        }
    });

    window.addEventListener('focus', updateFoodPageCartSummary);
    window.addEventListener('focus', () => {
        updateFavoritesButtonState();
        refreshFoodPageStores();
        renderMyOrders();
        updateMyOrdersNotificationBadge();
    });
}

// Initialize browsing page with category filtering
function initializeBrowsingPage(category) {
    const allStores = JSON.parse(localStorage.getItem('foodStores')) || [];
    
    // Filter stores by category (type field matches the category)
    const filteredStores = allStores.filter(store => {
        const storeType = store.type || 'Food';
        return storeType.toLowerCase() === category.toLowerCase();
    });
    
    setupFavoritesToggle();
    setupStoreSearch();
    setupStoreFilters();
    displayStores(filteredStores);
    updateFoodPageCartSummary();
    setupFoodPageCheckout();
    setupMyOrdersView();
    
    // Setup real-time updates listener with category filtering
    window.addEventListener('storesUpdated', function() {
        const updatedAllStores = JSON.parse(localStorage.getItem('foodStores')) || [];
        const categoryFiltered = updatedAllStores.filter(store => {
            const storeType = store.type || 'Food';
            return storeType.toLowerCase() === category.toLowerCase();
        });
        displayStores(categoryFiltered);
        updateFoodPageCartSummary();
    });
    
    // Listen for storage changes from other tabs (with category filtering)
    window.addEventListener('storage', function(e) {
        if (e.key === 'foodStores') {
            const updatedAllStores = JSON.parse(e.newValue) || [];
            const categoryFiltered = updatedAllStores.filter(store => {
                const storeType = store.type || 'Food';
                return storeType.toLowerCase() === category.toLowerCase();
            });
            displayStores(categoryFiltered);
        }

        if (!e.key || e.key === 'foodStores' || e.key.startsWith('cart_')) {
            updateFoodPageCartSummary();
        }

        if (!e.key || e.key === ORDER_STORAGE_KEY) {
            renderMyOrders();
            updateMyOrdersNotificationBadge();
        }
    });

    window.addEventListener('focus', updateFoodPageCartSummary);
    window.addEventListener('focus', () => {
        updateFavoritesButtonState();
        refreshFoodPageStores();
        renderMyOrders();
        updateMyOrdersNotificationBadge();
    });
}

function getSignedInUser() {
    try {
        return JSON.parse(localStorage.getItem('serversphereUser')) || null;
    } catch (error) {
        console.warn('Unable to parse signed in user data.', error);
        return null;
    }
}

function getStoreById(storeId) {
    const stores = JSON.parse(localStorage.getItem('foodStores')) || [];
    return stores.find(store => store.id === storeId) || null;
}

function getCartEntries() {
    const cartEntries = [];

    for (let index = 0; index < localStorage.length; index++) {
        const key = localStorage.key(index);

        if (!key || !key.startsWith('cart_')) {
            continue;
        }

        const storeId = parseInt(key.replace('cart_', ''), 10);
        if (!Number.isInteger(storeId)) {
            continue;
        }

        try {
            const items = JSON.parse(localStorage.getItem(key)) || [];
            if (!Array.isArray(items) || items.length === 0) {
                continue;
            }

            const store = getStoreById(storeId);
            const itemCount = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
            const total = items.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 0)), 0);

            cartEntries.push({
                cartKey: key,
                storeId,
                storeName: store ? store.name : `Store #${storeId}`,
                items,
                itemCount,
                total
            });
        } catch (error) {
            console.warn('Unable to parse cart entry:', key, error);
        }
    }

    return cartEntries;
}

function getFoodPageCartSummary() {
    const cartEntries = getCartEntries();
    return cartEntries.reduce((summary, entry) => {
        summary.itemCount += entry.itemCount;
        summary.totalAmount += entry.total;
        return summary;
    }, { itemCount: 0, totalAmount: 0 });
}

function updateFoodPageCartSummary() {
    const countElement = document.getElementById('cartSummaryCount');
    const totalElement = document.getElementById('cartSummaryTotal');
    const messageElement = document.getElementById('cartSummaryMessage');
    const checkoutButton = document.getElementById('openCheckoutBtn');
    const headerCartBadge = document.getElementById('headerCartBadge');
    const headerCartButton = document.getElementById('headerCartBtn');

    if (!countElement || !totalElement || !messageElement) {
        return;
    }

    const summary = getFoodPageCartSummary();
    countElement.textContent = summary.itemCount;
    totalElement.textContent = `$${summary.totalAmount.toFixed(2)}`;
    if (checkoutButton) {
        checkoutButton.disabled = summary.itemCount === 0;
    }
    if (headerCartButton) {
        headerCartButton.disabled = summary.itemCount === 0;
        headerCartButton.setAttribute('aria-label', summary.itemCount > 0
            ? `Open checkout with ${summary.itemCount} items`
            : 'Cart is empty');
    }
    if (headerCartBadge) {
        if (summary.itemCount > 0) {
            headerCartBadge.textContent = summary.itemCount > 99 ? '99+' : String(summary.itemCount);
            headerCartBadge.style.display = 'inline-block';
        } else {
            headerCartBadge.style.display = 'none';
        }
    }

    if (summary.itemCount > 0) {
        messageElement.textContent = `You currently have ${summary.itemCount} item${summary.itemCount === 1 ? '' : 's'} waiting across your carts.`;
    } else {
        const activeCategory = (window.currentCategory || 'food').toLowerCase();
        const categoryItemLabel = activeCategory === 'food' ? 'meals' : 'items';
        messageElement.textContent = `No items in cart yet. Start adding ${categoryItemLabel} from your favorite stores.`;
    }
}

function getDefaultCheckoutDetails() {
    const user = getSignedInUser();
    return {
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: user?.address || ''
    };
}

function getCurrentUserOrders() {
    const user = getSignedInUser();
    if (!user?.email) {
        return [];
    }

    const allOrders = JSON.parse(localStorage.getItem(ORDER_STORAGE_KEY)) || [];
    const userEmail = user.email.trim().toLowerCase();
    return allOrders
        .filter(order => (order.customerEmail || '').trim().toLowerCase() === userEmail)
        .sort((left, right) => new Date(right.createdAt || right.date) - new Date(left.createdAt || left.date));
}

function getCompletedOrdersSeenStorageKey() {
    const user = getSignedInUser();
    const userScope = user?.email ? user.email.trim().toLowerCase() : 'guest';
    return `${COMPLETED_ORDER_SEEN_PREFIX}:${userScope}`;
}

function getSeenCompletedOrderIds() {
    try {
        const storedIds = JSON.parse(localStorage.getItem(getCompletedOrdersSeenStorageKey())) || [];
        return Array.isArray(storedIds)
            ? storedIds.map(id => Number(id)).filter(Number.isInteger)
            : [];
    } catch (error) {
        console.warn('Unable to read seen completed orders.', error);
        return [];
    }
}

function markCompletedOrdersSeen(orderIds) {
    const seenIds = new Set(getSeenCompletedOrderIds());
    orderIds.forEach(orderId => seenIds.add(Number(orderId)));
    localStorage.setItem(getCompletedOrdersSeenStorageKey(), JSON.stringify([...seenIds]));
}

function getUnseenCompletedOrders() {
    const seenIds = new Set(getSeenCompletedOrderIds());
    return getCurrentUserOrders().filter(order => order.status === 'completed' && !seenIds.has(Number(order.id)));
}

function updateMyOrdersNotificationBadge() {
    const badge = document.getElementById('myOrdersBadge');
    if (!badge) {
        return;
    }

    const unseenCount = getUnseenCompletedOrders().length;
    if (unseenCount > 0) {
        badge.textContent = unseenCount > 99 ? '99+' : String(unseenCount);
        badge.style.display = 'inline-flex';
    } else {
        badge.style.display = 'none';
    }
}

function renderMyOrders() {
    const myOrdersList = document.getElementById('myOrdersList');
    if (!myOrdersList) {
        return;
    }

    const user = getSignedInUser();
    if (!user?.email) {
        myOrdersList.innerHTML = '<div class="buyer-order-card"><p>Please sign in to view your orders.</p></div>';
        return;
    }

    const orders = getCurrentUserOrders();
    if (!orders.length) {
        myOrdersList.innerHTML = '<div class="buyer-order-card"><p>No orders yet. Place an order and its status will appear here.</p></div>';
        return;
    }

    myOrdersList.innerHTML = orders.map(order => {
        const itemsList = order.items.map(item => `${escapeHtml(item.name)} x${item.quantity}`).join(', ');
        const completedAtMarkup = order.completedAt
            ? `<div><strong>Completed:</strong> ${new Date(order.completedAt).toLocaleString()}</div>`
            : '';
        const noteMarkup = order.note
            ? `<div class="buyer-order-note"><strong>Note:</strong> ${escapeHtml(order.note)}</div>`
            : '';

        return `
            <article class="buyer-order-card">
                <div class="buyer-order-header">
                    <div>
                        <h3>${escapeHtml(order.storeName || 'Store Order')}</h3>
                        <div>Order #${order.id}</div>
                    </div>
                    <span class="order-status status-${order.status}">${String(order.status || 'pending').toUpperCase()}</span>
                </div>
                <div class="buyer-order-meta">
                    <div><strong>Items:</strong> ${itemsList}</div>
                    <div><strong>Total:</strong> $${Number(order.total || 0).toFixed(2)}</div>
                    <div><strong>Placed:</strong> ${new Date(order.date || order.createdAt).toLocaleString()}</div>
                    ${completedAtMarkup}
                    <div><strong>Delivery Address:</strong> ${escapeHtml(order.deliveryAddress || 'Not provided')}</div>
                </div>
                ${noteMarkup}
            </article>
        `;
    }).join('');
}

function openMyOrdersModal() {
    const modal = document.getElementById('myOrdersModal');
    if (!modal) {
        return;
    }

    const completedOrderIds = getCurrentUserOrders()
        .filter(order => order.status === 'completed')
        .map(order => order.id);
    markCompletedOrdersSeen(completedOrderIds);
    renderMyOrders();
    updateMyOrdersNotificationBadge();
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeMyOrdersModal() {
    const modal = document.getElementById('myOrdersModal');
    if (!modal) {
        return;
    }

    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function setupMyOrdersView() {
    const openButton = document.getElementById('openMyOrdersBtn');
    const modal = document.getElementById('myOrdersModal');
    const closeButton = document.getElementById('myOrdersModalClose');

    if (!openButton || !modal || !closeButton) {
        return;
    }

    if (openButton.dataset.bound === 'true') {
        return;
    }

    openButton.dataset.bound = 'true';
    openButton.addEventListener('click', openMyOrdersModal);
    closeButton.addEventListener('click', closeMyOrdersModal);
    modal.addEventListener('click', event => {
        if (event.target === modal) {
            closeMyOrdersModal();
        }
    });

    window.addEventListener('ordersUpdated', renderMyOrders);
    window.addEventListener('ordersUpdated', updateMyOrdersNotificationBadge);
    updateMyOrdersNotificationBadge();

    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'orders') {
        openMyOrdersModal();
    }
}

function createOrdersFromCartEntries(customerDetails, cartEntries = getCartEntries()) {
    if (!cartEntries.length) {
        throw new Error('Your cart is empty. Add some items before checkout.');
    }

    const existingOrders = JSON.parse(localStorage.getItem(ORDER_STORAGE_KEY)) || [];
    const timestamp = new Date().toISOString();
    const createdOrders = cartEntries.map((entry, index) => ({
        id: Date.now() + index,
        storeId: entry.storeId,
        storeName: entry.storeName,
        items: entry.items.map(item => ({
            id: item.id,
            name: item.name,
            price: Number(item.price) || 0,
            quantity: Number(item.quantity) || 0,
            image: item.image || ''
        })),
        total: entry.total,
        status: 'pending',
        date: timestamp,
        createdAt: timestamp,
        customerName: customerDetails.name,
        customerEmail: customerDetails.email,
        customerPhone: customerDetails.phone,
        deliveryAddress: customerDetails.address,
        note: customerDetails.note || ''
    }));

    localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify([...existingOrders, ...createdOrders]));

    cartEntries.forEach(entry => {
        localStorage.removeItem(entry.cartKey);
    });

    window.dispatchEvent(new Event('storesUpdated'));
    window.dispatchEvent(new Event('ordersUpdated'));

    return createdOrders;
}

function populateCheckoutFormDefaults() {
    const defaults = getDefaultCheckoutDetails();
    const nameInput = document.getElementById('checkoutName');
    const emailInput = document.getElementById('checkoutEmail');
    const phoneInput = document.getElementById('checkoutPhone');
    const addressInput = document.getElementById('checkoutAddress');

    if (nameInput) nameInput.value = defaults.name;
    if (emailInput) emailInput.value = defaults.email;
    if (phoneInput) phoneInput.value = defaults.phone;
    if (addressInput) addressInput.value = defaults.address;
}

function renderCheckoutSummary() {
    const checkoutStoreList = document.getElementById('checkoutStoreList');
    const summaryItems = document.getElementById('checkoutSummaryItems');
    const summaryAmount = document.getElementById('checkoutSummaryAmount');

    if (!checkoutStoreList || !summaryItems || !summaryAmount) {
        return;
    }

    const cartEntries = getCartEntries();
    const totals = cartEntries.reduce((summary, entry) => {
        summary.itemCount += entry.itemCount;
        summary.totalAmount += entry.total;
        return summary;
    }, { itemCount: 0, totalAmount: 0 });

    checkoutStoreList.innerHTML = '';

    if (!cartEntries.length) {
        checkoutStoreList.innerHTML = '<p class="checkout-store-items">No cart items available for checkout yet.</p>';
    } else {
        cartEntries.forEach(entry => {
            const card = document.createElement('article');
            card.className = 'checkout-store-card';
            const itemSummary = entry.items
                .map(item => `${escapeHtml(item.name)} x${Number(item.quantity) || 0}`)
                .join(', ');

            card.innerHTML = `
                <div class="checkout-store-card-header">
                    <div>
                        <h3>${escapeHtml(entry.storeName)}</h3>
                        <span class="checkout-store-count">${entry.itemCount} item${entry.itemCount === 1 ? '' : 's'}</span>
                    </div>
                    <span class="checkout-store-total">$${entry.total.toFixed(2)}</span>
                </div>
                <p class="checkout-store-items">${itemSummary}</p>
            `;

            checkoutStoreList.appendChild(card);
        });
    }

    summaryItems.textContent = totals.itemCount;
    summaryAmount.textContent = `$${totals.totalAmount.toFixed(2)}`;
}

function openCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    if (!modal || getFoodPageCartSummary().itemCount === 0) {
        return;
    }

    renderCheckoutSummary();
    populateCheckoutFormDefaults();
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    if (!modal) {
        return;
    }

    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function setupFoodPageCheckout() {
    const openButton = document.getElementById('openCheckoutBtn');
    const headerCartButton = document.getElementById('headerCartBtn');
    const headerProfileButton = document.getElementById('headerProfileBtn');
    const modal = document.getElementById('checkoutModal');
    const closeButton = document.getElementById('checkoutModalClose');
    const cancelButton = document.getElementById('cancelCheckoutBtn');
    const form = document.getElementById('checkoutForm');
    const submitButton = document.getElementById('submitCheckoutBtn');

    if (!openButton || !headerCartButton || !headerProfileButton || !modal || !closeButton || !cancelButton || !form || !submitButton) {
        return;
    }

    if (openButton.dataset.bound === 'true') {
        return;
    }

    openButton.dataset.bound = 'true';

    openButton.addEventListener('click', openCheckoutModal);
    headerCartButton.addEventListener('click', openCheckoutModal);
    headerProfileButton.addEventListener('click', () => {
        const isSignedIn = !!getSignedInUser();
        if (!isSignedIn) {
            window.location.href = 'signin.html';
            return;
        }

        const menuToggle = document.getElementById('menuToggle');
        if (menuToggle) {
            menuToggle.click();
        }
    });
    closeButton.addEventListener('click', closeCheckoutModal);
    cancelButton.addEventListener('click', closeCheckoutModal);

    modal.addEventListener('click', event => {
        if (event.target === modal) {
            closeCheckoutModal();
        }
    });

    form.addEventListener('submit', event => {
        event.preventDefault();

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const customerDetails = {
            name: document.getElementById('checkoutName').value.trim(),
            email: document.getElementById('checkoutEmail').value.trim(),
            phone: document.getElementById('checkoutPhone').value.trim(),
            address: document.getElementById('checkoutAddress').value.trim(),
            note: document.getElementById('checkoutNote').value.trim()
        };

        submitButton.disabled = true;
        submitButton.textContent = 'Placing Order...';

        try {
            const orders = createOrdersFromCartEntries(customerDetails);
            closeCheckoutModal();
            updateFoodPageCartSummary();
            alert(`Order placed successfully! ${orders.length} order${orders.length === 1 ? '' : 's'} sent to the store owners.`);
        } catch (error) {
            alert(error.message || 'Unable to place your order right now.');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Place Order';
        }
    });
}

let isCreatingStore = false;

function setCreateStoreState(isSubmitting) {
    const createBtn = document.getElementById('createStoreBtn');
    isCreatingStore = isSubmitting;

    if (createBtn) {
        createBtn.disabled = isSubmitting;
        createBtn.textContent = isSubmitting ? 'Creating Store...' : 'Create Store';
    }
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = event => resolve(event.target.result);
        reader.onerror = () => reject(new Error('Unable to read the selected image file.'));

        reader.readAsDataURL(file);
    });
}

function loadImage(dataUrl) {
    return new Promise((resolve, reject) => {
        const image = new Image();

        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Unable to process the selected image.'));

        image.src = dataUrl;
    });
}

async function compressImageFile(file) {
    const originalDataUrl = await readFileAsDataUrl(file);
    const image = await loadImage(originalDataUrl);
    const maxDimension = 1200;
    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
    const targetWidth = Math.max(1, Math.round(image.width * scale));
    const targetHeight = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
        return originalDataUrl;
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    context.drawImage(image, 0, 0, targetWidth, targetHeight);

    return canvas.toDataURL('image/jpeg', 0.82);
}

function isStorageQuotaError(error) {
    return error && (
        error.name === 'QuotaExceededError' ||
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        error.code === 22 ||
        error.code === 1014
    );
}

// Add event listener for Create Store button
function setupFormListener() {
    const sellerForm = document.getElementById('sellerForm');
    const createBtn = document.getElementById('createStoreBtn');

    if (sellerForm) {
        sellerForm.addEventListener('submit', handleCreateStore);
    }

    if (createBtn && !sellerForm) {
        createBtn.addEventListener('click', handleCreateStore);
    }
}

// Handle Create Store button click
async function handleCreateStore(event) {
    if (event) {
        event.preventDefault();
    }

    if (isCreatingStore) {
        return;
    }

    const sellerForm = document.getElementById('sellerForm');
    const businessName = document.getElementById('businessName').value.trim();
    const businessEmail = document.getElementById('businessEmail').value.trim();
    const businessAddress = document.getElementById('businessAddress').value.trim();
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const storeType = document.getElementById('storeType').value.trim();
    const deliveryTime = document.getElementById('deliveryTime').value.trim();
    const isOpen = document.getElementById('isOpen').checked;
    const storeImageInput = document.getElementById('storeImage');

    if (sellerForm && !sellerForm.checkValidity()) {
        sellerForm.reportValidity();
        return;
    }

    // Validate all fields are filled
    if (!businessName) {
        alert('Please enter Business Name');
        return;
    }
    if (!businessEmail) {
        alert('Please enter Business Email');
        return;
    }
    if (!businessAddress) {
        alert('Please enter Business Address');
        return;
    }
    if (!phoneNumber) {
        alert('Please enter Phone Number');
        return;
    }
    if (!storeType) {
        alert('Please select a Store Type');
        return;
    }
    if (!deliveryTime) {
        alert('Please enter Delivery Time');
        return;
    }
    if (!storeImageInput.files || !storeImageInput.files[0]) {
        alert('Please upload a store image');
        return;
    }

    const imageFile = storeImageInput.files[0];
    setCreateStoreState(true);

    try {
        const imageData = await compressImageFile(imageFile);

        // Create store object with new fields
        const newStore = {
            id: Date.now(),
            name: businessName,
            email: businessEmail,
            address: businessAddress,
            phone: phoneNumber,
            type: storeType,
            image: imageData,
            rating: 4.5,
            deliveryTime: deliveryTime,
            isOpen: isOpen,
            createdAt: new Date().toLocaleDateString(),
            menu: []
        };

        // Get existing stores
        const stores = JSON.parse(localStorage.getItem('foodStores')) || [];

        // Add new store
        stores.push(newStore);

        // Save to localStorage
        localStorage.setItem('foodStores', JSON.stringify(stores));

        // Store the new store ID so the dashboard can always resolve the latest store.
        sessionStorage.setItem('ownerStoreId', newStore.id.toString());
        localStorage.setItem('ownerStoreId', newStore.id.toString());

        // Trigger storage event to update other pages
        window.dispatchEvent(new Event('storesUpdated'));

        // Clear form
        if (sellerForm) {
            sellerForm.reset();
        }

        window.location.assign(`owner-dashboard.html?storeId=${newStore.id}`);
    } catch (error) {
        console.error('Error creating store:', error);

        if (isStorageQuotaError(error)) {
            alert('The selected image is too large to save. Try a smaller image and then create the store again.');
        } else {
            alert(error.message || 'Unable to create store right now. Please try again.');
        }

        setCreateStoreState(false);
    }
}

// Display stores on the food page
function displayStores(stores) {
    const storesGrid = document.getElementById('storesGrid');
    const noStoresMessage = document.getElementById('noStoresMessage');

    if (!storesGrid) return; // Not on food page

    const visibleStores = getVisibleStores(stores);
    updateSearchStatus(visibleStores.length);

    // Clear existing stores
    storesGrid.innerHTML = '';

    if (visibleStores.length === 0) {
        noStoresMessage.style.display = 'block';
        if (storeSearchTerm) {
            noStoresMessage.innerHTML = `<p>No stores found for "${escapeHtml(storeSearchTerm)}".</p>`;
        } else if (showFavoriteStoresOnly) {
            noStoresMessage.innerHTML = '<p>No favorite stores yet. Tap the heart on a store card to save it here.</p>';
        } else {
            noStoresMessage.innerHTML = '<p>No stores available yet. Check back soon!</p>';
        }
        return;
    }

    noStoresMessage.style.display = 'none';

    // Add each store to the grid
    visibleStores.forEach(store => {
        const storeCard = document.createElement('div');
        storeCard.className = 'store-card';
        const favoriteButtonLabel = isFavoriteStore(store.id) ? 'Remove from favorites' : 'Add to favorites';
        const favoriteButtonClass = isFavoriteStore(store.id) ? 'store-favorite-btn active' : 'store-favorite-btn';
        const imageHTML = store.image ? `<img src="${store.image}" alt="${escapeHtml(store.name)}" class="store-image">` : '<div class="store-image-placeholder">No Image</div>';
        
        // Format delivery time
        const deliveryTime = store.deliveryTime || '30-45 mins';
        
        // Open status badge
        const statusClass = store.isOpen ? 'status-open' : 'status-closed';
        const statusText = store.isOpen ? 'Open' : 'Closed';
        
        // Rating display
        const rating = store.rating || 4.5;
        const ratingStars = '★'.repeat(Math.floor(rating)) + (rating % 1 !== 0 ? '☆' : '');
        
        storeCard.innerHTML = `
            <button class="${favoriteButtonClass}" data-store-id="${store.id}" aria-label="${favoriteButtonLabel}" title="${favoriteButtonLabel}">♥</button>
            ${imageHTML}
            <div class="store-info">
                <div class="store-header">
                    <div class="store-title-section">
                        <h3>${escapeHtml(store.name)}</h3>
                        <span class="store-type">${escapeHtml(store.type)}</span>
                    </div>
                    <span class="store-status ${statusClass}">${statusText}</span>
                </div>
                
                <div class="store-rating">
                    <span class="stars">${ratingStars}</span>
                    <span class="rating-number">${rating.toFixed(1)}</span>
                </div>
                
                <div class="store-details">
                    <p class="detail-item">📍 ${escapeHtml(store.address)}</p>
                    <p class="detail-item">⏱️ ${escapeHtml(deliveryTime)}</p>
                </div>
                
                <div class="store-footer">
                    <button class="view-menu-btn">View Menu</button>
                </div>
            </div>
        `;
        
        // Add click handler to route to store detail page
        storeCard.addEventListener('click', function() {
            window.location.href = `store.html?id=${store.id}`;
        });

        const favoriteButton = storeCard.querySelector('.store-favorite-btn');
        if (favoriteButton) {
            favoriteButton.addEventListener('click', function(event) {
                event.stopPropagation();
                toggleFavoriteStore(store.id);
            });
        }
        
        storesGrid.appendChild(storeCard);
    });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Run appropriate initialization based on current page
window.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded, initializing features...');
    
    // Load user profile on all pages
    loadUserProfile();

    // If on seller registration page, setup form listener
    if (document.getElementById('sellerForm')) {
        setupFormListener();
    }

    // If on food page, initialize and display stores.
    // Browsing pages set window.currentCategory and initialize themselves.
    if (document.getElementById('storesGrid') && !window.currentCategory) {
        initializeStores();
    }

    // Setup sidebar menu on food page
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        console.log('Found menu toggle, setting up sidebar...');
        // Use a small timeout to ensure all DOM elements are ready
        setTimeout(function() {
            setupSidebarMenu();
            console.log('Sidebar setup complete');
        }, 100);
    } else {
        console.log('Menu toggle not found on this page');
    }
});

// Sidebar Menu Functions
function setupSidebarMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const closeMenu = document.getElementById('closeMenu');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    // Check if required elements exist
    if (!menuToggle || !closeMenu || !sidebar || !sidebarOverlay) {
        console.error('Sidebar elements not found');
        return;
    }

    // Open sidebar when menu button is clicked
    menuToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        sidebar.classList.add('active');
        sidebarOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    // Close sidebar when close button is clicked
    closeMenu.addEventListener('click', function(e) {
        e.stopPropagation();
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    });

    // Close sidebar when overlay is clicked
    sidebarOverlay.addEventListener('click', function() {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    });

    // Close sidebar when a menu item is clicked
    const menuItems = document.querySelectorAll('.sidebar-content a, .sidebar-content button');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    });
}
