

// Mock data matching your API structure
const mockDeals = [
    {
        id: 4,
        title: "25% off @123 GYM",
        desc: "One year subscription with 55% off 123 GYM, Heliopolis! Only EGP 199 instead of EGP 446",
        categoryId: 2002,
        discount: 25,
        currentPrice: 150,
        originalPrice: 200,
        mainImageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop",
        offerType: 2,
        supplier: {
            name: "SharesHub",
            fullAddress: "Giza, October"
        }
    },
    {
        id: 5,
        title: "Premium Wireless Earbuds",
        desc: "High-quality wireless earbuds with noise cancellation and 24-hour battery life",
        categoryId: 1001,
        discount: 38,
        currentPrice: 79.99,
        originalPrice: 129.99,
        mainImageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=300&fit=crop",
        offerType: 1,
        supplier: {
            name: "TechHub",
            fullAddress: "Cairo, Maadi"
        }
    },
    {
        id: 6,
        title: "Home Fitness Ultimate Kit",
        desc: "Complete home workout solution with resistance bands, yoga mat, and dumbbells",
        categoryId: 2003,
        discount: 50,
        currentPrice: 94.99,
        originalPrice: 189.99,
        mainImageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop",
        offerType: 1,
        supplier: {
            name: "FitnessPro",
            fullAddress: "Alexandria, Smouha"
        }
    },
    {
        id: 7,
        title: "Smart Watch Series 5",
        desc: "Advanced fitness tracking, heart rate monitoring, and smartphone connectivity",
        categoryId: 1002,
        discount: 40,
        currentPrice: 149.99,
        originalPrice: 249.99,
        mainImageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop",
        offerType: 1,
        supplier: {
            name: "WearableTech",
            fullAddress: "Cairo, New Cairo"
        }
    }
];

function formatPrice(price) {
    return typeof price === 'number' ? `EGP ${price.toFixed(2)}` : `EGP ${price}`;
}

function calculateProgress() {
    const sold = Math.floor(Math.random() * 20) + 5;
    const total = Math.floor(Math.random() * 10) + 25;
    return { sold, total, percentage: (sold / total) * 100 };
}

function getTimeRemaining() {
    const hours = Math.floor(Math.random() * 72) + 1;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return { days, hours: remainingHours };
}

function createDealCard(deal) {
    const progress = calculateProgress();
    const timeLeft = getTimeRemaining();

    return `
                <div class="deal-card">
                    <div class="image-container">
                        <img src="${deal.mainImageUrl}" alt="${deal.title}" class="deal-image">
                        <div class="discount-badge">-${deal.discount}%</div>
                        <div class="overlay"></div>
                    </div>
                    <div class="card-content">
                        <h3 class="deal-title">${deal.title}</h3>
                        <p class="deal-desc">${deal.desc}</p>
                        
                        <div class="pricing">
                            <span class="current-price">${formatPrice(deal.currentPrice)}</span>
                            <span class="original-price">${formatPrice(deal.originalPrice)}</span>
                        </div>
                        
                        <!--<div class="progress-section">
                            <div class="progress-info">
                                <span>👥 ${progress.sold}/${progress.total} buyers joined</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${progress.percentage}%"></div>
                            </div>
                            <p class="progress-text">Need ${progress.total - progress.sold} more</p>
                        </div>
                        
                        <div class="timer">
                            <span>⏰</span>
                            <span>Ends in: ${timeLeft.days} days ${timeLeft.hours} hours</span>
                        </div>-->
                        
                        <button class="join-btn" onclick="joinGroup(${deal.id})">
                            Discover more
                            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2M14 4h6m0 0v6m0-6L10 14"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
}

function renderDeals(deals) {
    const dealsHTML = deals.map(deal => createDealCard(deal)).join('');

    return `
                <div class="header">
                    <div class="logo-title">
                        <img src="./SharesHub_Logo.jfif" alt="SharesHub Logo" class="logo" 
                             onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'45\' fill=\'%23ff8f4d\'/%3E%3Ctext x=\'50\' y=\'55\' text-anchor=\'middle\' fill=\'white\' font-size=\'20\' font-weight=\'bold\'%3ESH%3C/text%3E%3C/svg%3E';">
                        <h1 class="title">Featured Deals</h1>
                    </div>
                    <p class="subtitle">Discover amazing offers and save big on your favorite products and services</p>
                </div>
                
                <div class="deals-grid">
                    ${dealsHTML}
                </div>
            `;
}

// Simulate API call
async function fetchDeals() {
    try {
        // Uncomment this section when your API is ready

        const url = 'https://shareshubapi-gmhbgtcqhef5dfcj.canadacentral-01.azurewebsites.net/api/Offers/filtered?isDisplayedOnWeb=true&orderByCreatedDateDesc=true';
        // const url = 'https://localhost:7255/api/Offers/filtered?isDisplayedOnWeb=true&orderByCreatedDateDesc=true';

        const response = await fetch(url);
        const result = await response.json();

        if (result.succeeded) {
            return result.data;
        } else {
            throw new Error(result.message || 'Failed to fetch deals');
        }


        // Using mock data for demonstration
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(mockDeals);
            }, 1500);
        });

    } catch (error) {
        throw new Error('Failed to load deals: ' + error.message);
    }
}

// Event handlers
function joinGroup(dealId) {
    // Navigate to the offer details page
    window.location.href = `OfferDetailsPage.html?id=${dealId}`;
}

function viewAllDeals() {
    alert('Redirecting to all deals page...');
    // Add your navigation logic here
}

// Initialize the app
async function init() {
    const contentElement = document.getElementById('content');

    try {
        const deals = await fetchDeals();
        contentElement.innerHTML = renderDeals(deals);

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
        }, 500);

    } catch (error) {
        contentElement.innerHTML = `
                    <div class="header">
                        <div class="logo-title">
                            <img src="./SharesHub_Logo.jfif" alt="SharesHub Logo" class="logo" 
                                 onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'45\' fill=\'%23ff8f4d\'/%3E%3Ctext x=\'50\' y=\'55\' text-anchor=\'middle\' fill=\'white\' font-size=\'20\' font-weight=\'bold\'%3ESH%3C/text%3E%3C/svg%3E';">
                            <h2 style="color: var(--dark);">Unable to Load Deals</h2>
                        </div>
                        <p style="color: #6b7280;">${error.message}</p>
                    </div>
                `;
    }
}

// Start the app when page loads
document.addEventListener('DOMContentLoaded', init);
