// ==================== OWNER DASHBOARD ====================

let currentStore = null;
let currentEditingProduct = null;
let allOrders = [];

function safeParseArray(key) {
    try {
        const parsed = JSON.parse(localStorage.getItem(key));
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.warn(`Invalid JSON in localStorage key: ${key}`, error);
        return [];
    }
}

function safeParseObject(key) {
    try {
        const parsed = JSON.parse(localStorage.getItem(key));
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
    } catch (error) {
        console.warn(`Invalid JSON in localStorage key: ${key}`, error);
        return null;
    }
}

function toNumber(value, fallback = 0) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
}

function isValidDateValue(value) {
    return !Number.isNaN(new Date(value).getTime());
}

// Get store ID from URL or session
function getStoreId() {
    const params = new URLSearchParams(window.location.search);
    const storeIdFromQuery = parseInt(params.get('storeId'), 10);
    if (Number.isInteger(storeIdFromQuery) && storeIdFromQuery > 0) {
        return storeIdFromQuery;
    }

    const storeIdFromSession = parseInt(sessionStorage.getItem('ownerStoreId'), 10);
    if (Number.isInteger(storeIdFromSession) && storeIdFromSession > 0) {
        return storeIdFromSession;
    }

    const storeIdFromLocal = parseInt(localStorage.getItem('ownerStoreId'), 10);
    if (Number.isInteger(storeIdFromLocal) && storeIdFromLocal > 0) {
        return storeIdFromLocal;
    }

    return null;
}

// Load current store
function loadCurrentStore() {
    try {
        const storeId = getStoreId();
        
        if (!storeId) {
            alert('Store not found. Please register first.');
            window.location.href = 'ssregister.html';
            return;
        }

        const stores = safeParseArray('foodStores');
        const store = stores.find(s => s.id === storeId);

        if (!store) {
            alert('Store not found. Please register first.');
            window.location.href = 'ssregister.html';
            return;
        }

        currentStore = store;
        console.log('Current store loaded:', currentStore.name);
        
        loadDashboardUserProfile();
        console.log('User profile loaded');
        
        displayDashboardInfo();
        console.log('Dashboard info displayed');
        
        setupEventListeners();
        console.log('Event listeners setup completed');
    } catch (error) {
        console.error('Error in loadCurrentStore:', error);
    }
}

// Load and display user profile in dashboard
function loadDashboardUserProfile() {
    const userData = safeParseObject('serversphereUser');
    
    if (userData) {
        // Set owner name
        const ownerNameEl = document.getElementById('ownerName');
        if (ownerNameEl) {
            ownerNameEl.textContent = userData.name || 'Owner';
        }
        
        // Set owner email
        const ownerEmailEl = document.getElementById('ownerEmail');
        if (ownerEmailEl) {
            ownerEmailEl.textContent = userData.email || 'No email available';
        }
        
        // Set avatar with first letter
        const avatarEl = document.getElementById('profileAvatar');
        if (avatarEl) {
            const firstLetter = (userData.name || 'O').charAt(0).toUpperCase();
            avatarEl.textContent = firstLetter;
        }
    }
}

