// ==================== STORE DETAIL PAGE ====================

let currentStore = null;
let currentCategory = null;
let shoppingCart = [];
let selectedItem = null;

// Get store ID from URL parameter
function getStoreIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return parseInt(params.get('id'));
}

// Load store data from localStorage
function loadStoreData() {
    const storeId = getStoreIdFromUrl();
    if (!storeId) {
        alert('Store not found');
        window.location.href = 'foodpage.html';
        return;
    }

    const stores = JSON.parse(localStorage.getItem('foodStores')) || [];
    const store = stores.find(s => s.id === storeId);

    if (!store) {
        alert('Store not found');
        window.location.href = 'foodpage.html';
        return;
    }

    currentStore = store;
    
    // Load store's cart if it exists
    const cartKey = `cart_${storeId}`;
    shoppingCart = JSON.parse(localStorage.getItem(cartKey)) || [];
    
    displayStoreInfo();
    initializeMenu();
    setupEventListeners();
}

// Display store information
function displayStoreInfo() {
    // Store cover image
    const storeCover = document.getElementById('storeCover');
    if (currentStore.image) {
        storeCover.style.backgroundImage = `url('${currentStore.image}')`;
    } else {
        storeCover.style.background = 'linear-gradient(135deg, #ff8c00, #e67e22)';
    }

    // Store details
    document.getElementById('storeName').textContent = currentStore.name;
    document.getElementById('storeCategory').textContent = currentStore.type;
    document.getElementById('storeRating').textContent = (currentStore.rating || 4.5).toFixed(1);
    document.getElementById('storeDelivery').textContent = currentStore.deliveryTime || '30-45 mins';
    document.getElementById('storeAddress').textContent = `📍 ${currentStore.address}`;
    document.getElementById('storePhone').textContent = `📞 ${currentStore.phone}`;

    // Update store status
    const statusElement = document.getElementById('storeStatus');
    if (currentStore.isOpen) {
        statusElement.textContent = 'Open';
        statusElement.className = 'store-status status-open';
    } else {
        statusElement.textContent = 'Closed';
        statusElement.className = 'store-status status-closed';
    }

    // Update cart count
    updateCartCount();
}

// Initialize menu with sample data if not exists
function initializeMenu() {
    if (!currentStore.menu || currentStore.menu.length === 0) {
        // Create sample menu categories and items
        currentStore.menu = [
            {
                id: 1,
                name: 'Appetizers',
                description: 'Start your meal with our delicious appetizers',
                items: [
                    {
                        id: 101,
                        name: 'Garlic Bread',
                        description: 'Crispy garlic bread with herbs',
                        price: 5.99,
                        image: 'https://via.placeholder.com/300x200?text=Garlic+Bread'
                    },
                    {
                        id: 102,
                        name: 'Chicken Wings',
                        description: 'Spicy or BBQ flavored chicken wings',
                        price: 8.99,
                        image: 'https://via.placeholder.com/300x200?text=Chicken+Wings'
                    }
                ]
            },
            {
                id: 2,
                name: 'Main Courses',
                description: 'Our signature main dishes',
                items: [
                    {
                        id: 201,
                        name: 'Pasta Carbonara',
                        description: 'Classic Italian pasta with creamy sauce',
                        price: 12.99,
                        image: 'https://via.placeholder.com/300x200?text=Pasta+Carbonara'
                    },
                    {
                        id: 202,
                        name: 'Grilled Chicken Burger',
                        description: 'Juicy grilled chicken with fresh vegetables',
                        price: 11.99,
                        image: 'https://via.placeholder.com/300x200?text=Chicken+Burger'
                    },
                    {
                        id: 203,
                        name: 'Margherita Pizza',
                        description: 'Fresh mozzarella, basil, and tomato sauce',
                        price: 13.99,
                        image: 'https://via.placeholder.com/300x200?text=Pizza'
                    }
                ]
            },
            {
                id: 3,
                name: 'Desserts',
                description: 'Sweet treats to end your meal',
                items: [
                    {
                        id: 301,
                        name: 'Chocolate Cake',
                        description: 'Rich and moist chocolate cake',
                        price: 6.99,
                        image: 'https://via.placeholder.com/300x200?text=Chocolate+Cake'
                    },
                    {
                        id: 302,
                        name: 'Ice Cream Sundae',
                        description: 'Assorted ice cream with toppings',
                        price: 7.99,
                        image: 'https://via.placeholder.com/300x200?text=Ice+Cream'
                    }
                ]
            }
        ];

        // Save to localStorage
        const stores = JSON.parse(localStorage.getItem('foodStores')) || [];
        const storeIndex = stores.findIndex(s => s.id === currentStore.id);
        if (storeIndex !== -1) {
            stores[storeIndex].menu = currentStore.menu;
            localStorage.setItem('foodStores', JSON.stringify(stores));
        }
    }

    displayCategories();
    
    // Select first category by default
    if (currentStore.menu.length > 0) {
        selectCategory(0);
    }
}

