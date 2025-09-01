// Application State
let categoriesData = null;
let dealsData = null;

// Banner Slider State
let currentSlide = 0;
let slideInterval;
let isAutoPlaying = true;
const autoPlayDelay = 4000; // 4 seconds

const API_URL = 'https://shareshubapi-gmhbgtcqhef5dfcj.canadacentral-01.azurewebsites.net/api';
// const API_URL = 'https://localhost:7255/api';

// Mock banner data (replace with actual API data)
const bannerData = [
    {
        id: 1,
        title: "",
        description: "Up to 58% off on all categories",
        image: "https://staticwebappimages.blob.core.windows.net/shareshubimages/Summer Sale Promotion Banner.png",
        link: "#"
    },
    // {
    //     id: 2,
    //     title: "Tech Deals",
    //     description: "Latest gadgets at unbeatable prices",
    //     image: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&h=400&fit=crop",
    //     link: "#"
    // },
    // {
    //     id: 3,
    //     title: "Fashion Week",
    //     description: "Trendy clothes for everyone",
    //     image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop",
    //     link: "#"
    // }
];

// Utility Functions
function formatPrice(price) {
    return `EGP ${parseFloat(price).toFixed(2)}`;
}

function showLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.classList.add('active');
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.classList.remove('active');
}

// Banner Slider Functions
function createBannerSlides() {
    const sliderTrack = document.getElementById('sliderTrack');
    const sliderDots = document.getElementById('sliderDots');
    
    if (!sliderTrack || !sliderDots) return;

    // Create slides
    const slidesHTML = bannerData.map((banner, index) => `
        <div class="slider-slide">
            <img src="${banner.image}" alt="${banner.title}" class="slider-image">
            <div class="slider-overlay">
                <div class="slider-caption">${banner.title}</div>
                <div class="slider-description">${banner.description}</div>
            </div>
        </div>
    `).join('');

    // Create dots
    const dotsHTML = bannerData.map((_, index) => `
        <div class="slider-dot ${index === 0 ? 'active' : ''}" onclick="goToSlide(${index})"></div>
    `).join('');

    sliderTrack.innerHTML = slidesHTML;
    sliderDots.innerHTML = dotsHTML;

    // Start auto-play
    startAutoPlay();
}

function goToSlide(slideIndex) {
    const sliderTrack = document.getElementById('sliderTrack');
    const dots = document.querySelectorAll('.slider-dot');
    
    if (!sliderTrack || !dots.length) return;

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
    const nextIndex = (currentSlide + 1) % bannerData.length;
    goToSlide(nextIndex);
}

function previousSlide() {
    const prevIndex = (currentSlide - 1 + bannerData.length) % bannerData.length;
    goToSlide(prevIndex);
}

