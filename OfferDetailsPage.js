// Application State
let offerData = null;
let selectedQuantities = {};

// Utility Functions
function formatPrice(price) {
    return `EGP ${parseFloat(price).toFixed(2)}`;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function calculateSavings(currentPrice, originalPrice) {
    const savings = ((originalPrice - currentPrice) / originalPrice * 100).toFixed(0);
    return `Save ${savings}%`;
}

function getOfferIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id') || '4';
}

// Core Business Logic
function getApplicableTier(content, quantity) {
    if (quantity === 0) return null;

    // Calculate total group size: existing applicants + selected quantity
    const totalGroupSize = content.numberOfApplicants + quantity;
    const sortedTiers = [...content.pricingTiers].sort((a, b) => a.quantity - b.quantity);
    let applicableTier = null;

    // Find the highest tier that the total group size qualifies for
    for (const tier of sortedTiers) {
        if (totalGroupSize >= tier.quantity) {
            applicableTier = tier;
        }
    }

    return applicableTier || sortedTiers[0];
}

function updateQuantity(contentId, change) {
    const content = offerData.data.offerContents.find(c => c.id === contentId);
    const currentQty = selectedQuantities[contentId] || 0;
    const currectMaxQuantityPerUser = content.maxQuantityPerUser - content.numberOfApplicants;
    const newQty = Math.max(0, Math.min(currectMaxQuantityPerUser, currentQty + change));

    if (newQty !== currentQty) {
        selectedQuantities[contentId] = newQty;
        updateUI();
        updateTotalSummary();

        // Initialize slider after content is rendered
        setTimeout(() => {
            initSliderEvents();
            startAutoPlay();
        }, 500);
    }
}

function updateUI() {
    offerData.data.offerContents.forEach(content => {
        const contentId = content.id;
        const quantity = selectedQuantities[contentId] || 0;
        const applicableTier = getApplicableTier(content, quantity);

        // Update quantity display
        const qtyDisplay = document.getElementById(`qty-${contentId}`);
        const minusBtn = document.getElementById(`minus-${contentId}`);
        const plusBtn = document.getElementById(`plus-${contentId}`);

        if (qtyDisplay) qtyDisplay.textContent = quantity;
        if (minusBtn) minusBtn.disabled = quantity <= 0;
        if (plusBtn) plusBtn.disabled = quantity >= content.maxQuantityPerUser;

        // Update tier cards with current status
        updateTierCards(content, quantity);

        // Update applied price
        // const appliedPriceEl = document.getElementById(`applied-price-${contentId}`);
        // if (appliedPriceEl) {
        //     if (quantity > 0 && applicableTier) {
        //         const totalPrice = quantity * applicableTier.currentPrice;
        //         const totalGroupSize = content.numberOfApplicants + quantity;
        //         appliedPriceEl.innerHTML = `
        //             <div class="applied-price-amount">
        //                 ${quantity} × ${formatPrice(applicableTier.currentPrice)} = ${formatPrice(totalPrice)}
        //             </div>
        //             <div class="applied-tier-info">
        //                 Applied tier: ${applicableTier.quantity}+ units (group size: ${totalGroupSize})
        //             </div>
        //         `;
        //         appliedPriceEl.style.display = 'block';
        //     } else {
        //         appliedPriceEl.style.display = 'none';
        //     }
        // }
    });
}

function updateTotalSummary() {
    let totalItems = 0;
    let totalPrice = 0;

    offerData.data.offerContents.forEach(content => {
        const quantity = selectedQuantities[content.id] || 0;
        if (quantity > 0) {
            const applicableTier = getApplicableTier(content, quantity);
            if (applicableTier) {
                totalItems += quantity;
                totalPrice += quantity * applicableTier.currentPrice;
            }
        }
    });

    document.getElementById('totalItems').textContent = `${totalItems} item${totalItems !== 1 ? 's' : ''} selected`;
    document.getElementById('totalPrice').textContent = formatPrice(totalPrice);
    document.getElementById('joinBtn').disabled = totalItems === 0;

    const fixedBottom = document.getElementById('fixedBottom');
    fixedBottom.style.display = totalItems > 0 ? 'block' : 'none';
}

// UI Generation Functions
function createTierCard(tier) {
    const savings = calculateSavings(tier.currentPrice, tier.originalPrice);

    return `
        <div class="tier-card" id="tier-${tier.id}">
            <div class="tier-header">
                <div class="tier-quantity">${tier.quantity}+ units</div>
                <div class="tier-pricing">
                    <div class="tier-current-price">${formatPrice(tier.currentPrice)}</div>
                    <div class="tier-original-price">${formatPrice(tier.originalPrice)}</div>
                    <div class="tier-savings">${savings}</div>
                </div>
            </div>
        </div>
    `;
}