// Display dashboard information
function displayDashboardInfo() {
    if (!currentStore || typeof currentStore !== 'object') {
        return;
    }

    // Store header card info
    const storeNameDisplay = document.getElementById('storeNameDisplay');
    const storeAddressDisplay = document.getElementById('storeAddressDisplay');
    const storeDeliveryDisplay = document.getElementById('storeDeliveryDisplay');

    if (storeNameDisplay) storeNameDisplay.textContent = currentStore.name || 'Store Name';
    if (storeAddressDisplay) storeAddressDisplay.textContent = currentStore.address || 'Address not set';
    if (storeDeliveryDisplay) storeDeliveryDisplay.textContent = currentStore.deliveryTime || '30-45 mins';
    
    // Store image
    if (currentStore.image) {
        const storeHeaderImage = document.getElementById('storeHeaderImage');
        if (storeHeaderImage) {
            storeHeaderImage.style.backgroundImage = `url('${currentStore.image}')`;
        }
    }
    
    // Store rating
    const rating = toNumber(currentStore.rating, 4.5);
    const storeRatingValue = document.getElementById('storeRatingValue');
    const storeStars = document.getElementById('storeStars');
    if (storeRatingValue) storeRatingValue.textContent = rating.toFixed(1);
    if (storeStars) storeStars.textContent = getStarRating(rating);
    
    // Store status badge
    const statusBadge = document.getElementById('storeStatusBadge');
    if (statusBadge) {
        const isOpen = currentStore.isOpen !== false;
        statusBadge.textContent = isOpen ? 'OPEN' : 'CLOSED';
        statusBadge.className = `store-status-badge ${isOpen ? '' : 'closed'}`;
    }

    // Calculate stats
    const totalItems = getTotalMenuItems();
    const totalMenuItemsEl = document.getElementById('totalMenuItems');
    if (totalMenuItemsEl) totalMenuItemsEl.textContent = String(totalItems);

    // Calculate orders and revenue
    const orders = getStoreOrders();
    allOrders = orders;
    
    // Get today's date
    const today = new Date().toDateString();
    const ordersToday = orders.filter(order => {
        const dateValue = order?.date || order?.createdAt;
        return dateValue && isValidDateValue(dateValue) && new Date(dateValue).toDateString() === today;
    });
    const earningsToday = ordersToday.reduce((sum, order) => sum + toNumber(order?.total, 0), 0);
    const totalEarnings = orders.reduce((sum, order) => sum + toNumber(order?.total, 0), 0);

    const ordersTodayEl = document.getElementById('ordersToday');
    const ordersTodayLabelEl = document.getElementById('ordersTodayLabel');
    const earningsTodayEl = document.getElementById('earningsToday');
    const totalEarningsEl = document.getElementById('totalEarnings');
    if (ordersTodayEl) ordersTodayEl.textContent = String(ordersToday.length);
    if (ordersTodayLabelEl) {
        ordersTodayLabelEl.textContent = ordersToday.length === 0 ? 'No orders today yet' : 'vs yesterday';
    }
    if (earningsTodayEl) earningsTodayEl.textContent = `$${earningsToday.toFixed(2)}`;
    if (totalEarningsEl) totalEarningsEl.textContent = `$${totalEarnings.toFixed(2)}`;

    // Populate form with current store data
    populateStoreSettingsForm();
    populateCategoriesList();
    populateCategoryFilterTabs();
    populateMenuItemsTable();
    populateOrdersList('all');
}

// Get star rating display
function getStarRating(rating) {
    const stars = Math.round(rating);
    let starDisplay = '';
    for (let i = 1; i <= 5; i++) {
        starDisplay += i <= stars ? '★' : '☆';
    }
    return starDisplay;
}

// Get total menu items
function getTotalMenuItems() {
    if (!Array.isArray(currentStore?.menu)) return 0;
    return currentStore.menu.reduce((total, cat) => total + (Array.isArray(cat?.items) ? cat.items.length : 0), 0);
}

// Get orders for this store
function getStoreOrders() {
    const storedOrders = safeParseArray('allOrders');
    if (!currentStore || typeof currentStore.id === 'undefined') return [];
    return storedOrders.filter(order => order && order.storeId === currentStore.id);
}

// Populate store settings form
function populateStoreSettingsForm() {
    const settingsStoreName = document.getElementById('settingsStoreName');
    const settingsStoreType = document.getElementById('settingsStoreType');
    const settingsAddress = document.getElementById('settingsAddress');
    const settingsPhone = document.getElementById('settingsPhone');
    const settingsDeliveryTime = document.getElementById('settingsDeliveryTime');
    const settingsIsOpen = document.getElementById('settingsIsOpen');

    if (settingsStoreName) settingsStoreName.value = currentStore.name || '';
    if (settingsStoreType) settingsStoreType.value = currentStore.type || '';
    if (settingsAddress) settingsAddress.value = currentStore.address || '';
    if (settingsPhone) settingsPhone.value = currentStore.phone || '';
    if (settingsDeliveryTime) settingsDeliveryTime.value = currentStore.deliveryTime || '';
    if (settingsIsOpen) settingsIsOpen.checked = currentStore.isOpen !== false;
}