function startAutoPlay() {
    if (isAutoPlaying && bannerData.length > 1) {
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

// Initialize slider events
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

// API Functions
async function fetchCategories() {
    try {
        const url = `${API_URL}/Categories/grouped-by-type?isDisplayedOnWeb=true`;

        const response = await fetch(url);
        const result = await response.json();

        if (result.succeeded) {
            return result.data;
        } else {
            throw new Error(result.message || 'Failed to fetch categories');
        }
    } catch (error) {
        console.error('Error fetching categories:', error);
        throw error;
    }
}

async function fetchFeaturedDeals() {
    try {
        const url = `${API_URL}/Offers/filtered?isDisplayedOnWeb=true`;

        const response = await fetch(url);
        const result = await response.json();

        if (result.succeeded) {
            return result.data.slice(0, 10); // Get first 10 deals for featured section
        } else {
            throw new Error(result.message || 'Failed to fetch deals');
        }
    } catch (error) {
        console.error('Error fetching deals:', error);
        throw error;
    }
}

// UI Generation Functions
function createCategoryCard(category) {
    const iconHTML = category.logo 
        ? `<img src="${category.logo}" alt="${category.name}" class="category-logo" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`
        : '';
    
    const fallbackIconHTML = `<div class="category-icon" ${category.logo ? 'style="display: none;"' : ''}>
        <i class="fas fa-${getCategoryIcon(category.name)}"></i>
    </div>`;

    return `
        <div class="category-card" onclick="navigateToCategory(${category.id}, '${category.name}')">
            ${iconHTML}
            ${fallbackIconHTML}
            <div class="category-name">${category.name}</div>
        </div>
    `;
}

function getCategoryIcon(categoryName) {
    const iconMap = {
        'Beauty Center': 'spa',
        'Cosmetics & Skin Care': 'palette',
        'Fitness': 'dumbbell',
        'Food': 'utensils',
        'Electronics': 'laptop',
        'Fashion': 'tshirt',
        'Health': 'heartbeat',
        'Education': 'graduation-cap',
        'Travel': 'plane',
        'Home': 'home'
    };
    
    return iconMap[categoryName] || 'tag';
}

function createDealCard(deal) {
    const progress = Math.floor(Math.random() * 80) + 10; // Mock progress
    const timeLeft = Math.floor(Math.random() * 48) + 1; // Mock time left

    const supplierLogoHTML = deal.supplier?.logo ? `
        <div class="supplier-logo">
            <img src="${deal.supplier.logo}" alt="${deal.supplier.name}" class="supplier-logo-img"
                 onerror="this.style.display='none';">
        </div>
    ` : '';

    return `
        <div class="deal-card" onclick="navigateToDeal(${deal.id})">
            <div class="deal-image-container">
                <img src="${deal.mainImageUrl}" alt="${deal.title}" class="deal-image">
                ${supplierLogoHTML}
            </div>
            <div class="deal-content">
                <div class="deal-title">
                    <b style="color: var(--secondary);">${deal.supplier?.name || 'SharesHub'}</b> 
                    UP TO <span style="color: var(--primary); font-size: 1.5rem;"><b>${deal.discount}%</b></span> OFF
                </div>
                <div class="deal-desc">${deal.desc}</div>
                <!--<div class="deal-pricing">
                    <span class="current-price">${formatPrice(deal.currentPrice)}</span>
                    <span class="original-price">${formatPrice(deal.originalPrice)}</span>
                </div>
                <div class="deal-progress">
                    <div class="progress-text">${progress}% sold</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                </div>-->
                <button class="join-btn" onclick="event.stopPropagation(); navigateToDeal(${deal.id})">
                    Discover More
                </button>
            </div>
        </div>
    `;
}

// Render Functions
function renderCategories(categoriesData) {
    const servicesContainer = document.getElementById('servicesGrid');
    const productsContainer = document.getElementById('productsGrid');

    if (!categoriesData || categoriesData.length === 0) {
        servicesContainer.innerHTML = '<div class="loading-placeholder"><p>No services available</p></div>';
        productsContainer.innerHTML = '<div class="loading-placeholder"><p>No products available</p></div>';
        return;
    }

    // Find services and products
    const servicesGroup = categoriesData.find(group => group.categoryType === 1);
    const productsGroup = categoriesData.find(group => group.categoryType === 2);

    // Render services
    if (servicesGroup && servicesGroup.categories.length > 0) {
        const servicesHTML = servicesGroup.categories.map(category => createCategoryCard(category)).join('');
        servicesContainer.innerHTML = servicesHTML;
    } else {
        servicesContainer.innerHTML = '<div class="loading-placeholder"><p>No services available</p></div>';
    }

    // Render products
    if (productsGroup && productsGroup.categories.length > 0) {
        const productsHTML = productsGroup.categories.map(category => createCategoryCard(category)).join('');
        productsContainer.innerHTML = productsHTML;
    } else {
        productsContainer.innerHTML = '<div class="loading-placeholder"><p>No products available</p></div>';
    }
}

function renderDeals(dealsData) {
    const dealsContainer = document.getElementById('dealsGrid');

    if (!dealsData || dealsData.length === 0) {
        dealsContainer.innerHTML = '<div class="loading-placeholder"><p>No deals available</p></div>';
        return;
    }

    const dealsHTML = dealsData.map(deal => createDealCard(deal)).join('');
    dealsContainer.innerHTML = dealsHTML;

    // Animate progress bars after render
    setTimeout(() => {
        const progressBars = document.querySelectorAll('.progress-fill');
        progressBars.forEach(bar => {
            const width = bar.style.width;
            bar.style.width = '0%';
            setTimeout(() => {
                bar.style.width = width;
            }, 100);
        });
    }, 100);
}

// Navigation Functions
function navigateToCategory(categoryId, categoryName) {
    // Navigate to offers page with category filter
    window.location.href = `offers.html?categoryId=${categoryId}`;
}

function navigateToDeal(dealId) {
    // Navigate to deal details page
    window.location.href = `OfferDetailsPage.html?id=${dealId}`;
}

function viewAllServices() {
    // Navigate to services page
    console.log('Navigate to all services');
    // Example: window.location.href = 'services.html';
}

function viewAllProducts() {
    // Navigate to products page
    console.log('Navigate to all products');
    // Example: window.location.href = 'products.html';
}

// function viewAllDeals() {
//     // Navigate to all deals page
//     window.location.href = 'index.html';
// }

// Header Functions
function toggleSearch() {
    console.log('Toggle search');
    // Implement search functionality
}

function toggleMenu() {
    console.log('Toggle menu');
    // Implement menu functionality
}

// Data Loading Functions
async function loadCategories() {
    try {
        const categories = await fetchCategories();
        categoriesData = categories;
        renderCategories(categories);
    } catch (error) {
        console.error('Failed to load categories:', error);
        renderCategories(null);
    }
}

async function loadDeals() {
    try {
        const deals = await fetchFeaturedDeals();
        dealsData = deals;
        renderDeals(deals);
    } catch (error) {
        console.error('Failed to load deals:', error);
        renderDeals(null);
    }
}

// Initialize Application
async function init() {
    try {
        showLoading();

        // Initialize banner slider
        createBannerSlides();
        initSliderEvents();

        // Load data in parallel
        await Promise.all([
            loadCategories(),
            loadDeals()
        ]);

    } catch (error) {
        console.error('Initialization error:', error);
    } finally {
        hideLoading();
    }
}

// Cleanup function
function cleanup() {
    stopAutoPlay();
}

// Event Listeners
window.addEventListener('beforeunload', cleanup);

// Start the application
document.addEventListener('DOMContentLoaded', init);