function createContentCard(content) {
    const progress = (content.numberOfApplicants / content.maxQuantity) * 100;
    
    // Generate initial tier cards (quantity = 0)
    const tiersHTML = content.pricingTiers.map(tier => 
        createTierCard(tier, content, 0)
    ).join('');

    return `
        <div class="content-card">
            <div class="content-header">
                <div>
                    <h3 class="content-title">${content.title}</h3>
                    
                    <!-- Toggle Button -->
                    <button class="desc-toggle-btn" id="desc-btn-${content.id}" onclick="toggleDescription(${content.id})">
                        Show Details <span class="desc-toggle-icon" id="desc-icon-${content.id}">▼</span>
                    </button>
                    
                    <!-- Collapsible Description -->
                    <div class="content-desc-wrapper">
                        <div class="content-desc" id="desc-${content.id}"></div>
                    </div>
                </div>
                <div class="progress-info">
                    <div class="progress-text">${content.numberOfApplicants}/${content.maxQuantity} joined</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                </div>
            </div>
            
            <!-- Countdown Timer Section -->
            <div id="countdown-${content.id}"></div>
            
            <div class="applied-price" id="applied-price-${content.id}" style="display: none;"></div>
            
            <div class="pricing-tiers">
                <div class="tier-grid" id="tier-grid-${content.id}">
                    ${tiersHTML}
                </div>
            </div>
            
            <!-- Quantity Section (moved to the end) -->
            <div class="quantity-section">
                <div class="quantity-header">
                    <div class="quantity-controls">
                        <button class="quantity-btn" id="minus-${content.id}" onclick="updateQuantity(${content.id}, -1)">-</button>
                        <div class="quantity-display" id="qty-${content.id}">0</div>
                        <button class="quantity-btn" id="plus-${content.id}" onclick="updateQuantity(${content.id}, 1)">+</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderOfferDetails(data) {
    const offer = data.data;
    const contentsHTML = offer.offerContents.map(content => createContentCard(content)).join('');

    return `
        <div class="offer-hero">
            <div class="hero-content">
                <div>
                    <h1 class="hero-title">${offer.title}</h1>
                    <p class="hero-desc">${offer.desc}</p>
                    <div class="pricing-summary">
                        <span class="current-price">${formatPrice(offer.currentPrice)}</span>
                        <span class="original-price">${formatPrice(offer.originalPrice)}</span>
                        <span class="discount-badge">-${offer.discount}%</span>
                    </div>
                    <div class="supplier-info">
                        <img src="${offer.supplier.logo}" alt="${offer.supplier.name}" class="supplier-logo" />
                             
                        <div>
                            <div style="font-weight: 600; color: var(--dark);">${offer.supplier.name}</div>
                            <div style="font-size: 0.875rem; color: var(--gray-600);">${offer.supplier.fullAddress}</div>
                        </div>
                    </div>
                </div>
                ${createBannerSlider(offer.images)}
            </div>
        </div>
        
        <div class="offer-contents">
            ${contentsHTML}
        </div>
        
        ${offer.termsOfUse ? `
            <div class="terms">
                <h3>Terms of Use</h3>
                <p>${offer.termsOfUse}</p>
            </div>
        ` : ''}
    `;
}

// Banner Slider Functions
let currentSlide = 0;
let slideInterval;
let isAutoPlaying = true;
const autoPlayDelay = 4000; // 4 seconds

function createBannerSlider(images) {
    // Create multiple images for the slider (you can modify these URLs)
    const sliderImages = images.map((image, index) => {
        return {
            url: image.path || `https://via.placeholder.com/600x400?text=Slide+${index + 1}`,
            caption: image.name || `Slide ${index + 1}`,
            description: image.name || `Description for slide ${index + 1}`
        };
    });

    const slidesHTML = sliderImages.map((image, index) => `
        <div class="slider-slide">
            <img src="${image.url}" alt="${image.caption}" class="slider-image">
            <!--<div class="slider-overlay">
                <div class="slider-caption">${image.caption}</div>
                <div class="slider-description">${image.description}</div>
            </div>-->
        </div>
    `).join('');

    const dotsHTML = sliderImages.map((_, index) => `
        <div class="slider-dot ${index === 0 ? 'active' : ''}" onclick="goToSlide(${index})"></div>
    `).join('');

    return `
        <div class="banner-slider">
            <div class="slider-progress" id="sliderProgress"></div>
            <div class="slider-container">
                <div class="slider-track" id="sliderTrack">
                    ${slidesHTML}
                </div>
            </div>
            <button class="slider-nav prev" onclick="previousSlide()">❮</button>
            <button class="slider-nav next" onclick="nextSlide()">❯</button>
            <div class="slider-dots">
                ${dotsHTML}
            </div>
        </div>
    `;
}