// Setup event listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // IMPORTANT: Tab navigation - attach first to ensure it always works
    const navLinks = document.querySelectorAll('.nav-link');
    console.log('Found nav-links:', navLinks.length);
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = link.dataset.tab;
            console.log('Clicked nav-link, switching to tab:', tabName);
            switchTab(tabName);
        });
    });
    
    console.log('Event listeners set up successfully');

    // Store settings form
    const storeSettingsForm = document.getElementById('storeSettingsForm');
    if (storeSettingsForm) {
        storeSettingsForm.addEventListener('submit', handleSaveStoreSettings);
    }

    // Add category button
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    if (addCategoryBtn) addCategoryBtn.addEventListener('click', openCategoryModal);
    
    const categoryModalClose = document.getElementById('categoryModalClose');
    if (categoryModalClose) categoryModalClose.addEventListener('click', closeCategoryModal);
    
    const categoryForm = document.getElementById('categoryForm');
    if (categoryForm) categoryForm.addEventListener('submit', handleAddCategory);

    // Add product button
    const addProductBtn = document.getElementById('addProductBtn');
    if (addProductBtn) addProductBtn.addEventListener('click', openProductModal);
    
    const productModalClose = document.getElementById('productModalClose');
    if (productModalClose) productModalClose.addEventListener('click', closeProductModal);
    
    const productModalClose2 = document.getElementById('productModalClose2');
    if (productModalClose2) productModalClose2.addEventListener('click', closeProductModal);
    
    const productForm = document.getElementById('productForm');
    if (productForm) productForm.addEventListener('submit', handleAddProduct);
    
    const productImage = document.getElementById('productImage');
    if (productImage) productImage.addEventListener('change', handleImagePreview);

    // Header buttons
    const viewStoreBtn = document.getElementById('viewStoreBtn');
    if (viewStoreBtn) {
        viewStoreBtn.addEventListener('click', () => {
            window.location.href = `store.html?id=${currentStore.id}`;
        });
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to sign out?')) {
                sessionStorage.removeItem('ownerStoreId');
                localStorage.removeItem('serversphereUser');
                window.location.href = 'servesphere.html';
            }
        });
    }

    // Order filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            populateOrdersList(e.target.dataset.status);
        });
    });
}

// Switch tab
function switchTab(tabName) {
    console.log('switchTab called with:', tabName);
    
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Show selected tab
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add('active');
        console.log('Tab switched to:', tabName);
    } else {
        console.error('Tab not found:', tabName);
        return;
    }

    // Update nav
    document.querySelectorAll('.nav-link').forEach(link => {
        const isActive = link.dataset.tab === tabName;
        link.classList.toggle('active', isActive);
    });

    // Refresh data when switching tabs
    if (tabName === 'products') {
        populateCategoryFilterTabs();
        populateMenuItemsTable();
    } else if (tabName === 'orders') {
        populateOrdersList('all');
    }
}

// ==================== STORE SETTINGS ====================

function handleSaveStoreSettings(e) {
    e.preventDefault();

    currentStore.name = document.getElementById('settingsStoreName').value.trim();
    currentStore.type = document.getElementById('settingsStoreType').value;
    currentStore.address = document.getElementById('settingsAddress').value.trim();
    currentStore.phone = document.getElementById('settingsPhone').value.trim();
    currentStore.deliveryTime = document.getElementById('settingsDeliveryTime').value.trim();
    currentStore.isOpen = document.getElementById('settingsIsOpen').checked;

    // Handle image upload
    const imageFile = document.getElementById('settingsImage').files[0];
    if (imageFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
            currentStore.image = e.target.result;
            saveStoreToLocalStorage();
            showNotification('Store settings updated successfully!', 'success');
        };
        reader.readAsDataURL(imageFile);
    } else {
        saveStoreToLocalStorage();
        showNotification('Store settings updated successfully!', 'success');
    }
}

// ==================== MENU MANAGEMENT ====================

function openCategoryModal() {
    document.getElementById('categoryModal').style.display = 'flex';
}

function closeCategoryModal() {
    document.getElementById('categoryModal').style.display = 'none';
    document.getElementById('categoryForm').reset();
}

