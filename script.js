// ==================== SIGN IN VALIDATION ====================

const ORDER_STORAGE_KEY = 'allOrders';
const COMPLETED_ORDER_SEEN_PREFIX = 'seenCompletedOrders';

// Initialize sample stores if none exist
function initializeSampleStores() {
    const existingStores = localStorage.getItem('foodStores');
    if (!existingStores || JSON.parse(existingStores).length === 0) {
        const sampleStores = [
            {
                id: 1,
                name: "TechZone Express",
                email: "techzone@example.com",
                address: "123 Tech Street, Silicon Valley, CA",
                phone: "555-0101",
                type: "Technology",
                deliveryTime: "20-30 mins",
                isOpen: true,
                rating: 4.5,
                priceRange: "$$",
                image: "https://cdn-icons-png.flaticon.com/512/2920/2920244.png",
                menu: [
                    { id: 1, name: "Smartphone Stand", price: 19.99, description: "Adjustable phone stand" },
                    { id: 2, name: "Wireless Charger", price: 29.99, description: "Fast wireless charging pad" },
                    { id: 3, name: "USB-C Hub", price: 49.99, description: "7-in-1 USB-C hub" }
                ]
            },
            {
                id: 2,
                name: "QuickCare Pharmacy",
                email: "quickcare@example.com",
                address: "456 Health Ave, Medical District, CA",
                phone: "555-0102",
                type: "Technology",
                deliveryTime: "15-25 mins",
                isOpen: true,
                rating: 4.7,
                priceRange: "$$",
                image: "https://cdn-icons-png.flaticon.com/512/2966/2966327.png",
                menu: [
                    { id: 1, name: "First Aid Kit", price: 24.99, description: "Complete first aid supplies" },
                    { id: 2, name: "Vitamins Pack", price: 15.99, description: "Daily multivitamins" },
                    { id: 3, name: "Hand Sanitizer", price: 5.99, description: "Antibacterial gel" }
                ]
            },
            {
                id: 3,
                name: "Gadget World",
                email: "gadgetworld@example.com",
                address: "789 Innovation Blvd, Tech Park, CA",
                phone: "555-0103",
                type: "Technology",
                deliveryTime: "25-35 mins",
                isOpen: true,
                rating: 4.3,
                priceRange: "$$$",
                image: "https://cdn-icons-png.flaticon.com/512/861/861512.png",
                menu: [
                    { id: 1, name: "Bluetooth Earbuds", price: 79.99, description: "Wireless earbuds with mic" },
                    { id: 2, name: "Smart Watch", price: 199.99, description: "Fitness tracker watch" },
                    { id: 3, name: "Portable Speaker", price: 39.99, description: "Waterproof bluetooth speaker" }
                ]
            },
            {
                id: 4,
                name: "Burger Palace",
                email: "burgerpalace@example.com",
                address: "100 Food Street, Downtown, CA",
                phone: "555-1001",
                type: "Food",
                deliveryTime: "25-35 mins",
                isOpen: true,
                rating: 4.6,
                priceRange: "$$",
                image: "https://cdn-icons-png.flaticon.com/512/3075/3075977.png",
                menu: [
                    { id: 1, name: "Classic Burger", price: 12.99, description: "Beef patty with cheese" },
                    { id: 2, name: "Fries", price: 4.99, description: "Crispy golden fries" },
                    { id: 3, name: "Milkshake", price: 6.99, description: "Chocolate vanilla strawberry" }
                ]
            },
            {
                id: 5,
                name: "Fashion Forward",
                email: "fashionforward@example.com",
                address: "200 Style Lane, Mall District, CA",
                phone: "555-2001",
                type: "Fashion",
                deliveryTime: "30-45 mins",
                isOpen: true,
                rating: 4.4,
                priceRange: "$$$",
                image: "https://cdn-icons-png.flaticon.com/512/892/892458.png",
                menu: [
                    { id: 1, name: "Designer T-Shirt", price: 39.99, description: "Cotton premium tee" },
                    { id: 2, name: "Jeans", price: 59.99, description: "Slim fit denim" },
                    { id: 3, name: "Sneakers", price: 89.99, description: "Running shoes" }
                ]
            }
        ];
        localStorage.setItem('foodStores', JSON.stringify(sampleStores));
    }
}

// Call initialization on load
initializeSampleStores();

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Close modal function
function closeModal() {
    const modal = document.getElementById('signInModal');
    if (modal) {
        modal.style.display = 'none';
        clearFormErrors();
    }
}