function goToSlide(slideIndex) {
    const sliderTrack = document.getElementById('sliderTrack');
    const dots = document.querySelectorAll('.slider-dot');
    const totalSlides = dots.length;

    currentSlide = slideIndex;

    // Update slider position
    sliderTrack.style.transform = `translateX(-${currentSlide * 100}%)`;

    // Update dots
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlide);
    });

    // Reset auto-play
    resetAutoPlay();
}

function nextSlide() {
    const totalSlides = document.querySelectorAll('.slider-slide').length;
    const nextIndex = (currentSlide + 1) % totalSlides;
    goToSlide(nextIndex);
}

function previousSlide() {
    const totalSlides = document.querySelectorAll('.slider-slide').length;
    const prevIndex = (currentSlide - 1 + totalSlides) % totalSlides;
    goToSlide(prevIndex);
}

function startAutoPlay() {
    if (isAutoPlaying) {
        slideInterval = setInterval(() => {
            nextSlide();
        }, autoPlayDelay);

        // Update progress bar
        updateProgressBar();
    }
}

function stopAutoPlay() {
    if (slideInterval) {
        clearInterval(slideInterval);
    }

    const progressBar = document.getElementById('sliderProgress');
    if (progressBar) {
        progressBar.style.width = '0%';
    }
}

function resetAutoPlay() {
    stopAutoPlay();
    startAutoPlay();
}

function updateProgressBar() {
    const progressBar = document.getElementById('sliderProgress');
    if (progressBar) {
        progressBar.style.width = '0%';
        progressBar.style.transition = 'none';

        setTimeout(() => {
            progressBar.style.transition = `width ${autoPlayDelay}ms linear`;
            progressBar.style.width = '100%';
        }, 50);
    }
}

// Pause auto-play on hover
function initSliderEvents() {
    const slider = document.querySelector('.banner-slider');
    if (slider) {
        slider.addEventListener('mouseenter', stopAutoPlay);
        slider.addEventListener('mouseleave', startAutoPlay);

        // Touch events for mobile
        let startX = 0;
        let endX = 0;

        slider.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            stopAutoPlay();
        });

        slider.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            const diff = startX - endX;

            if (Math.abs(diff) > 50) { // Minimum swipe distance
                if (diff > 0) {
                    nextSlide();
                } else {
                    previousSlide();
                }
            }

            startAutoPlay();
        });
    }
}