function handleAddCategory(e) {
    e.preventDefault();

    if (!currentStore.menu) {
        currentStore.menu = [];
    }

    const categoryName = document.getElementById('categoryName').value.trim();
    const categoryDesc = document.getElementById('categoryDescription').value.trim();

    const newCategory = {
        id: Date.now(),
        name: categoryName,
        description: categoryDesc,
        items: []
    };

    currentStore.menu.push(newCategory);
    saveStoreToLocalStorage();

    closeCategoryModal();
    populateCategoriesList();
    populateProductCategoryOptions();
    populateCategoryFilterTabs();
    populateMenuItemsTable();
    showNotification('Category added successfully!', 'success');
}

function populateCategoriesList() {
    const list = document.getElementById('categoriesList');
    const noMessage = document.getElementById('noCategoriesMessage');

    if (!currentStore.menu || currentStore.menu.length === 0) {
        list.innerHTML = '';
        noMessage.style.display = 'block';
        return;
    }

    noMessage.style.display = 'none';
    list.innerHTML = '';

    currentStore.menu.forEach(category => {
        const categoryEl = document.createElement('div');
        categoryEl.className = 'category-item';
        categoryEl.innerHTML = `
            <div class="category-info">
                <h4>${escapeHtml(category.name)}</h4>
                <p>${escapeHtml(category.description)}</p>
                <span class="item-count">${category.items ? category.items.length : 0} items</span>
            </div>
            <div class="category-actions">
                <button class="btn-icon edit-category" data-category-id="${category.id}" title="Edit">✏️</button>
                <button class="btn-icon delete-category" data-category-id="${category.id}" title="Delete">🗑️</button>
            </div>
        `;

        list.appendChild(categoryEl);
    });

    // Add event listeners
    document.querySelectorAll('.delete-category').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const categoryId = parseInt(e.target.dataset.categoryId);
            if (confirm('Delete this category and all its items?')) {
                currentStore.menu = currentStore.menu.filter(c => c.id !== categoryId);
                saveStoreToLocalStorage();
                populateCategoriesList();
                populateProductsList();
                populateProductCategoryOptions();
                showNotification('Category deleted!', 'success');
            }
        });
    });
}

// ==================== PRODUCTS MANAGEMENT ====================

function openProductModal() {
    if (!currentStore.menu || currentStore.menu.length === 0) {
        alert('Please create a category first!');
        switchTab('menu');
        return;
    }

    currentEditingProduct = null;
    document.getElementById('productModalTitle').textContent = 'Add Product';
    document.getElementById('productForm').reset();
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('productModal').style.display = 'flex';
    populateProductCategoryOptions();
}

function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
    currentEditingProduct = null;
}

function handleImagePreview(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            document.getElementById('previewImg').src = event.target.result;
            document.getElementById('imagePreview').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

function handleAddProduct(e) {
    e.preventDefault();

    const categoryId = parseInt(document.getElementById('productCategory').value);
    const category = currentStore.menu.find(c => c.id === categoryId);

    if (!category) {
        alert('Please select a category!');
        return;
    }

    const productName = document.getElementById('productName').value.trim();
    const productPrice = parseFloat(document.getElementById('productPrice').value);
    const productDesc = document.getElementById('productDescription').value.trim();
    const imageFile = document.getElementById('productImage').files[0];

    if (!imageFile) {
        alert('Please upload a product image!');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const imageData = e.target.result;

        const product = {
            id: Date.now(),
            name: productName,
            price: productPrice,
            description: productDesc,
            image: imageData
        };

        if (!category.items) {
            category.items = [];
        }

        if (currentEditingProduct) {
            // Update existing product
            const itemIndex = category.items.findIndex(item => item.id === currentEditingProduct.id);
            if (itemIndex !== -1) {
                category.items[itemIndex] = { ...category.items[itemIndex], ...product };
            }
        } else {
            // Add new product
            category.items.push(product);
        }

        saveStoreToLocalStorage();
        closeProductModal();
        populateCategoryFilterTabs();
        populateMenuItemsTable();
        displayDashboardInfo();
        showNotification(currentEditingProduct ? 'Product updated!' : 'Product added successfully!', 'success');
    };

    reader.readAsDataURL(imageFile);
}

function populateProductCategoryOptions() {
    const select = document.getElementById('productCategory');
    select.innerHTML = '<option value="">Select a category</option>';

    if (currentStore.menu) {
        currentStore.menu.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            select.appendChild(option);
        });
    }
}