// Display category tabs
function displayCategories() {
    const categoryTabs = document.getElementById('categoryTabs');
    categoryTabs.innerHTML = '';

    currentStore.menu.forEach((category, index) => {
        const tab = document.createElement('button');
        tab.className = 'category-tab';
        tab.textContent = category.name;
        tab.addEventListener('click', () => selectCategory(index));
        categoryTabs.appendChild(tab);
    });
}

// Select and display category
function selectCategory(index) {
    if (index < 0 || index >= currentStore.menu.length) return;

    currentCategory = currentStore.menu[index];
    
    // Update active tab
    document.querySelectorAll('.category-tab').forEach((tab, i) => {
        tab.classList.toggle('active', i === index);
    });

    displayMenuItems();
}

// Display menu items for current category
function displayMenuItems() {
    const menuItemsContainer = document.getElementById('menuItems');
    const emptyMessage = document.getElementById('emptyMenuMessage');

    if (!currentCategory || !currentCategory.items || currentCategory.items.length === 0) {
        menuItemsContainer.innerHTML = '';
        emptyMessage.style.display = 'block';
        return;
    }

    emptyMessage.style.display = 'none';
    menuItemsContainer.innerHTML = '';

    currentCategory.items.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = 'menu-item-card';
        itemCard.innerHTML = `
            <img src="${item.image}" alt="${escapeHtml(item.name)}" class="menu-item-image">
            <div class="menu-item-info">
                <h4>${escapeHtml(item.name)}</h4>
                <p class="item-desc">${escapeHtml(item.description)}</p>
                <div class="item-footer">
                    <span class="item-price">$${item.price.toFixed(2)}</span>
                    <button class="add-btn">Add</button>
                </div>
            </div>
        `;

        itemCard.addEventListener('click', (e) => {
            if (!e.target.classList.contains('add-btn')) {
                openItemModal(item);
            }
        });

        itemCard.querySelector('.add-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            addItemToCart(item, 1);
        });

        menuItemsContainer.appendChild(itemCard);
    });
}

// Open item detail modal
function openItemModal(item) {
    selectedItem = item;
    document.getElementById('itemName').textContent = item.name;
    document.getElementById('itemDescription').textContent = item.description;
    document.getElementById('itemPrice').textContent = `$${item.price.toFixed(2)}`;
    document.getElementById('itemImage').src = item.image;
    document.getElementById('quantityInput').value = '1';
    
    document.getElementById('itemModal').style.display = 'flex';
}

// Close item modal
function closeItemModal() {
    document.getElementById('itemModal').style.display = 'none';
    selectedItem = null;
}

// Add item to cart
function addItemToCart(item, quantity) {
    const cartItem = shoppingCart.find(ci => ci.id === item.id);
    
    if (cartItem) {
        cartItem.quantity += quantity;
    } else {
        shoppingCart.push({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: quantity,
            image: item.image
        });
    }

    // Save cart to localStorage
    const cartKey = `cart_${currentStore.id}`;
    localStorage.setItem(cartKey, JSON.stringify(shoppingCart));

    updateCartDisplay();
    
    // Close modal if open
    closeItemModal();
    
    // Show success message
    showCartNotification(`${item.name} added to cart!`);
}

// Remove item from cart
function removeFromCart(itemId) {
    shoppingCart = shoppingCart.filter(item => item.id !== itemId);
    
    const cartKey = `cart_${currentStore.id}`;
    localStorage.setItem(cartKey, JSON.stringify(shoppingCart));

    updateCartDisplay();
}

// Update item quantity in cart
function updateCartItemQuantity(itemId, newQuantity) {
    const cartItem = shoppingCart.find(item => item.id === itemId);
    if (cartItem) {
        if (newQuantity <= 0) {
            removeFromCart(itemId);
        } else {
            cartItem.quantity = newQuantity;
            const cartKey = `cart_${currentStore.id}`;
            localStorage.setItem(cartKey, JSON.stringify(shoppingCart));
            updateCartDisplay();
        }
    }
}