function openOrderModal() {
    const selectedItems = getSelectedItems();

    if (selectedItems.length === 0) {
        showMessage('error', 'No Items Selected', 'Please select at least one item to join the group.');
        return;
    }

    // Update order summary
    updateOrderSummary(selectedItems);

    // Show modal
    const modal = document.getElementById('orderModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Focus first input
    setTimeout(() => {
        document.getElementById('firstName').focus();
    }, 300);
}

function closeOrderModal() {
    const modal = document.getElementById('orderModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';

    // Clear form errors
    clearFormErrors();
}

// Enhanced updateOrderSummary function with detailed pricing breakdown
function updateOrderSummary(selectedItems) {
    const summaryContainer = document.getElementById('orderSummaryItems');
    let summaryHTML = '';
    let totalOriginalPrice = 0;
    let totalDiscountedPrice = 0;

    // Generate order items with detailed pricing
    selectedItems.forEach(item => {
        const content = offerData.data.offerContents.find(c => c.id === item.contentId);
        const originalPricePerUnit = content.originalPrice;
        const discountedPricePerUnit = item.appliedTier.pricePerUnit;
        const itemOriginalTotal = item.quantity * originalPricePerUnit;
        const itemDiscountedTotal = item.totalPrice;

        totalOriginalPrice += itemOriginalTotal;
        totalDiscountedPrice += itemDiscountedTotal;

        summaryHTML += `
            <div class="order-item">
                <div class="order-item-details">
                    <div class="order-item-name">${item.quantity}x ${item.contentTitle}</div>
                </div>
                <div class="order-item-pricing">
                    <span class="original-price-small">${formatPrice(itemOriginalTotal)}</span>
                    <span class="discounted-price">${formatPrice(itemDiscountedTotal)}</span>
                </div>
            </div>
        `;
    });

    // Calculate deposit (30% of total original price)
    const depositAmount = totalOriginalPrice * 0.3;
    const remainingAmount = totalDiscountedPrice - depositAmount;

    // Add summary totals section
    summaryHTML += `
        <div class="summary-totals">
            <div class="summary-row">
                <span class="summary-label">Total Original Price:</span>
                <span class="summary-value">${formatPrice(totalOriginalPrice)}</span>
            </div>
            <div class="summary-row">
                <span class="summary-label">Total Discounted Price:</span>
                <span class="summary-value">${formatPrice(totalDiscountedPrice)}</span>
            </div>
            <div class="summary-row highlight">
                <span class="summary-label">Deposit (30% of Original):</span>
                <span class="summary-value deposit-value">${formatPrice(depositAmount)}</span>
            </div>
            <div class="summary-row total">
                <span class="summary-label">Remaining Amount:</span>
                <span class="summary-value remaining-value">${formatPrice(remainingAmount)}</span>
            </div>
        </div>
        <div class="summary-note">
            <strong>Note:</strong> The remaining amount shown is an estimate based on the current applied price tier and may change until the offer is considered completed.
        </div>
    `;

    summaryContainer.innerHTML = summaryHTML;
}

function getSelectedItems() {
    const selectedItems = [];

    offerData.data.offerContents.forEach(content => {
        const quantity = selectedQuantities[content.id] || 0;
        if (quantity > 0) {
            const applicableTier = getApplicableTier(content, quantity);
            if (applicableTier) {
                selectedItems.push({
                    contentId: content.id,
                    quantity: quantity,
                    contentTitle: content.title,
                    appliedTier: {
                        id: applicableTier.id,
                        minQuantity: applicableTier.quantity,
                        pricePerUnit: applicableTier.currentPrice
                    },
                    totalPrice: quantity * applicableTier.currentPrice,
                    originalPrice: content.originalPrice,
                    discountedPrice: applicableTier.currentPrice
                });
            }
        }
    });

    return selectedItems;
}

// Form Validation Functions
function validateForm() {
    let isValid = true;
    const requiredFields = [
        'firstName', 'lastName', 'phoneNumber', 'country',
        'state', 'street', 'building', 'apartment', 'floor'
    ];

    // Clear previous errors
    clearFormErrors();

    requiredFields.forEach(fieldName => {
        const field = document.getElementById(fieldName);
        const value = field.value.trim();

        if (!value) {
            showFieldError(fieldName, 'This field is required');
            isValid = false;
        } else {
            // Additional validation for specific fields
            if (fieldName === 'phoneNumber' || fieldName === 'mobileNumber') {
                if (value && !isValidPhoneNumber(value)) {
                    showFieldError(fieldName, 'Please enter a valid phone number');
                    isValid = false;
                }
            }

            if (fieldName === 'email' && value) {
                if (!isValidEmail(value)) {
                    showFieldError('email', 'Please enter a valid email address');
                    isValid = false;
                }
            }
        }
    });

    // Validate email if provided
    const email = document.getElementById('email').value.trim();
    if (email && !isValidEmail(email)) {
        showFieldError('email', 'Please enter a valid email address');
        isValid = false;
    }

    return isValid;
}

function showFieldError(fieldName, message) {
    const field = document.getElementById(fieldName);
    const errorElement = document.getElementById(`${fieldName}-error`);

    if (field) field.classList.add('error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
}

function clearFormErrors() {
    const errorElements = document.querySelectorAll('.error-message');
    const inputElements = document.querySelectorAll('.form-input');

    errorElements.forEach(el => {
        el.classList.remove('show');
        el.textContent = '';
    });

    inputElements.forEach(el => {
        el.classList.remove('error');
    });
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhoneNumber(phone) {
    // Basic phone validation - digits only, 7-15 characters
    const phoneRegex = /^[\d]{7,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

// Message Display Functions
function showMessage(type, title, content) {
    const messageModal = document.getElementById('messageModal');
    const messageIcon = document.getElementById('messageIcon');
    const messageIconText = document.getElementById('messageIconText');
    const messageTitle = document.getElementById('messageTitle');
    const messageContent = document.getElementById('messageContent');

    // Set icon and styling based on type
    if (type === 'success') {
        messageIcon.className = 'message-icon success';
        messageIconText.textContent = '✓';
    } else if (type === 'error') {
        messageIcon.className = 'message-icon error';
        messageIconText.textContent = '✕';
    }

    messageTitle.textContent = title;
    messageContent.innerHTML = content;

    // Show message modal
    messageModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeMessageModal() {
    const messageModal = document.getElementById('messageModal');
    messageModal.classList.remove('active');
    document.body.style.overflow = '';
}

function showSuccessMessage(deposit = null, orderNumber = null) {
    // Generate order number if not provided (for demo purposes)
    const displayOrderNumber = orderNumber || `SH${Date.now().toString().slice(-8)}`;

    const content = `
        <p style="margin-bottom: 16px;">Your order has been placed successfully! To complete your reservation, please follow these steps:</p>
        
        <div class="order-number-section">
            <div class="order-number-label">Your Order Number</div>
            <div class="order-number-value">#${displayOrderNumber}</div>
        </div>
        
        <div class="deposit-highlight">
            <div class="deposit-amount">${deposit || 0} LE</div>
            <div class="deposit-label">Required Deposit Amount</div>
        </div>
        
        <div class="urgency-warning">
            <span class="urgency-icon">⚠️</span>
            <span>Payment must be completed within 1 HOUR to secure your reservation!</span>
        </div>
        
        <div class="payment-info">
            <div class="payment-steps">
                <div class="payment-step">
                    <div class="step-number">1</div>
                    <div class="step-content">
                        <div class="step-title">Pay the Deposit (${deposit || 0} LE)</div>
                        <div class="step-description">Pay exactly <strong>${deposit || 0} LE</strong> using InstaPay to: <span class="phone-highlight">01118313501</span></div>
                    </div>
                </div>
                
                <div class="payment-step">
                    <div class="step-number">2</div>
                    <div class="step-content">
                        <div class="step-title">Send Payment Screenshot</div>
                        <div class="step-description">Send a clear screenshot of the transfer confirmation to <span class="phone-highlight">01118313501</span> via WhatsApp. <strong>Include your order number: #${displayOrderNumber}</strong></div>
                    </div>
                </div>
                
                <div class="payment-step">
                    <div class="step-number">3</div>
                    <div class="step-content">
                        <div class="step-title">Confirmation</div>
                        <div class="step-description">You will receive a confirmation message once your payment is verified</div>
                    </div>
                </div>
            </div>
        </div>
        
        <p style="margin-top: 12px; font-size: 0.8rem; color: var(--gray-600); line-height: 1.4;">
            <strong>Important:</strong> Your reservation will be confirmed only after payment verification. You have exactly <strong>1 hour</strong> from now to complete the payment, or your spot will be released to other customers. Please reference order number <strong>#${displayOrderNumber}</strong> in all communications.
        </p>
    `;

    showMessage('success', 'Order Placed Successfully!', content);
}

// Order Submission Functions
async function submitOrder() {
    if (!validateForm()) {
        return;
    }

    const selectedItems = getSelectedItems();
    if (selectedItems.length === 0) {
        showMessage('error', 'No Items Selected', 'No items selected. Please close this modal and select items first.');
        return;
    }

    // Show loading
    const submitBtn = document.getElementById('submitOrderBtn');
    const modalLoading = document.getElementById('modalLoading');
    submitBtn.disabled = true;
    modalLoading.style.display = 'flex';

    try {
        const orderData = buildOrderData(selectedItems);
        console.log('Order data:', orderData);

        // Submit order to API
        const result = await submitOrderToAPI(orderData);

        if (result.success) {
            // Show success message with order number
            const orderNumber = result.data?.orderId || result.data?.orderNumber;
            const deposit = result.data?.deposit || 200;
            showSuccessMessage(deposit, orderNumber);
            closeOrderModal();

            // Reset selections
            Object.keys(selectedQuantities).forEach(key => {
                selectedQuantities[key] = 0;
            });
            updateUI();
            updateTotalSummary();
        } else {
            throw new Error(result.message || 'Failed to place order');
        }

    } catch (error) {
        console.error('Order submission error:', error);
        showMessage('error', 'Order Failed', `Failed to place order: ${error.message}<br><br>Please try again or contact support if the problem persists.`);
    } finally {
        // Hide loading
        submitBtn.disabled = false;
        modalLoading.style.display = 'none';
    }
}

function buildOrderData(selectedItems) {
    // Get form data
    const formData = new FormData(document.getElementById('orderForm'));
    const formObject = Object.fromEntries(formData.entries());

    // Build phone numbers with country codes
    const phoneCountryCode = document.getElementById('phoneCountryCode').value;
    const mobileCountryCode = document.getElementById('mobileCountryCode').value;
    const phoneNumber = formObject.phoneNumber ? phoneCountryCode + formObject.phoneNumber : '';
    const mobileNumber = formObject.mobileNumber ? mobileCountryCode + formObject.mobileNumber : '';

    // Build the order object according to API requirements
    return {
        shipToAddress: {
            apartment: formObject.apartment,
            firstName: formObject.firstName,
            lastName: formObject.lastName,
            street: formObject.street,
            building: formObject.building,
            phoneNumber: phoneNumber,
            country: formObject.country,
            email: formObject.email || '',
            floor: formObject.floor,
            state: formObject.state,
            zipCode: formObject.zipCode || ''
        },
        mobileNumber: mobileNumber || phoneNumber,
        offerContents: selectedItems.map(item => ({
            offerContentId: item.contentId,
            quantity: item.quantity
        }))
    };
}

async function submitOrderToAPI(orderData) {
    try {
        // Uncomment this when your API is ready
        // const url = 'https://localhost:7255/api/Orders/place-validation-order';
        const url = 'https://shareshubapi-gmhbgtcqhef5dfcj.canadacentral-01.azurewebsites.net/api/Orders/place-validation-order';
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });

        const result = await response.json();

        if (response.ok && result.succeeded) {
            return { success: true, data: result.data };
        } else {
            throw new Error(result.message || 'Failed to submit order');
        }

        /*
        // Mock API call for demonstration
        return new Promise(resolve => {
            setTimeout(() => {
                // Simulate successful order submission
                resolve({
                    success: true,
                    data: {
                        orderId: 'ORDER-' + Date.now(),
                        message: 'Order placed successfully'
                    }
                });
            }, 2000);
        });
        */

    } catch (error) {
        throw new Error('Network error: ' + error.message);
    }
}

// Event Handlers
function goBack() {
    window.history.back();
}

function joinOffer() {
    openOrderModal();
}

// Share Feature Functions
// Share Menu State
let shareMenuOpen = false;

// Toggle Share Menu
function toggleShareMenu() {
    const shareMenu = document.getElementById('shareMenu');
    const shareOverlay = document.getElementById('shareOverlay');

    if (shareMenuOpen) {
        closeShareMenu();
    } else {
        openShareMenu();
    }
}

function openShareMenu() {
    const shareMenu = document.getElementById('shareMenu');
    const shareOverlay = document.getElementById('shareOverlay');

    shareMenu.classList.add('show');
    if (shareOverlay) shareOverlay.classList.add('show');
    shareMenuOpen = true;

    // Prevent body scroll on mobile
    document.body.style.overflow = 'hidden';
}

function closeShareMenu() {
    const shareMenu = document.getElementById('shareMenu');
    const shareOverlay = document.getElementById('shareOverlay');

    shareMenu.classList.remove('show');
    if (shareOverlay) shareOverlay.classList.remove('show');
    shareMenuOpen = false;

    // Restore body scroll
    document.body.style.overflow = '';
}

// Share Data Generator
function getShareData() {
    if (!offerData) return null;

    const offer = offerData.data;
    const currentUrl = window.location.href;

    return {
        title: offer.title,
        description: offer.desc,
        url: currentUrl,
        shortDescription: `${offer.title} - Save ${offer.discount}% now! Only ${formatPrice(offer.currentPrice)} instead of ${formatPrice(offer.originalPrice)}`
    };
}

// Share Functions
async function shareViaWebAPI() {
    const shareData = getShareData();
    if (!shareData) {
        showToast('Unable to share at this time');
        return;
    }

    if (navigator.share) {
        try {
            await navigator.share({
                title: shareData.title,
                text: shareData.shortDescription,
                url: shareData.url
            });
            closeShareMenu();
        } catch (error) {
            if (error.name !== 'AbortError') {
                copyOfferLink();
            }
        }
    } else {
        copyOfferLink();
    }
}

async function copyOfferLink() {
    const shareData = getShareData();
    if (!shareData) return;

    try {
        await navigator.clipboard.writeText(shareData.url);
        showToast('Link copied to clipboard!');
    } catch (error) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = shareData.url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast('Link copied to clipboard!');
    }
    closeShareMenu();
}

function shareViaWhatsApp() {
    const shareData = getShareData();
    if (!shareData) return;

    const message = `🔥 *${shareData.title}*\n\n${shareData.description}\n\n💰 ${shareData.shortDescription}\n\nCheck it out: ${shareData.url}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, '_blank');
    closeShareMenu();
}

function shareViaFacebook() {
    const shareData = getShareData();
    if (!shareData) return;

    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
    closeShareMenu();
}

function shareViaTwitter() {
    const shareData = getShareData();
    if (!shareData) return;

    const tweet = `🔥 ${shareData.shortDescription}\n\n${shareData.url}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`;

    window.open(twitterUrl, '_blank', 'width=600,height=400');
    closeShareMenu();
}

function shareViaEmail() {
    const shareData = getShareData();
    if (!shareData) return;

    const subject = `Amazing Deal: ${shareData.title}`;
    const body = `Hi there!\n\nI found this amazing deal:\n\n${shareData.title}\n${shareData.description}\n\nCheck it out: ${shareData.url}`;

    const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = emailUrl;
    closeShareMenu();
}

// Toast Notification
function showToast(message) {
    // Remove existing toast if any
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;

    // Toast styles
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--dark);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 0.9rem;
        z-index: 3000;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;

    document.body.appendChild(toast);

    // Show toast
    setTimeout(() => toast.style.opacity = '1', 100);

    // Hide toast after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        document.execCommand('copy');
        showToast('Link copied to clipboard!', 'success');
        trackShareEvent('copy_fallback');
    } catch (error) {
        console.error('Fallback copy failed:', error);
        showToast('Unable to copy link', 'error');
    }

    document.body.removeChild(textArea);
    toggleShareMenu(); // Close menu
}

// Track share events (for analytics)
function trackShareEvent(platform) {
    // Example: Google Analytics or custom analytics
    console.log(`Share event tracked: ${platform}`);
    // You can implement your analytics tracking here
    // gtag('event', 'share', { method: platform });
}

// API Functions
async function fetchOfferDetails(offerId) {
    try {
        // Uncomment this when your API is ready
        const url = `https://shareshubapi-gmhbgtcqhef5dfcj.canadacentral-01.azurewebsites.net/api/Offers/${offerId}/details`;
        // const url = `https://localhost:7255/api/Offers/${offerId}/details`

        const response = await fetch(url);
        const result = await response.json();

        if (result.succeeded) {
            return result;
        } else {
            throw new Error(result.message || 'Failed to fetch offer details');
        }

        /*
        // Using mock data for demonstration
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(mockOfferData);
            }, 1000);
        });
        */

    } catch (error) {
        throw new Error('Failed to load offer details: ' + error.message);
    }
}

// Close modal when clicking outside (for both modals)
document.addEventListener('click', function (event) {
    const orderModal = document.getElementById('orderModal');
    const messageModal = document.getElementById('messageModal');

    if (event.target === orderModal) {
        closeOrderModal();
    }

    if (event.target === messageModal) {
        closeMessageModal();
    }
});

// Close modal with Escape key (for both modals and share menu)
// Update the existing keydown event listener to include share menu
document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        const orderModal = document.getElementById('orderModal');
        const messageModal = document.getElementById('messageModal');

        if (orderModal.classList.contains('active')) {
            closeOrderModal();
        } else if (messageModal.classList.contains('active')) {
            closeMessageModal();
        } else if (shareMenuOpen) {
            closeShareMenu();
        }
    }
});

