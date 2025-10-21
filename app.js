// Configuration
const PRICE_PER_SQM = 200; // Price per square meter in GBP
const MIN_LENGTH = 300;
const MAX_LENGTH = 4000;
const MIN_WIDTH = 300;
const MAX_WIDTH = 1200;

// DOM Elements
const lengthInput = document.getElementById('length');
const widthInput = document.getElementById('width');
const thicknessSelect = document.getElementById('thickness');
const areaDisplay = document.getElementById('area');
const priceDisplay = document.getElementById('price');
const checkoutBtn = document.getElementById('checkout-btn');

// Initialize calculator
function initCalculator() {
    updatePrice();
    
    // Add event listeners
    lengthInput.addEventListener('input', updatePrice);
    widthInput.addEventListener('input', updatePrice);
    thicknessSelect.addEventListener('change', updatePrice);
    checkoutBtn.addEventListener('click', handleCheckout);
    
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('SW registered: ', registration.scope))
            .catch(error => console.log('SW registration failed: ', error));
    }
}

// Calculate and display price
function updatePrice() {
    const length = parseFloat(lengthInput.value) || 0;
    const width = parseFloat(widthInput.value) || 0;
    
    // Validate dimensions
    if (length < MIN_LENGTH || length > MAX_LENGTH) {
        alert(`Length must be between ${MIN_LENGTH}mm and ${MAX_LENGTH}mm`);
        lengthInput.value = Math.min(Math.max(length, MIN_LENGTH), MAX_LENGTH);
        return;
    }
    
    if (width < MIN_WIDTH || width > MAX_WIDTH) {
        alert(`Width must be between ${MIN_WIDTH}mm and ${MAX_WIDTH}mm`);
        widthInput.value = Math.min(Math.max(width, MIN_WIDTH), MAX_WIDTH);
        return;
    }
    
    // Calculate area in square meters
    const area = (length * width) / 1000000; // Convert mm² to m²
    const price = area * PRICE_PER_SQM;
    
    // Update displays
    areaDisplay.textContent = area.toFixed(2);
    priceDisplay.textContent = price.toFixed(2);
}

// Handle checkout process
async function handleCheckout() {
    const length = parseFloat(lengthInput.value);
    const width = parseFloat(widthInput.value);
    const thickness = parseInt(thicknessSelect.value);
    const area = (length * width) / 1000000;
    const price = area * PRICE_PER_SQM;
    
    // Create checkout session
    try {
        const response = await fetch('/stripe/create-checkout-session.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                length: length,
                width: width,
                thickness: thickness,
                area: area,
                price: price
            })
        });
        
        const session = await response.json();
        
        if (session.error) {
            throw new Error(session.error);
        }
        
        // Redirect to Stripe Checkout
        const stripe = Stripe('YOUR_STRIPE_PUBLIC_KEY'); // Replace with your actual public key
        const { error } = await stripe.redirectToCheckout({
            sessionId: session.id
        });
        
        if (error) {
            console.error('Error:', error);
            alert('An error occurred during checkout. Please try again.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initCalculator);