// Update cart display
function updateCartDisplay() {
    const cartItemsContainer = document.getElementById('cartItems');
    const emptyMessage = document.getElementById('emptyCartMessage');
    const checkoutBtn = document.getElementById('checkoutBtn');

    if (shoppingCart.length === 0) {
        cartItemsContainer.innerHTML = '';
        emptyMessage.style.display = 'block';
        checkoutBtn.style.display = 'none';
        return;
    }

    emptyMessage.style.display = 'none';
    checkoutBtn.style.display = 'block';

    cartItemsContainer.innerHTML = '';

    shoppingCart.forEach(item => {
        const cartItemEl = document.createElement('div');
        cartItemEl.className = 'cart-item';
        cartItemEl.innerHTML = `
            <div class="cart-item-info">
                <img src="${item.image}" alt="${escapeHtml(item.name)}" class="cart-item-image">
                <div class="cart-item-details">
                    <h4>${escapeHtml(item.name)}</h4>
                    <p class="cart-item-price">$${item.price.toFixed(2)}</p>
                </div>
            </div>
            <div class="cart-item-controls">
                <button class="qty-control" data-item-id="${item.id}" data-action="decrease">−</button>
                <span class="cart-item-qty">${item.quantity}</span>
                <button class="qty-control" data-item-id="${item.id}" data-action="increase">+</button>
                <button class="remove-btn" data-item-id="${item.id}">🗑️</button>
            </div>
        `;
        cartItemsContainer.appendChild(cartItemEl);
    });

    // Add event listeners
    document.querySelectorAll('.qty-control').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const itemId = parseInt(e.target.dataset.itemId);
            const action = e.target.dataset.action;
            const cartItem = shoppingCart.find(item => item.id === itemId);
            
            if (action === 'increase') {
                updateCartItemQuantity(itemId, cartItem.quantity + 1);
            } else {
                updateCartItemQuantity(itemId, cartItem.quantity - 1);
            }
        });
    });

    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const itemId = parseInt(e.target.dataset.itemId);
            removeFromCart(itemId);
        });
    });

    updateCartTotal();
    updateCartCount();
}

// Update cart total
function updateCartTotal() {
    const total = shoppingCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('cartTotal').textContent = `$${total.toFixed(2)}`;
}

// Update cart count in header
function updateCartCount() {
    const count = shoppingCart.reduce((sum, item) => sum + item.quantity, 0);
    const countElement = document.getElementById('cartCount');
    
    if (count > 0) {
        countElement.textContent = count;
        countElement.style.display = 'inline-block';
    } else {
        countElement.style.display = 'none';
    }
}

// Show cart notification
function showCartNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// Setup event listeners
function setupEventListeners() {
    // Back button
    document.getElementById('backBtn').addEventListener('click', () => {
        window.location.href = 'foodpage.html';
    });

    // Cart icon
    document.getElementById('cartIcon').addEventListener('click', toggleCart);

    // Cart close button
    document.getElementById('cartCloseBtn').addEventListener('click', closeCart);

    // Cart overlay
    document.getElementById('cartOverlay').addEventListener('click', closeCart);

    // Modal controls
    document.getElementById('modalCloseBtn').addEventListener('click', closeItemModal);
    document.getElementById('itemModal').addEventListener('click', (e) => {
        if (e.target.id === 'itemModal') closeItemModal();
    });

    // Quantity controls in modal
    document.getElementById('decreaseQty').addEventListener('click', () => {
        const input = document.getElementById('quantityInput');
        if (input.value > 1) input.value--;
    });

    document.getElementById('increaseQty').addEventListener('click', () => {
        const input = document.getElementById('quantityInput');
        input.value++;
    });

    document.getElementById('addToCartBtn').addEventListener('click', () => {
        if (selectedItem) {
            const quantity = parseInt(document.getElementById('quantityInput').value);
            addItemToCart(selectedItem, quantity);
        }
    });

    // Checkout button
    document.getElementById('checkoutBtn').addEventListener('click', () => {
        if (shoppingCart.length > 0) {
            const defaults = typeof getDefaultCheckoutDetails === 'function'
                ? getDefaultCheckoutDetails()
                : { name: '', email: '', phone: '', address: '' };
            const name = prompt('Enter your full name:', defaults.name);
            if (!name) {
                return;
            }

            const email = prompt('Enter your email address:', defaults.email);
            if (!email) {
                return;
            }

            const phone = prompt('Enter your phone number:', defaults.phone);
            if (!phone) {
                return;
            }

            const address = prompt('Enter your delivery address:', defaults.address);
            if (!address) {
                return;
            }

            const note = prompt('Any note for the store? Leave blank if none.', '') || '';
            const total = shoppingCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const cartEntry = {
                cartKey: `cart_${currentStore.id}`,
                storeId: currentStore.id,
                storeName: currentStore.name,
                items: shoppingCart.map(item => ({ ...item })),
                itemCount: shoppingCart.reduce((sum, item) => sum + item.quantity, 0),
                total
            };

            try {
                createOrdersFromCartEntries({ name, email, phone, address, note }, [cartEntry]);
                shoppingCart = [];
                updateCartDisplay();
                closeCart();
                alert(`Order placed! Total: $${total.toFixed(2)}\n\nThe store owner can now see your order.`);
            } catch (error) {
                alert(error.message || 'Unable to place your order right now.');
            }
        }
    });
}

// Toggle cart sidebar
function toggleCart() {
    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('cartOverlay');
    
    if (sidebar.classList.contains('open')) {
        closeCart();
    } else {
        sidebar.classList.add('open');
        overlay.style.display = 'block';
    }
}

// Close cart
function closeCart() {
    document.getElementById('cartSidebar').classList.remove('open');
    document.getElementById('cartOverlay').style.display = 'none';
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

// Initialize on page load
window.addEventListener('DOMContentLoaded', function() {
    loadStoreData();
});