// Update the existing init function to include HTML content setting
async function init() {
    const contentElement = document.getElementById('content');
    const offerId = getOfferIdFromURL();

    try {
        offerData = await fetchOfferDetails(offerId);
        contentElement.innerHTML = renderOfferDetails(offerData);

        // Initialize selected quantities
        offerData.data.offerContents.forEach(content => {
            selectedQuantities[content.id] = 0;
        });

        updateUI();
        updateTotalSummary();
        
        // Initialize countdown timers, description states, and HTML content
        setTimeout(() => {
            initializeContentCountdowns();
            setDescriptionHTML(); // Set HTML content first
            initializeDescriptionStates(); // Then initialize collapse states
        }, 100);

    } catch (error) {
        contentElement.innerHTML = `
            <div style="text-align: center; padding: 60px 0;">
                <h2 style="color: var(--dark); margin-bottom: 16px;">Unable to Load Offer Details</h2>
                <p style="color: var(--gray-600); margin-bottom: 24px;">${error.message}</p>
                <button class="back-btn" onclick="goBack()">← Go Back</button>
            </div>
        `;
    }
}

// Countdown Timer for Content Cards
let contentCountdownIntervals = {};

function createContentCountdown(expirationDate, contentId) {
    const updateTimer = () => {
        const container = document.getElementById(`countdown-${contentId}`);
        if (!container) return false;

        const now = new Date().getTime();
        const expiry = new Date(expirationDate).getTime();
        const distance = expiry - now;

        if (distance < 0) {
            // Expired
            container.innerHTML = `
                <div class="countdown-section expired">
                    <div class="countdown-label">⏰ Offer Status</div>
                    <div class="countdown-expired-text">This offer has expired</div>
                </div>
            `;
            return false;
        }

        // Calculate time units
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Determine urgency (less than 24 hours)
        const isUrgent = distance <= 24 * 60 * 60 * 1000;
        const urgencyClass = isUrgent ? 'urgent' : '';

        // Format time display
        let timeDisplay = '';
        if (days > 0) {
            timeDisplay = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        } else if (hours > 0) {
            timeDisplay = `${hours}h ${minutes}m ${seconds}s`;
        } else if (minutes > 0) {
            timeDisplay = `${minutes}m ${seconds}s`;
        } else {
            timeDisplay = `${seconds}s`;
        }

        const label = isUrgent ? '⚠️ ENDING SOON!' : '⏰ Time Remaining';

        container.innerHTML = `
            <div class="countdown-section ${urgencyClass}">
                <div class="countdown-label">${label}</div>
                <div class="countdown-display">${timeDisplay}</div>
            </div>
        `;

        return true;
    };

    // Initial update
    if (updateTimer()) {
        // Clear existing interval if any
        if (contentCountdownIntervals[contentId]) {
            clearInterval(contentCountdownIntervals[contentId]);
        }

        // Set up new interval
        contentCountdownIntervals[contentId] = setInterval(() => {
            if (!updateTimer()) {
                clearInterval(contentCountdownIntervals[contentId]);
                delete contentCountdownIntervals[contentId];
            }
        }, 1000);
    }
}

