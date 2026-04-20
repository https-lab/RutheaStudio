// Cart functionality for Rúthéa Studio

let cart = JSON.parse(localStorage.getItem('ruthea_cart')) || [];

function saveCart() {
    localStorage.setItem('ruthea_cart', JSON.stringify(cart));
    updateCartBadge();
}

// Authentication Helpers
function isLoggedIn() {
    return localStorage.getItem('ruthea_user_logged_in') === 'true';
}

function checkAuthStatus() {
    const loginLinks = document.querySelectorAll('a[href="login.html"]');
    const ordersLinks = document.querySelectorAll('a[href="orders.html"]');
    const isLoggedInUser = isLoggedIn();

    loginLinks.forEach(link => {
        if (isLoggedInUser) {
            link.innerHTML = '<i class="fas fa-sign-out-alt"></i> Log Out';
            link.href = '#';
            link.onclick = (e) => {
                e.preventDefault();
                handleLogout();
            };
        } else {
            link.innerHTML = '<i class="fas fa-user"></i> Member Log in';
            link.href = 'login.html';
            link.onclick = null;
        }
    });

    ordersLinks.forEach(link => {
        link.onclick = (e) => {
            if (!isLoggedInUser) {
                e.preventDefault();
                showNotification('Please log in to view your orders.', 'warning');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
            }
        };
    });
}

function handleLogout() {
    localStorage.removeItem('ruthea_user_logged_in');
    showNotification('Successfully logged out!', 'success');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
}

// Notification System
function showNotification(message, type = 'success') {
    let container = document.querySelector('.notification-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    let icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    if (type === 'warning') icon = 'fa-exclamation-triangle';

    notification.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;

    container.appendChild(notification);

    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 10);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function addToCart(id, name, price, image) {
    if (!isLoggedIn()) {
        showNotification('Please log in first to add products to your cart.', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return;
    }

    const existingItem = cart.find(item => item.id === id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: id,
            name: name,
            price: price,
            image: image,
            quantity: 1
        });
    }
    saveCart();
    showNotification(`${name} added to cart!`, 'success');
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    renderCart();
}

function updateQuantity(id, delta) {
    const item = cart.find(item => item.id === id);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            removeFromCart(id);
        } else {
            saveCart();
            renderCart();
        }
    }
}

function updateCartBadge() {
    const badges = document.querySelectorAll('.cart-count');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    badges.forEach(badge => {
        badge.textContent = totalItems;
        badge.style.display = totalItems > 0 ? 'inline-block' : 'none';
    });
}

function renderCart() {
    const cartTableBody = document.querySelector('.cart-table tbody');
    const subtotalEl = document.getElementById('subtotal');
    const totalEl = document.getElementById('total');
    
    if (!cartTableBody) return;

    if (cart.length === 0) {
        cartTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 3rem;">Your cart is empty. <a href="products.html" style="color: var(--main-color); font-weight: bold;">Shop now</a></td></tr>';
        if (subtotalEl) subtotalEl.textContent = '₱0.00';
        if (totalEl) totalEl.textContent = '₱0.00';
        return;
    }

    cartTableBody.innerHTML = '';
    let subtotal = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td data-label="Product">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <img src="${item.image}" class="cart-item-img" style="width: 60px; height: 60px; object-fit: cover; border-radius: 5px;">
                    <span>${item.name}</span>
                </div>
            </td>
            <td data-label="Price">₱${item.price.toLocaleString()}</td>
            <td data-label="Quantity">
                <div class="quantity-controls">
                    <button onclick="updateQuantity('${item.id}', -1)" class="qty-btn">-</button>
                    <span class="qty-val">${item.quantity}</span>
                    <button onclick="updateQuantity('${item.id}', 1)" class="qty-btn">+</button>
                </div>
            </td>
            <td data-label="Total">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    ₱${itemTotal.toLocaleString()}
                    <button onclick="removeFromCart('${item.id}')" class="remove-btn" title="Remove"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        `;
        cartTableBody.appendChild(row);
    });

    const shipping = 150;
    if (subtotalEl) subtotalEl.textContent = `₱${subtotal.toLocaleString()}.00`;
    if (totalEl) totalEl.textContent = `₱${(subtotal + shipping).toLocaleString()}.00`;
}

function checkout() {
    if (!isLoggedIn()) {
        showNotification('Please log in first to checkout.', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return;
    }

    if (cart.length === 0) {
        showNotification("Your cart is empty!", "error");
        return;
    }

    const orders = JSON.parse(localStorage.getItem('ruthea_orders')) || [];
    const newOrder = {
        id: 'ORD' + Date.now(),
        date: new Date().toLocaleDateString(),
        items: [...cart],
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) + 150
    };

    orders.unshift(newOrder);
    localStorage.setItem('ruthea_orders', JSON.stringify(orders));
    
    // Clear cart
    cart = [];
    localStorage.removeItem('ruthea_cart');
    
    window.location.href = 'thankyou.html';
}

function renderOrders() {
    const ordersContainer = document.getElementById('ordersContainer');
    if (!ordersContainer) return;

    if (!isLoggedIn()) {
        ordersContainer.innerHTML = `
            <div style="text-align:center; padding: 5rem;">
                <i class="fas fa-lock" style="font-size: 3rem; color: #ccc; margin-bottom: 2rem; display: block;"></i>
                <h2>Access Restricted</h2>
                <p style="margin-bottom: 2rem; color: #666;">Please log in to view your order history.</p>
                <a href="login.html" class="login-btn-full" style="display: inline-block; width: auto; padding: 1rem 3rem;">Log In Now</a>
            </div>
        `;
        return;
    }

    const orders = JSON.parse(localStorage.getItem('ruthea_orders')) || [];

    if (orders.length === 0) {
        ordersContainer.innerHTML = '<div style="text-align:center; padding: 5rem;">No orders found. <a href="products.html" style="color: var(--main-color); font-weight: bold;">Start shopping</a></div>';
        return;
    }

    ordersContainer.innerHTML = '';
    orders.forEach(order => {
        const orderEl = document.createElement('div');
        orderEl.className = 'order-card';
        orderEl.innerHTML = `
            <div class="order-header">
                <strong>Order ID: ${order.id}</strong>
                <span>Date: ${order.date}</span>
            </div>
            <div class="order-items">
                ${order.items.map(item => `
                    <div class="order-item">
                        <span>${item.name} x ${item.quantity}</span>
                        <span>₱${(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                `).join('')}
            </div>
            <div class="order-footer">
                <strong>Total: ₱${order.total.toLocaleString()}</strong>
                <span class="order-status">Delivered</span>
            </div>
        `;
        ordersContainer.appendChild(orderEl);
    });
}

function initMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            menuToggle.innerHTML = navLinks.classList.contains('active') 
                ? '<i class="fas fa-times"></i>' 
                : '<i class="fas fa-bars"></i>';
        });

        // Close menu when a link is clicked
        const links = navLinks.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
            });
        });
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
    renderCart();
    renderOrders();
    initMobileMenu();
    checkAuthStatus();
});