// ==================== CATEGORY FILTER TABS & TABLE ====================

function populateCategoryFilterTabs() {
    const tabsContainer = document.getElementById('categoryFilterTabs');
    if (!tabsContainer) return;
    
    tabsContainer.innerHTML = '<button class="category-tab active" data-category="all">All Items</button>';
    
    if (currentStore.menu) {
        currentStore.menu.forEach(category => {
            const tab = document.createElement('button');
            tab.className = 'category-tab';
            tab.setAttribute('data-category', category.id);
            tab.textContent = category.name;
            tabsContainer.appendChild(tab);
        });
    }
    
    // Add event listeners to category tabs
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            populateMenuItemsTable(parseInt(tab.dataset.category) || 'all');
        });
    });
}

function populateMenuItemsTable(filterCategory = 'all') {
    const tbody = document.getElementById('menuItemsTableBody');
    const noMessage = document.getElementById('noProductsMessage');
    
    if (!tbody) return;
    
    // Collect all items
    let allItems = [];
    if (currentStore.menu) {
        currentStore.menu.forEach(category => {
            if (category.items) {
                category.items.forEach(item => {
                    allItems.push({
                        ...item,
                        categoryId: category.id,
                        categoryName: category.name
                    });
                });
            }
        });
    }
    
    // Filter by category if needed
    if (filterCategory !== 'all') {
        allItems = allItems.filter(item => item.categoryId === filterCategory);
    }
    
    if (allItems.length === 0) {
        tbody.innerHTML = '';
        if (noMessage) {
            const titleEl = noMessage.querySelector('h4');
            const bodyEl = noMessage.querySelector('p');
            if (filterCategory === 'all') {
                if (titleEl) titleEl.textContent = 'No menu items yet';
                if (bodyEl) bodyEl.textContent = 'Create a category and add your first item to start receiving orders.';
            } else {
                if (titleEl) titleEl.textContent = 'No items in this category';
                if (bodyEl) bodyEl.textContent = 'Try another category tab or add a new item for this category.';
            }
        }
        noMessage.style.display = 'block';
        return;
    }
    
    noMessage.style.display = 'none';
    tbody.innerHTML = '';
    
    allItems.forEach(item => {
        const row = document.createElement('tr');
        const imageUrl = item.image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ccc" width="100" height="100"/%3Ctext fill="rgba(0,0,0,0.5)" font-size="14" dy="0.3em" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
        const itemPrice = toNumber(item.price, 0);
        
        row.innerHTML = `
            <td>
                <div class="menu-item-image">
                    <img src="${imageUrl}" alt="${escapeHtml(item.name)}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%2250%22%3E%3Crect fill=%22%23ddd%22 width=%22100%22 height=%2250%22/%3E%3C/svg%3E'">
                </div>
            </td>
            <td>
                <div class="menu-item-name">${escapeHtml(item.name)}</div>
                <div class="menu-item-category">${escapeHtml(item.description || '').substring(0, 50)}</div>
            </td>
            <td>${escapeHtml(item.categoryName)}</td>
            <td>
                <div class="menu-item-price">$${itemPrice.toFixed(2)}</div>
            </td>
            <td>
                <span class="availability-badge available">Available</span>
            </td>
            <td>
                <div class="table-actions">
                    <button class="action-btn edit-product" data-category-id="${item.categoryId}" data-item-id="${item.id}" title="Edit">✏️</button>
                    <button class="action-btn delete delete-product" data-category-id="${item.categoryId}" data-item-id="${item.id}" title="Delete">🗑️</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Add event listeners for action buttons
    setupProductTableEventListeners();
}

function setupProductTableEventListeners() {
    // Delete product listeners
    document.querySelectorAll('.delete-product').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const categoryId = parseInt(e.target.dataset.categoryId);
            const itemId = parseInt(e.target.dataset.itemId);

            if (confirm('Delete this product?')) {
                const category = currentStore.menu.find(c => c.id === categoryId);
                if (category) {
                    category.items = category.items.filter(item => item.id !== itemId);
                    saveStoreToLocalStorage();
                    populateCategoryFilterTabs();
                    populateMenuItemsTable();
                    showNotification('Product deleted!', 'success');
                }
            }
        });
    });

    // Edit product listeners
    document.querySelectorAll('.edit-product').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const categoryId = parseInt(e.target.dataset.categoryId);
            const itemId = parseInt(e.target.dataset.itemId);
            
            const category = currentStore.menu.find(c => c.id === categoryId);
            const item = category.items.find(i => i.id === itemId);

            if (item) {
                currentEditingProduct = { ...item, categoryId };
                document.getElementById('productModalTitle').textContent = 'Edit Product';
                document.getElementById('productCategory').value = categoryId;
                document.getElementById('productName').value = item.name;
                document.getElementById('productPrice').value = item.price;
                document.getElementById('productDescription').value = item.description;
                
                // Show image preview
                document.getElementById('previewImg').src = item.image;
                document.getElementById('imagePreview').style.display = 'block';
                
                document.getElementById('productModal').style.display = 'flex';
            }
        });
    });
}

function populateProductsList() {
    const list = document.getElementById('productsList');
    const noMessage = document.getElementById('noProductsMessage');

    if (!currentStore.menu || currentStore.menu.length === 0) {
        list.innerHTML = '';
        noMessage.style.display = 'block';
        return;
    }

    const hasProducts = currentStore.menu.some(cat => cat.items && cat.items.length > 0);

    if (!hasProducts) {
        list.innerHTML = '';
        noMessage.style.display = 'block';
        return;
    }

    noMessage.style.display = 'none';
    list.innerHTML = '';

    currentStore.menu.forEach(category => {
        if (!category.items || category.items.length === 0) return;

        const categorySection = document.createElement('div');
        categorySection.className = 'products-category-section';
        categorySection.innerHTML = `<h4>${escapeHtml(category.name)}</h4>`;

        const itemsGrid = document.createElement('div');
        itemsGrid.className = 'products-grid';

        category.items.forEach(item => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            const itemPrice = toNumber(item.price, 0);
            productCard.innerHTML = `
                <div class="product-image">
                    <img src="${item.image}" alt="${escapeHtml(item.name)}">
                </div>
                <div class="product-info">
                    <h5>${escapeHtml(item.name)}</h5>
                    <p class="product-desc">${escapeHtml(item.description)}</p>
                    <p class="product-price">$${itemPrice.toFixed(2)}</p>
                </div>
                <div class="product-actions">
                    <button class="btn-icon edit-product" data-category-id="${category.id}" data-item-id="${item.id}" title="Edit">✏️</button>
                    <button class="btn-icon delete-product" data-category-id="${category.id}" data-item-id="${item.id}" title="Delete">🗑️</button>
                </div>
            `;

            itemsGrid.appendChild(productCard);
        });

        categorySection.appendChild(itemsGrid);
        list.appendChild(categorySection);
    });

    // Add event listeners
    document.querySelectorAll('.delete-product').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const categoryId = parseInt(e.target.dataset.categoryId);
            const itemId = parseInt(e.target.dataset.itemId);

            if (confirm('Delete this product?')) {
                const category = currentStore.menu.find(c => c.id === categoryId);
                if (category) {
                    category.items = category.items.filter(item => item.id !== itemId);
                    saveStoreToLocalStorage();
                    populateProductsList();
                    showNotification('Product deleted!', 'success');
                }
            }
        });
    });

    document.querySelectorAll('.edit-product').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const categoryId = parseInt(e.target.dataset.categoryId);
            const itemId = parseInt(e.target.dataset.itemId);
            
            const category = currentStore.menu.find(c => c.id === categoryId);
            const item = category.items.find(i => i.id === itemId);

            if (item) {
                currentEditingProduct = { ...item, categoryId };
                document.getElementById('productModalTitle').textContent = 'Edit Product';
                document.getElementById('productCategory').value = categoryId;
                document.getElementById('productName').value = item.name;
                document.getElementById('productPrice').value = item.price;
                document.getElementById('productDescription').value = item.description;
                
                // Show image preview
                document.getElementById('previewImg').src = item.image;
                document.getElementById('imagePreview').style.display = 'block';
                
                document.getElementById('productModal').style.display = 'flex';
            }
        });
    });
}

// ==================== ORDERS ====================

function populateOrdersList(filter = 'all') {
    const list = document.getElementById('ordersList');
    const noMessage = document.getElementById('noOrdersMessage');

    if (!list || !noMessage) {
        return;
    }

    let orders = getStoreOrders();

    if (filter !== 'all') {
        orders = orders.filter(order => order.status === filter);
    }

    if (orders.length === 0) {
        list.innerHTML = '';
        noMessage.style.display = 'block';
        return;
    }

    noMessage.style.display = 'none';
    list.innerHTML = '';

    orders.forEach(order => {
        const orderEl = document.createElement('div');
        orderEl.className = 'order-item';
        
        const itemsList = Array.isArray(order.items)
            ? order.items.map(item => `${item.name || 'Item'} x${toNumber(item.quantity, 1)}`).join(', ')
            : 'No items listed';
        const normalizedStatus = ['pending', 'completed', 'cancelled'].includes(order.status)
            ? order.status
            : 'pending';
        const statusClass = `status-${normalizedStatus}`;
        const completedAtMarkup = order.completedAt
            ? `<p><strong>Completed:</strong> ${new Date(order.completedAt).toLocaleString()}</p>`
            : '';
        const actionMarkup = normalizedStatus === 'pending'
            ? `
                <div class="order-actions">
                    <button class="order-action-btn complete-order-btn" data-order-id="${order.id}">Mark Completed</button>
                    <button class="order-action-btn cancel-order-btn" data-order-id="${order.id}">Cancel Order</button>
                </div>
            `
            : '';

        orderEl.innerHTML = `
            <div class="order-header">
                <h4>Order #${order.id}</h4>
                <span class="order-status ${statusClass}">${normalizedStatus.toUpperCase()}</span>
            </div>
            <div class="order-details">
                <p><strong>Customer:</strong> ${escapeHtml(order.customerName || 'Customer')}</p>
                <p><strong>Items:</strong> ${itemsList}</p>
                <p><strong>Total:</strong> $${toNumber(order.total, 0).toFixed(2)}</p>
                <p><strong>Date:</strong> ${isValidDateValue(order.date) ? new Date(order.date).toLocaleString() : 'Date unavailable'}</p>
                ${completedAtMarkup}
            </div>
            ${actionMarkup}
        `;

        list.appendChild(orderEl);
    });

    list.querySelectorAll('.complete-order-btn').forEach(button => {
        button.addEventListener('click', () => {
            updateOrderStatus(parseInt(button.dataset.orderId, 10), 'completed');
        });
    });

    list.querySelectorAll('.cancel-order-btn').forEach(button => {
        button.addEventListener('click', () => {
            updateOrderStatus(parseInt(button.dataset.orderId, 10), 'cancelled');
        });
    });
}

function updateOrderStatus(orderId, status) {
    const allOrders = safeParseArray('allOrders');
    const orderIndex = allOrders.findIndex(order => order.id === orderId && order.storeId === currentStore.id);

    if (orderIndex === -1) {
        showNotification('Order not found.', 'error');
        return;
    }

    allOrders[orderIndex].status = status;
    if (status === 'completed') {
        allOrders[orderIndex].completedAt = new Date().toISOString();
    } else {
        delete allOrders[orderIndex].completedAt;
    }

    localStorage.setItem('allOrders', JSON.stringify(allOrders));
    window.dispatchEvent(new Event('ordersUpdated'));
    displayDashboardInfo();
    showNotification(`Order marked ${status}.`, 'success');
}

// ==================== UTILITIES ====================

function saveStoreToLocalStorage() {
    const stores = safeParseArray('foodStores');
    const storeIndex = stores.findIndex(s => s.id === currentStore.id);
    
    if (storeIndex !== -1) {
        stores[storeIndex] = currentStore;
        localStorage.setItem('foodStores', JSON.stringify(stores));
        window.dispatchEvent(new Event('storesUpdated'));
    }
}

function showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.setAttribute('role', 'status');
    notification.setAttribute('aria-live', 'polite');
    document.body.appendChild(notification);

    requestAnimationFrame(() => {
        notification.classList.add('show');
    });

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function escapeHtml(text) {
    const normalizedText = text == null ? '' : String(text);
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return normalizedText.replace(/[&<>"']/g, m => map[m]);
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', function() {
    loadCurrentStore();
});