// Initialize countdown for all content items
function initializeContentCountdowns() {
    if (!offerData) return;

    offerData.data.offerContents.forEach(content => {
        createContentCountdown(content.expirationDate, content.id);
    });
}

// Cleanup function
function cleanupContentCountdowns() {
    Object.values(contentCountdownIntervals).forEach(intervalId => {
        clearInterval(intervalId);
    });
    contentCountdownIntervals = {};
}

// Add cleanup event listener
window.addEventListener('beforeunload', cleanupContentCountdowns);

// Start the application
document.addEventListener('DOMContentLoaded', init);

// Description toggle state
let descriptionStates = {};

// Toggle description visibility
function toggleDescription(contentId) {
    const descElement = document.getElementById(`desc-${contentId}`);
    const iconElement = document.getElementById(`desc-icon-${contentId}`);
    const btnElement = document.getElementById(`desc-btn-${contentId}`);

    if (!descElement || !iconElement || !btnElement) return;

    // Get current state (default is collapsed)
    const isCurrentlyExpanded = descriptionStates[contentId] || false;

    if (isCurrentlyExpanded) {
        // Collapse
        descElement.classList.remove('expanded');
        descElement.classList.add('collapsed');
        iconElement.classList.remove('rotated');
        btnElement.innerHTML = `Show Details <span class="desc-toggle-icon" id="desc-icon-${contentId}">▼</span>`;
        descriptionStates[contentId] = false;
    } else {
        // Expand
        descElement.classList.remove('collapsed');
        descElement.classList.add('expanded');
        iconElement.classList.add('rotated');
        btnElement.innerHTML = `Hide Details <span class="desc-toggle-icon rotated" id="desc-icon-${contentId}">▼</span>`;
        descriptionStates[contentId] = true;
    }
}