// Validate modal sign in
function validateModalSignIn() {
    const name = document.getElementById('modalName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    let isValid = true;

    // Clear previous errors
    document.getElementById('modalNameError').textContent = '';
    document.getElementById('emailError').textContent = '';
    document.getElementById('passwordError').textContent = '';

    // Validate name
    if (!name) {
        document.getElementById('modalNameError').textContent = 'Name is required';
        isValid = false;
    } else if (name.length < 2) {
        document.getElementById('modalNameError').textContent = 'Name must be at least 2 characters';
        isValid = false;
    }

    // Validate email
    if (!email) {
        document.getElementById('emailError').textContent = 'Email is required';
        isValid = false;
    } else if (!isValidEmail(email)) {
        document.getElementById('emailError').textContent = 'Please enter a valid email';
        isValid = false;
    }

    // Validate password
    if (!password) {
        document.getElementById('passwordError').textContent = 'Password is required';
        isValid = false;
    } else if (password.length < 6) {
        document.getElementById('passwordError').textContent = 'Password must be at least 6 characters';
        isValid = false;
    }

    if (isValid) {
        handleSignIn(email, password, true, name);
    }
}

// Validate dedicated page sign in
function validatePageSignIn() {
    const name = document.getElementById('signinName').value.trim();
    const email = document.getElementById('signinEmail').value.trim();
    const password = document.getElementById('signinPassword').value.trim();
    let isValid = true;

    // Clear previous errors
    document.getElementById('signinNameError').textContent = '';
    document.getElementById('signinEmailError').textContent = '';
    document.getElementById('signinPasswordError').textContent = '';

    // Validate name
    if (!name) {
        document.getElementById('signinNameError').textContent = 'Name is required';
        isValid = false;
    } else if (name.length < 2) {
        document.getElementById('signinNameError').textContent = 'Name must be at least 2 characters';
        isValid = false;
    }

    // Validate email
    if (!email) {
        document.getElementById('signinEmailError').textContent = 'Email is required';
        isValid = false;
    } else if (!isValidEmail(email)) {
        document.getElementById('signinEmailError').textContent = 'Please enter a valid email';
        isValid = false;
    }

    // Validate password
    if (!password) {
        document.getElementById('signinPasswordError').textContent = 'Password is required';
        isValid = false;
    } else if (password.length < 6) {
        document.getElementById('signinPasswordError').textContent = 'Password must be at least 6 characters';
        isValid = false;
    }

    if (isValid) {
        handleSignIn(email, password, false, name);
    }
}

// Handle sign in (save to localStorage and redirect)
function handleSignIn(email, password, isModal, name = null) {
    try {
        const rememberMe = isModal 
            ? (document.getElementById('rememberMe')?.checked || false)
            : (document.getElementById('signinRememberMe')?.checked || false);

        // Store user data in localStorage
        const userData = {
            name: name || 'User',
            email: email,
            signedInAt: new Date().toISOString(),
            rememberMe: rememberMe
        };

        localStorage.setItem('serversphereUser', JSON.stringify(userData));

        // Show success message
        alert('Sign in successful! Welcome to ServeSphere.');

        // Redirect to home page
        window.location.href = 'servesphere.html';
    } catch (error) {
        console.error('Error during sign in:', error);
        alert('An error occurred. Please try again.');
    }
}

// Clear form errors
function clearFormErrors() {
    const errorElements = document.querySelectorAll('.error');
    errorElements.forEach(el => {
        el.textContent = '';
    });
}

// Check if user is already signed in and update UI
function checkUserSignIn() {
    const userData = localStorage.getItem('serversphereUser');
    if (userData) {
        const user = JSON.parse(userData);
        updateProfileUI(user);
        updateCompletedOrdersBadge(user);
        return user;
    } else {
        // Show sign-in button if user is not logged in
        const signInLink = document.getElementById('signInLink');
        const profileSection = document.getElementById('profileSection');
        if (signInLink) signInLink.style.display = 'inline-block';
        if (profileSection) profileSection.style.display = 'none';
        updateMobileMenuProfile(null);
        updateCompletedOrdersBadge(null);
    }
    return null;
}

function getCompletedOrdersSeenStorageKey(user) {
    const userScope = user?.email ? user.email.trim().toLowerCase() : 'guest';
    return `${COMPLETED_ORDER_SEEN_PREFIX}:${userScope}`;
}

function getSeenCompletedOrderIds(user) {
    try {
        const storedIds = JSON.parse(localStorage.getItem(getCompletedOrdersSeenStorageKey(user))) || [];
        return Array.isArray(storedIds)
            ? storedIds.map(id => Number(id)).filter(Number.isInteger)
            : [];
    } catch (error) {
        console.warn('Unable to read seen completed order ids.', error);
        return [];
    }
}

function getUnseenCompletedOrdersCount(user) {
    if (!user?.email) {
        return 0;
    }

    const userEmail = user.email.trim().toLowerCase();
    const seenIds = new Set(getSeenCompletedOrderIds(user));
    const allOrders = JSON.parse(localStorage.getItem(ORDER_STORAGE_KEY)) || [];

    return allOrders.filter(order => {
        const belongsToUser = (order.customerEmail || '').trim().toLowerCase() === userEmail;
        return belongsToUser && order.status === 'completed' && !seenIds.has(Number(order.id));
    }).length;
}

function updateCompletedOrdersBadge(user = null) {
    const desktopBadge = document.getElementById('desktopOrdersBadge');
    const mobileBadge = document.getElementById('mobileOrdersBadge');
    const currentUser = user || (() => {
        try {
            return JSON.parse(localStorage.getItem('serversphereUser')) || null;
        } catch (error) {
            return null;
        }
    })();
    const unseenCount = getUnseenCompletedOrdersCount(currentUser);

    [desktopBadge, mobileBadge].forEach(badge => {
        if (!badge) {
            return;
        }

        if (unseenCount > 0) {
            badge.textContent = unseenCount > 99 ? '99+' : String(unseenCount);
            badge.style.display = 'inline-flex';
        } else {
            badge.style.display = 'none';
        }
    });
}

// Update UI with profile information
function updateProfileUI(user) {
    const signInLink = document.getElementById('signInLink');
    const profileSection = document.getElementById('profileSection');
    const profileName = document.getElementById('profileName');
    const dropdownName = document.getElementById('dropdownName');
    const dropdownEmail = document.getElementById('dropdownEmail');
    const profileAvatar = document.getElementById('profileAvatar');

    if (signInLink) signInLink.style.display = 'none';
    if (profileSection) profileSection.style.display = 'flex';

    if (profileName) profileName.textContent = user.name;
    if (dropdownName) dropdownName.textContent = user.name;
    if (dropdownEmail) dropdownEmail.textContent = user.email;

    // Set avatar with first letter
    if (profileAvatar) {
        const firstLetter = user.name.charAt(0).toUpperCase();
        profileAvatar.textContent = firstLetter;
        profileAvatar.style.backgroundColor = generateColorFromName(user.name);
    }

    // Update mobile menu with user profile
    updateMobileMenuProfile(user);
}

// Update mobile menu with user profile
function updateMobileMenuProfile(user) {
    const mobileMenuHeader = document.getElementById('mobileMenuHeader');
    const mobileProfileName = document.getElementById('mobileProfileName');
    const mobileProfileEmail = document.getElementById('mobileProfileEmail');
    const mobileAvatar = document.getElementById('mobileAvatar');
    const mobileSignInLink = document.getElementById('mobileSignInLink');
    const mobileAccountBtn = document.getElementById('mobileAccountBtn');
    const mobileOrdersBtn = document.getElementById('mobileOrdersBtn');
    const mobileSettingsBtn = document.getElementById('mobileSettingsBtn');
    const mobileLogoutDivider = document.getElementById('mobileLogoutDivider');
    const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');

    if (user) {
        // Show user profile in mobile menu
        if (mobileMenuHeader) mobileMenuHeader.style.display = 'block';
        if (mobileSignInLink) mobileSignInLink.style.display = 'none';
        if (mobileAccountBtn) mobileAccountBtn.style.display = 'block';
        if (mobileOrdersBtn) mobileOrdersBtn.style.display = 'block';
        if (mobileSettingsBtn) mobileSettingsBtn.style.display = 'block';
        if (mobileLogoutDivider) mobileLogoutDivider.style.display = 'block';
        if (mobileLogoutBtn) mobileLogoutBtn.style.display = 'block';

        if (mobileProfileName) mobileProfileName.textContent = user.name;
        if (mobileProfileEmail) mobileProfileEmail.textContent = user.email;

        if (mobileAvatar) {
            const firstLetter = user.name.charAt(0).toUpperCase();
            mobileAvatar.textContent = firstLetter;
            mobileAvatar.style.backgroundColor = generateColorFromName(user.name);
        }
    } else {
        // Show sign in link
        if (mobileMenuHeader) mobileMenuHeader.style.display = 'none';
        if (mobileSignInLink) mobileSignInLink.style.display = 'block';
        if (mobileAccountBtn) mobileAccountBtn.style.display = 'none';
        if (mobileOrdersBtn) mobileOrdersBtn.style.display = 'none';
        if (mobileSettingsBtn) mobileSettingsBtn.style.display = 'none';
        if (mobileLogoutDivider) mobileLogoutDivider.style.display = 'none';
        if (mobileLogoutBtn) mobileLogoutBtn.style.display = 'none';
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

// Sign out function
function signOut() {
    localStorage.removeItem('serversphereUser');
    window.location.href = 'servesphere.html';
}

// Show sign in modal (if needed from other pages)
function openSignInModal() {
    const modal = document.getElementById('signInModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

// Social sign in placeholders
document.addEventListener('DOMContentLoaded', function() {
    
    // Setup modal on home page
    const modal = document.getElementById('signInModal');
    const signInForm = document.getElementById('signInForm');
    const closeBtn = document.querySelector('.close');
    const signInLink = document.getElementById('signInLink');
    
    // Sign In link opens modal
    if (signInLink && modal) {
        signInLink.addEventListener('click', function(e) {
            e.preventDefault();
            modal.style.display = 'block';
        });
    }
    
    if (modal && signInForm) {
        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }
        window.addEventListener('click', function(event) {
            if (event.target === modal) {
                closeModal();
            }
        });
        signInForm.addEventListener('submit', function(e) {
            e.preventDefault();
            validateModalSignIn();
        });
    }
    
    // Setup dedicated sign in page form
    const fullSignInForm = document.getElementById('fullSignInForm');
    if (fullSignInForm) {
        fullSignInForm.addEventListener('submit', function(e) {
            e.preventDefault();
            validatePageSignIn();
        });
    }

    const googleBtn = document.querySelector('.google-btn');
    const facebookBtn = document.querySelector('.facebook-btn');
    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    const logoutBtn = document.getElementById('logoutBtn');
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');

    if (googleBtn) {
        googleBtn.addEventListener('click', function() {
            alert('Google Sign In - Coming Soon!');
        });
    }

    if (facebookBtn) {
        facebookBtn.addEventListener('click', function() {
            alert('Facebook Sign In - Coming Soon!');
        });
    }

    // Profile dropdown toggle
    if (profileBtn) {
        profileBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (profileDropdown) {
                profileDropdown.classList.toggle('show');
            }
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        if (profileDropdown && !event.target.closest('.profile-section')) {
            profileDropdown.classList.remove('show');
        }
    });

    // Logout button event listener
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Are you sure you want to sign out?')) {
                signOut();
            }
        });
    }

    // Hamburger menu toggle
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            hamburgerBtn.classList.toggle('active');
            if (mobileMenu) {
                mobileMenu.classList.toggle('show');
            }
        });
    }

    // Close mobile menu when clicking outside
    if (mobileMenu) {
        mobileMenu.addEventListener('click', function(event) {
            if (event.target === mobileMenu) {
                hamburgerBtn.classList.remove('active');
                mobileMenu.classList.remove('show');
            }
        });
    }

    // Close mobile menu when clicking a menu item
    const mobileMenuItems = document.querySelectorAll('.mobile-menu-item');
    mobileMenuItems.forEach(item => {
        item.addEventListener('click', function() {
            hamburgerBtn.classList.remove('active');
            mobileMenu.classList.remove('show');
        });
    });

    // Mobile logout button
    if (mobileLogoutBtn) {
        mobileLogoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Are you sure you want to sign out?')) {
                signOut();
            }
        });
    }

    // Initialize user status on page load
    checkUserSignIn();

    window.addEventListener('focus', () => {
        updateCompletedOrdersBadge();
    });

    window.addEventListener('storage', event => {
        if (!event.key || event.key === ORDER_STORAGE_KEY || event.key === 'serversphereUser') {
            updateCompletedOrdersBadge();
        }
    });
});

// Hide loading animation on page load
window.addEventListener('load', () => {
    // Temporary delay for testing (remove after testing)
    setTimeout(() => {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'none';
        }
    }, 3000); // 3 seconds delay
});

// Fallback: hide loading after 10 seconds in case of slow loading
setTimeout(() => {
    const loading = document.getElementById('loading');
    if (loading && loading.style.display !== 'none') {
        loading.style.display = 'none';
    }
}, 10000);