// Initialize description states
function initializeDescriptionStates() {
    if (!offerData) return;

    offerData.data.offerContents.forEach(content => {
        // Start with collapsed state
        descriptionStates[content.id] = false;

        // Apply initial collapsed state
        setTimeout(() => {
            const descElement = document.getElementById(`desc-${content.id}`);
            if (descElement) {
                descElement.classList.add('collapsed');
            }
        }, 100);
    });
}

// Set HTML content for descriptions
function setDescriptionHTML() {
    if (!offerData) return;
    
    offerData.data.offerContents.forEach(content => {
        const descElement = document.getElementById(`desc-${content.id}`);
        if (descElement) {
            descElement.innerHTML = content.desc;
        }
    });
}


// Ahmed

// Calculate tier status based on total group size
function calculateTierStatus(content, tier, currentQuantity = 0) {
    const totalGroupSize = content.numberOfApplicants + currentQuantity;
    const isUnlocked = totalGroupSize >= tier.quantity;
    const isActive = getApplicableTier(content, currentQuantity)?.id === tier.id;
    
    return {
        isUnlocked,
        isActive,
        totalGroupSize,
        needed: Math.max(0, tier.quantity - totalGroupSize)
    };
}

// Enhanced tier card creation with status indicators
function createTierCard(tier, content, currentQuantity = 0) {
    const savings = calculateSavings(tier.currentPrice, tier.originalPrice);
    const status = calculateTierStatus(content, tier, currentQuantity);
    
    // Determine status classes and icons
    let statusClass = 'locked';
    let statusIcon = '🔒';
    let cardClass = 'locked';
    
    if (status.isActive) {
        statusClass = 'active';
        statusIcon = '⭐';
        cardClass = 'active';
    } else if (status.isUnlocked) {
        statusClass = 'unlocked';
        statusIcon = '🔓';
        cardClass = 'unlocked';
    }
    
    // Progress text
    let progressText = '';
    if (status.isActive) {
        progressText = `Current tier - ${status.totalGroupSize} users joined`;
    } else if (status.isUnlocked) {
        progressText = `Available - ${status.totalGroupSize} users joined`;
    } else {
        progressText = `Need ${status.needed} more user${status.needed !== 1 ? 's' : ''} to unlock`;
    }
    
    // Current tier badge
    const currentBadge = status.isActive ? '<div class="current-tier-badge">CURRENT TIER</div>' : '';
    
    return `
        <div class="tier-card ${cardClass}" id="tier-${tier.id}">
            ${currentBadge}
            <div class="tier-status ${statusClass}">
                ${statusIcon}
            </div>
            <div class="tier-header">
                <div class="tier-quantity">${tier.quantity}+ users</div>
                <div class="tier-pricing">
                    <div class="tier-current-price">${formatPrice(tier.currentPrice)}</div>
                    <div class="tier-original-price">${formatPrice(tier.originalPrice)}</div>
                    <div class="tier-savings">${savings}</div>
                </div>
            </div>
            <!--<div style="color: var(--gray-600); font-size: 0.875rem; margin-bottom: 8px;">${tier.title}</div>-->
            <div class="tier-progress ${statusClass}">
                ${progressText}
            </div>
        </div>
    `;
}

// Update tier cards with current status
function updateTierCards(content, currentQuantity = 0) {
    const tierGrid = document.querySelector(`#tier-grid-${content.id}`);
    if (!tierGrid) return;
    
    // Regenerate tier cards with current status
    const tiersHTML = content.pricingTiers.map(tier => 
        createTierCard(tier, content, currentQuantity)
    ).join('');
    
    tierGrid.innerHTML = tiersHTML;
}