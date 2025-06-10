// =================================================================
// AUTODEAL CLIENT - SCRIPT PRINCIPAL AMÉLIORÉ
// Version 2.0 avec fonctionnalités avancées
// =================================================================

// ===== VARIABLES GLOBALES =====
let db;
let isFirebaseConnected = false;
let cars = [];
let filteredCars = [];
let featuredCars = [];
let currentCarId = null;
let currentImageIndex = 0;
let currentPage = 1;
let itemsPerPage = 12;
let currentSort = 'recent';
let currentView = 'grid';
let currentFilters = {};

// Variables pour les fonctionnalités avancées
let favorites = JSON.parse(localStorage.getItem('autodeal_favorites') || '[]');
let savedSearches = JSON.parse(localStorage.getItem('autodeal_saved_searches') || '[]');
let viewHistory = JSON.parse(localStorage.getItem('autodeal_view_history') || '[]');
let searchHistory = JSON.parse(localStorage.getItem('autodeal_search_history') || '[]');

// Variables pour l'interface
let isAdvancedOptionsVisible = false;
let carImageIndices = {};

// ===== GESTIONNAIRE DE NOTIFICATIONS =====
class NotificationManager {
    constructor() {
        this.container = this.createContainer();
    }
    
    createContainer() {
        let container = document.getElementById('notificationContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notificationContainer';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
        return container;
    }
    
    show(message, type = 'info', duration = 4000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${this.getIcon(type)}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        this.container.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 100);
        
        const timeoutId = setTimeout(() => this.remove(notification), duration);
        
        notification.querySelector('.notification-close').onclick = () => {
            clearTimeout(timeoutId);
            this.remove(notification);
        };
        
        return notification;
    }
    
    getIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }
    
    remove(notification) {
        notification.classList.add('notification-exit');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
}

// ===== GESTIONNAIRE D'ANALYTICS =====
class ClientAnalytics {
    constructor() {
        this.events = JSON.parse(localStorage.getItem('client_analytics') || '[]');
        this.sessionId = this.getSessionId();
    }
    
    track(event, data = {}) {
        const eventData = {
            event,
            data,
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            page: window.location.pathname,
            userAgent: navigator.userAgent
        };
        
        this.events.push(eventData);
        this.saveToStorage();
        
        // Limit stored events
        if (this.events.length > 500) {
            this.events = this.events.slice(-500);
            this.saveToStorage();
        }
    }
    
    getSessionId() {
        let sessionId = sessionStorage.getItem('client_session_id');
        if (!sessionId) {
            sessionId = 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('client_session_id', sessionId);
        }
        return sessionId;
    }
    
    saveToStorage() {
        try {
            localStorage.setItem('client_analytics', JSON.stringify(this.events));
        } catch (e) {
            console.warn('Failed to save analytics:', e);
        }
    }
    
    getPopularCars() {
        const carViews = this.events.filter(e => e.event === 'car_view');
        const carCounts = {};
        
        carViews.forEach(event => {
            if (event.data.carId) {
                carCounts[event.data.carId] = (carCounts[event.data.carId] || 0) + 1;
            }
        });
        
        return Object.entries(carCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([carId, views]) => ({ carId, views }));
    }
}

// ===== INSTANCES GLOBALES =====
const notify = new NotificationManager();
const analytics = new ClientAnalytics();

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', async function() {
    showGlobalLoader(true);
    
    try {
        await initializeApp();
        analytics.track('app_start');
    } catch (error) {
        console.error('Erreur d\'initialisation:', error);
        notify.show('Erreur lors du chargement de l\'application', 'error');
    } finally {
        showGlobalLoader(false);
    }
});

async function initializeApp() {
    await initializeFirebase();
    
    if (isFirebaseConnected) {
        setupEventListeners();
        await loadCars();
        setupInterface();
        updateFavoritesCount();
        updateHeroStats();
        populateQuickSearch();
    }
}

// ===== CONFIGURATION FIREBASE =====
async function initializeFirebase() {
    const storedConfig = JSON.parse(localStorage.getItem('firebaseConfig') || '{}');
    
    if (!storedConfig.apiKey || !storedConfig.projectId) {
        notify.show('Configuration Firebase manquante. Veuillez configurer via l\'interface admin.', 'error');
        return;
    }

    try {
        const firebaseConfig = {
            apiKey: storedConfig.apiKey,
            authDomain: storedConfig.authDomain || `${storedConfig.projectId}.firebaseapp.com`,
            projectId: storedConfig.projectId,
            storageBucket: storedConfig.storageBucket || `${storedConfig.projectId}.appspot.com`,
            messagingSenderId: storedConfig.messagingSenderId || "123456789",
            appId: storedConfig.appId || "1:123456789:web:abcdef123456"
        };

        const app = window.firebaseApp.initializeApp(firebaseConfig);
        db = window.firebaseApp.getFirestore(app);

        // Test connection
        const testQuery = window.firebaseApp.query(
            window.firebaseApp.collection(db, 'cars'),
            window.firebaseApp.limit(1)
        );
        await window.firebaseApp.getDocs(testQuery);
        
        isFirebaseConnected = true;
        notify.show('✅ Connexion établie', 'success');
        
    } catch (error) {
        console.error('Erreur d\'initialisation Firebase:', error);
        notify.show('❌ Erreur de connexion à la base de données: ' + error.message, 'error');
    }
}

// ===== CHARGEMENT DES DONNÉES =====
async function loadCars() {
    if (!isFirebaseConnected) {
        notify.show('Connexion à la base de données requise', 'error');
        return;
    }

    showLoading(true);
    
    try {
        // Load available cars only
        const carsQuery = window.firebaseApp.query(
            window.firebaseApp.collection(db, 'cars'),
            window.firebaseApp.where('status', '==', 'available'),
            window.firebaseApp.orderBy('createdAt', 'desc')
        );
        
        const snapshot = await window.firebaseApp.getDocs(carsQuery);
        cars = [];
        
        snapshot.forEach(doc => {
            const data = doc.data();
            cars.push({ 
                id: doc.id, 
                ...data,
                createdAt: data.createdAt?.toDate?.() || new Date(),
                updatedAt: data.updatedAt?.toDate?.() || new Date()
            });
        });
        
        filteredCars = [...cars];
        setupFeaturedCars();
        populateFilters();
        sortAndDisplayCars();
        updateResultsInfo();
        
        analytics.track('cars_loaded', { count: cars.length });
        
    } catch (error) {
        console.error('Erreur chargement voitures:', error);
        notify.show('❌ Erreur lors du chargement des véhicules: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// ===== CONFIGURATION DE L'INTERFACE =====
function setupEventListeners() {
    // Menu toggle
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }

    // Filter controls
    ['brandFilter', 'yearFilter', 'priceFilter', 'cityFilter', 'fuelFilter', 
     'transmissionFilter', 'conditionFilter', 'doorsFilter', 'firstOwnerFilter'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', applyFilters);
        }
    });

    // Sort control
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            sortAndDisplayCars();
            analytics.track('sort_changed', { sort: currentSort });
        });
    }

    // View controls
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const view = e.target.dataset.view;
            if (view) switchView(view);
        });
    });

    // Search tabs
    document.querySelectorAll('.search-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            switchSearchTab(e.target.dataset.tab);
        });
    });

    // Modal close on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) closeModal(this.id);
        });
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);

    // Scroll events for lazy loading and animations
    window.addEventListener('scroll', debounce(handleScroll, 100));
    
    // Window resize for responsive adjustments
    window.addEventListener('resize', debounce(handleResize, 250));
}

function setupInterface() {
    // Initialize image indices
    carImageIndices = {};
    
    // Setup intersection observer for lazy loading
    setupLazyLoading();
    
    // Setup progressive enhancement
    enhanceInterface();
    
    // Load user preferences
    loadUserPreferences();
}

// ===== GESTION DE LA RECHERCHE =====
function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.querySelector('.search-clear');
    
    if (searchInput && clearBtn) {
        clearBtn.style.display = searchInput.value ? 'block' : 'none';
    }
    
    // Add to search history
    const searchTerm = searchInput?.value?.trim();
    if (searchTerm && searchTerm.length > 2) {
        addToSearchHistory(searchTerm);
        analytics.track('search_input', { searchTerm });
    }
    
    applyFilters();
}

function performSearch() {
    const searchTerm = document.getElementById('searchInput')?.value?.trim();
    if (searchTerm) {
        analytics.track('search_performed', { searchTerm });
        addToSearchHistory(searchTerm);
    }
    applyFilters();
    scrollToInventory();
}

function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.querySelector('.search-clear');
    
    if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
    }
    
    if (clearBtn) {
        clearBtn.style.display = 'none';
    }
    
    applyFilters();
}

function addToSearchHistory(searchTerm) {
    if (!searchHistory.includes(searchTerm)) {
        searchHistory.unshift(searchTerm);
        searchHistory = searchHistory.slice(0, 10); // Keep only last 10 searches
        localStorage.setItem('autodeal_search_history', JSON.stringify(searchHistory));
    }
}

// ===== GESTION DES FILTRES =====
function applyFilters() {
    const searchTerm = document.getElementById('searchInput')?.value?.toLowerCase() || '';
    
    const filters = {
        brand: document.getElementById('brandFilter')?.value || '',
        year: document.getElementById('yearFilter')?.value || '',
        price: document.getElementById('priceFilter')?.value || '',
        city: document.getElementById('cityFilter')?.value || '',
        fuel: document.getElementById('fuelFilter')?.value || '',
        transmission: document.getElementById('transmissionFilter')?.value || '',
        condition: document.getElementById('conditionFilter')?.value || '',
        doors: document.getElementById('doorsFilter')?.value || '',
        firstOwner: document.getElementById('firstOwnerFilter')?.value || ''
    };
    
    currentFilters = filters;
    
    filteredCars = cars.filter(car => {
        // Search in multiple fields
        const searchFields = [
            car.brand, car.model, car.description, car.vin,
            car.ownerName, car.city, car.district, car.color
        ].join(' ').toLowerCase();
        
        const matchesSearch = !searchTerm || searchFields.includes(searchTerm);
        
        // Apply all filters
        const matchesBrand = !filters.brand || car.brand === filters.brand;
        const matchesYear = !filters.year || car.year?.toString() === filters.year;
        const matchesCity = !filters.city || car.city === filters.city;
        const matchesFuel = !filters.fuel || car.fuel === filters.fuel;
        const matchesTransmission = !filters.transmission || car.transmission === filters.transmission;
        const matchesCondition = !filters.condition || car.condition === filters.condition;
        const matchesDoors = !filters.doors || car.doors?.toString() === filters.doors;
        const matchesFirstOwner = !filters.firstOwner || car.firstOwner === filters.firstOwner;
        
        let matchesPrice = true;
        if (filters.price) {
            const price = car.price || 0;
            switch (filters.price) {
                case '0-50000':
                    matchesPrice = price <= 50000;
                    break;
                case '50000-100000':
                    matchesPrice = price > 50000 && price <= 100000;
                    break;
                case '100000-200000':
                    matchesPrice = price > 100000 && price <= 200000;
                    break;
                case '200000-300000':
                    matchesPrice = price > 200000 && price <= 300000;
                    break;
                case '300000-500000':
                    matchesPrice = price > 300000 && price <= 500000;
                    break;
                case '500000+':
                    matchesPrice = price > 500000;
                    break;
            }
        }
        
        return matchesSearch && matchesBrand && matchesYear && matchesPrice && 
               matchesCity && matchesFuel && matchesTransmission && matchesCondition &&
               matchesDoors && matchesFirstOwner;
    });
    
    currentPage = 1;
    sortAndDisplayCars();
    updateResultsInfo();
    
    analytics.track('filters_applied', { 
        filtersCount: Object.values(filters).filter(v => v).length,
        searchTerm: searchTerm || null,
        resultsCount: filteredCars.length
    });
}

function resetAllFilters() {
    // Clear search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    
    // Clear search clear button
    const clearBtn = document.querySelector('.search-clear');
    if (clearBtn) {
        clearBtn.style.display = 'none';
    }
    
    // Reset all filter selects
    ['brandFilter', 'yearFilter', 'priceFilter', 'cityFilter', 'fuelFilter',
     'transmissionFilter', 'conditionFilter', 'doorsFilter', 'firstOwnerFilter'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.value = '';
        }
    });
    
    currentFilters = {};
    filteredCars = [...cars];
    currentPage = 1;
    sortAndDisplayCars();
    updateResultsInfo();
    
    notify.show('🔄 Filtres réinitialisés', 'info');
    analytics.track('filters_reset');
}

function filterByPrice(priceRange) {
    const priceFilter = document.getElementById('priceFilter');
    if (priceFilter) {
        priceFilter.value = priceRange;
        applyFilters();
        scrollToInventory();
        analytics.track('quick_price_filter', { priceRange });
    }
}

function filterByBrand(brand) {
    const brandFilter = document.getElementById('brandFilter');
    if (brandFilter) {
        brandFilter.value = brand;
        applyFilters();
        scrollToInventory();
        analytics.track('quick_brand_filter', { brand });
    }
}

function filterByCity(city) {
    const cityFilter = document.getElementById('cityFilter');
    if (cityFilter) {
        cityFilter.value = city;
        applyFilters();
        scrollToInventory();
        analytics.track('quick_city_filter', { city });
    }
}

// ===== TRI ET AFFICHAGE =====
function sortAndDisplayCars() {
    let sortedCars = [...filteredCars];
    
    switch (currentSort) {
        case 'recent':
            sortedCars.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        case 'priceAsc':
            sortedCars.sort((a, b) => (a.price || 0) - (b.price || 0));
            break;
        case 'priceDesc':
            sortedCars.sort((a, b) => (b.price || 0) - (a.price || 0));
            break;
        case 'mileage':
            sortedCars.sort((a, b) => (a.mileage || 0) - (b.mileage || 0));
            break;
        case 'year':
            sortedCars.sort((a, b) => (b.year || 0) - (a.year || 0));
            break;
        case 'brand':
            sortedCars.sort((a, b) => (a.brand || '').localeCompare(b.brand || ''));
            break;
    }
    
    displayCars(sortedCars);
    updatePagination(sortedCars.length);
}

function switchView(view) {
    currentView = view;
    
    // Update active button
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    
    // Update container class
    const container = document.getElementById('carsContainer');
    if (container) {
        container.className = `cars-container view-${view}`;
    }
    
    // Re-display cars with new view
    sortAndDisplayCars();
    
    // Save preference
    localStorage.setItem('autodeal_preferred_view', view);
    
    analytics.track('view_changed', { view });
}

// ===== AFFICHAGE DES VOITURES =====
function displayCars(carsToShow = filteredCars) {
    const grid = document.getElementById('carsGrid');
    const noResults = document.getElementById('noResults');
    
    if (!grid || !noResults) return;
    
    // Pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedCars = carsToShow.slice(startIndex, endIndex);
    
    if (paginatedCars.length === 0) {
        grid.innerHTML = '';
        noResults.classList.remove('hidden');
        return;
    }

    noResults.classList.add('hidden');
    
    grid.innerHTML = paginatedCars.map(car => {
        // Initialize image index
        if (!carImageIndices[car.id]) {
            carImageIndices[car.id] = 0;
        }
        
        const currentIndex = carImageIndices[car.id];
        const equipmentList = getCarEquipment(car);
        const isFavorite = favorites.includes(car.id);
        
        return `
            <div class="car-card" onclick="showCarDetails('${car.id}')" data-car-id="${car.id}">
                <div class="car-badges">
                    ${car.firstOwner === 'Oui' ? '<span class="badge badge-first-owner">1ère main</span>' : ''}
                    ${car.condition === 'Excellent' ? '<span class="badge badge-excellent">Excellent état</span>' : ''}
                    <button class="favorite-btn ${isFavorite ? 'active' : ''}" onclick="event.stopPropagation(); toggleFavorite('${car.id}')" title="${isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
                        ${isFavorite ? '❤️' : '🤍'}
                    </button>
                </div>
                
                <div class="car-images">
                    <div class="car-image" id="carImage-${car.id}">
                        ${car.photos && car.photos.length > 0 ? 
                            `<img src="${car.photos[currentIndex].data}" alt="${car.brand} ${car.model}" loading="lazy" onerror="this.src='assets/placeholder-car.jpg'">` :
                            '<div class="no-image"><span>📷</span><p>Aucune photo</p></div>'
                        }
                    </div>
                    ${car.photos && car.photos.length > 1 ? `
                        <button class="image-nav prev" onclick="event.stopPropagation(); prevImage('${car.id}')" aria-label="Image précédente">&lt;</button>
                        <button class="image-nav next" onclick="event.stopPropagation(); nextImage('${car.id}')" aria-label="Image suivante">&gt;</button>
                        <div class="image-dots">
                            ${car.photos.map((_, index) => `
                                <div class="image-dot ${index === currentIndex ? 'active' : ''}" onclick="event.stopPropagation(); showImage('${car.id}', ${index})"></div>
                            `).join('')}
                        </div>
                        <div class="photo-count">${car.photos.length} photos</div>
                    ` : ''}
                </div>
                
                <div class="car-info">
                    <div class="car-header">
                        <h3 class="car-title">${car.brand || ''} ${car.model || ''}</h3>
                        <div class="car-year">${car.year || 'N/A'}</div>
                    </div>
                    
                    <div class="car-specs">
                        <span class="spec-item">🛣️ ${formatNumber(car.mileage || 0)} km</span>
                        <span class="spec-item">⛽ ${car.fuel || 'N/A'}</span>
                        <span class="spec-item">⚙️ ${car.transmission || 'N/A'}</span>
                        ${car.color ? `<span class="spec-item">🎨 ${car.color}</span>` : ''}
                    </div>
                    
                    ${car.city ? `
                        <div class="car-location">
                            📍 ${car.city}${car.district ? ', ' + car.district : ''}
                        </div>
                    ` : ''}
                    
                    ${equipmentList.length > 0 ? `
                        <div class="car-equipment-preview">
                            ${equipmentList.slice(0, 3).map(eq => `<span class="equipment-tag">${eq}</span>`).join('')}
                            ${equipmentList.length > 3 ? `<span class="equipment-tag more">+${equipmentList.length - 3}</span>` : ''}
                        </div>
                    ` : ''}
                    
                    <div class="car-price">${formatPrice(car.price || 0)}</div>
                    
                    ${car.ownerPhone ? `
                        <div class="car-contact">
                            <button class="btn btn-primary btn-small" onclick="event.stopPropagation(); callOwner('${car.ownerPhone}')">
                                📞 Appeler
                            </button>
                            <button class="btn btn-success btn-small" onclick="event.stopPropagation(); whatsappOwner('${car.ownerPhone}', '${car.brand} ${car.model}')">
                                💬 WhatsApp
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    // Setup lazy loading for new images
    setupLazyLoadingForNewImages();
}

// ===== AFFICHAGE DES VOITURES EN VEDETTE =====
function setupFeaturedCars() {
    // Select featured cars (newest, most popular, or random)
    const popularCars = analytics.getPopularCars();
    featuredCars = [];
    
    // Add popular cars first
    popularCars.forEach(({ carId }) => {
        const car = cars.find(c => c.id === carId);
        if (car && featuredCars.length < 6) {
            featuredCars.push(car);
        }
    });
    
    // Fill remaining spots with newest cars
    const newestCars = [...cars]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .filter(car => !featuredCars.find(fc => fc.id === car.id))
        .slice(0, 6 - featuredCars.length);
    
    featuredCars.push(...newestCars);
    
    displayFeaturedCars();
}

function displayFeaturedCars() {
    const container = document.getElementById('featuredCars');
    if (!container || featuredCars.length === 0) return;
    
    container.innerHTML = featuredCars.slice(0, 6).map(car => `
        <div class="featured-car" onclick="showCarDetails('${car.id}')">
            <div class="featured-car-image">
                ${car.photos && car.photos.length > 0 ? 
                    `<img src="${car.photos[0].data}" alt="${car.brand} ${car.model}" loading="lazy">` :
                    '<div class="no-image">📷</div>'
                }
            </div>
            <div class="featured-car-info">
                <h4>${car.brand} ${car.model}</h4>
                <p>${car.year} • ${formatNumber(car.mileage)} km</p>
                <div class="featured-car-price">${formatPrice(car.price)}</div>
            </div>
        </div>
    `).join('');
}

// ===== DÉTAILS DES VOITURES =====
function showCarDetails(id) {
    const car = cars.find(c => c.id === id);
    if (!car) return;

    currentCarId = id;
    currentImageIndex = 0;

    // Add to view history
    addToViewHistory(car);
    
    // Update modal content
    updateCarDetailsModal(car);
    
    // Show modal
    const modal = document.getElementById('carDetailsModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
    
    analytics.track('car_view', { 
        carId: id, 
        brand: car.brand, 
        model: car.model,
        price: car.price 
    });
}

function updateCarDetailsModal(car) {
    // Update title
    const title = document.getElementById('carDetailsTitle');
    if (title) {
        title.textContent = `${car.brand || ''} ${car.model || ''} (${car.year || 'N/A'})`;
    }
    
    // Update basic info
    updateElement('carDetailsBrand', `${car.brand || ''} ${car.model || ''}`);
    updateElement('carDetailsPrice', formatPrice(car.price || 0));
    updateElement('carDetailsYear', car.year || 'N/A');
    updateElement('carDetailsMileage', formatNumber(car.mileage || 0) + ' km');
    
    // Update specifications
    updateElement('carDetailsFuel', car.fuel || 'Non spécifié');
    updateElement('carDetailsTransmission', car.transmission || 'Non spécifié');
    updateElement('carDetailsColor', car.color || 'Non spécifié');
    updateElement('carDetailsDoors', car.doors ? car.doors + ' portes' : 'Non spécifié');
    updateElement('carDetailsPower', car.fiscalPower ? car.fiscalPower + ' CV' : 'Non spécifié');
    updateElement('carDetailsCondition', car.condition || 'Non spécifié');
    
    // Update description
    updateElement('carDescription', car.description || 'Aucune description disponible.');
    
    // Update location
    updateElement('carLocationDetails', 
        car.city || car.district ? 
        `${car.city || ''}${car.district ? ', ' + car.district : ''}` : 
        'Non spécifiée'
    );
    
    // Update equipment
    const equipment = getCarEquipment(car);
    const equipmentContainer = document.getElementById('carEquipment');
    if (equipmentContainer) {
        equipmentContainer.innerHTML = equipment.length > 0 ?
            equipment.map(eq => `<span class="equipment-tag">${eq}</span>`).join('') :
            '<p>Aucun équipement renseigné</p>';
    }
    
    // Update owner contact
    updateOwnerContact(car);
    
    // Update images
    updateCarImages(car);
    
    // Update favorite button
    updateFavoriteButton(car.id);
}

function updateOwnerContact(car) {
    const ownerContainer = document.getElementById('carOwner');
    const callButton = document.getElementById('callButton');
    const whatsappButton = document.getElementById('whatsappButton');
    
    if (ownerContainer) {
        ownerContainer.innerHTML = `
            <div class="owner-details">
                <div class="owner-name">${car.ownerName || 'Non renseigné'}</div>
                <div class="owner-phone">${formatPhoneNumber(car.ownerPhone || 'Non renseigné')}</div>
            </div>
        `;
    }
    
    if (callButton) {
        callButton.href = car.ownerPhone ? `tel:${car.ownerPhone}` : '#';
        callButton.onclick = car.ownerPhone ? () => callOwner(car.ownerPhone) : null;
    }
    
    if (whatsappButton) {
        whatsappButton.href = car.ownerPhone ? 
            `https://wa.me/212${car.ownerPhone.replace(/^0/, '')}?text=Bonjour, je suis intéressé par votre ${car.brand} ${car.model} (${car.year})` : 
            '#';
        whatsappButton.onclick = car.ownerPhone ? 
            () => whatsappOwner(car.ownerPhone, `${car.brand} ${car.model}`) : null;
    }
}

function updateCarImages(car) {
    const imagesContainer = document.getElementById('carDetailsImages');
    if (!imagesContainer) return;

    if (car.photos && car.photos.length > 0) {
        imagesContainer.innerHTML = `
            <div class="main-image">
                <img src="${car.photos[currentImageIndex].data}" alt="${car.brand || ''} ${car.model || ''}" id="mainCarImage">
                ${car.photos.length > 1 ? `
                    <button class="image-nav prev" onclick="prevCarImage()" aria-label="Image précédente">&lt;</button>
                    <button class="image-nav next" onclick="nextCarImage()" aria-label="Image suivante">&gt;</button>
                ` : ''}
            </div>
            ${car.photos.length > 1 ? `
                <div class="image-thumbnails">
                    ${car.photos.map((photo, index) => `
                        <div class="thumbnail ${index === currentImageIndex ? 'active' : ''}" onclick="showCarImage(${index})">
                            <img src="${photo.data}" alt="Photo ${index + 1}">
                        </div>
                    `).join('')}
                </div>
                <div class="image-counter">${currentImageIndex + 1} / ${car.photos.length}</div>
            ` : ''}
        `;
    } else {
        imagesContainer.innerHTML = `
            <div class="no-image-large">
                <span>📷</span>
                <p>Aucune photo disponible</p>
            </div>
        `;
    }
}

// ===== NAVIGATION DES IMAGES =====
function prevImage(carId) {
    const car = cars.find(c => c.id === carId);
    if (!car || !car.photos || car.photos.length <= 1) return;
    
    carImageIndices[carId] = carImageIndices[carId] > 0 ? carImageIndices[carId] - 1 : car.photos.length - 1;
    updateCarImage(carId);
}

function nextImage(carId) {
    const car = cars.find(c => c.id === carId);
    if (!car || !car.photos || car.photos.length <= 1) return;
    
    carImageIndices[carId] = carImageIndices[carId] < car.photos.length - 1 ? carImageIndices[carId] + 1 : 0;
    updateCarImage(carId);
}

function showImage(carId, index) {
    const car = cars.find(c => c.id === carId);
    if (!car || !car.photos || index >= car.photos.length) return;
    
    carImageIndices[carId] = index;
    updateCarImage(carId);
}

function updateCarImage(carId) {
    const car = cars.find(c => c.id === carId);
    if (!car || !car.photos) return;
    
    const imageElement = document.getElementById(`carImage-${carId}`);
    const currentIndex = carImageIndices[carId];
    
    if (imageElement) {
        imageElement.innerHTML = `<img src="${car.photos[currentIndex].data}" alt="${car.brand} ${car.model}" loading="lazy">`;
    }
    
    // Update dots
    const card = imageElement?.closest('.car-card');
    if (card) {
        const dots = card.querySelectorAll('.image-dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentIndex);
        });
    }
}

function prevCarImage() {
    const car = cars.find(c => c.id === currentCarId);
    if (!car || !car.photos || car.photos.length <= 1) return;
    
    currentImageIndex = currentImageIndex > 0 ? currentImageIndex - 1 : car.photos.length - 1;
    updateCarImages(car);
}

function nextCarImage() {
    const car = cars.find(c => c.id === currentCarId);
    if (!car || !car.photos || car.photos.length <= 1) return;
    
    currentImageIndex = currentImageIndex < car.photos.length - 1 ? currentImageIndex + 1 : 0;
    updateCarImages(car);
}

function showCarImage(index) {
    const car = cars.find(c => c.id === currentCarId);
    if (!car || !car.photos || index >= car.photos.length) return;
    
    currentImageIndex = index;
    updateCarImages(car);
}

// ===== GESTION DES FAVORIS =====
function toggleFavorite(carId) {
    const car = cars.find(c => c.id === carId);
    if (!car) return;
    
    const index = favorites.indexOf(carId);
    
    if (index > -1) {
        favorites.splice(index, 1);
        notify.show('❤️ Retiré des favoris', 'info');
        analytics.track('favorite_removed', { carId, brand: car.brand, model: car.model });
    } else {
        favorites.push(carId);
        notify.show('❤️ Ajouté aux favoris', 'success');
        analytics.track('favorite_added', { carId, brand: car.brand, model: car.model });
    }
    
    localStorage.setItem('autodeal_favorites', JSON.stringify(favorites));
    updateFavoritesCount();
    updateFavoriteButton(carId);
    
    // Update UI
    const favoriteBtn = document.querySelector(`[data-car-id="${carId}"] .favorite-btn`);
    if (favoriteBtn) {
        favoriteBtn.classList.toggle('active', favorites.includes(carId));
        favoriteBtn.textContent = favorites.includes(carId) ? '❤️' : '🤍';
    }
}

function updateFavoriteButton(carId) {
    const favoriteButtonText = document.getElementById('favoriteButtonText');
    if (favoriteButtonText) {
        const isFavorite = favorites.includes(carId);
        favoriteButtonText.textContent = isFavorite ? '❤️ Retirer des favoris' : '❤️ Ajouter aux favoris';
    }
}

function updateFavoritesCount() {
    const countElement = document.getElementById('favoritesCount');
    if (countElement) {
        countElement.textContent = favorites.length;
    }
}

function toggleFavorites() {
    showFavoritesModal();
}

function showFavoritesModal() {
    const modal = document.getElementById('favoritesModal');
    const content = document.getElementById('favoritesContent');
    
    if (!modal || !content) return;
    
    if (favorites.length === 0) {
        content.innerHTML = `
            <div class="empty-favorites">
                <div class="empty-icon">❤️</div>
                <h3>Aucun favori</h3>
                <p>Ajoutez des véhicules à vos favoris pour les retrouver facilement</p>
                <button class="btn btn-primary" onclick="closeModal('favoritesModal')">Explorer les véhicules</button>
            </div>
        `;
    } else {
        const favoriteCars = cars.filter(car => favorites.includes(car.id));
        content.innerHTML = `
            <div class="favorites-grid">
                ${favoriteCars.map(car => `
                    <div class="favorite-item" onclick="showCarDetails('${car.id}')">
                        <div class="favorite-image">
                            ${car.photos && car.photos.length > 0 ? 
                                `<img src="${car.photos[0].data}" alt="${car.brand} ${car.model}">` :
                                '<div class="no-image">📷</div>'
                            }
                        </div>
                        <div class="favorite-info">
                            <h4>${car.brand} ${car.model}</h4>
                            <p>${car.year} • ${formatNumber(car.mileage)} km</p>
                            <div class="favorite-price">${formatPrice(car.price)}</div>
                        </div>
                        <button class="remove-favorite" onclick="event.stopPropagation(); toggleFavorite('${car.id}')" title="Retirer des favoris">
                            ❌
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    modal.style.display = 'block';
    analytics.track('favorites_viewed');
}

// ===== RECHERCHES SAUVEGARDÉES =====
function saveSearchPreset() {
    const searchTerm = document.getElementById('searchInput')?.value?.trim() || '';
    const activeFilters = Object.entries(currentFilters).filter(([key, value]) => value);
    
    if (!searchTerm && activeFilters.length === 0) {
        notify.show('Aucun critère de recherche à sauvegarder', 'warning');
        return;
    }
    
    const presetName = prompt('Nom de la recherche sauvegardée:');
    if (!presetName) return;
    
    const preset = {
        id: Date.now(),
        name: presetName,
        searchTerm,
        filters: currentFilters,
        createdAt: new Date().toISOString(),
        resultsCount: filteredCars.length
    };
    
    savedSearches.unshift(preset);
    savedSearches = savedSearches.slice(0, 10); // Keep only 10 saved searches
    
    localStorage.setItem('autodeal_saved_searches', JSON.stringify(savedSearches));
    
    notify.show(`💾 Recherche "${presetName}" sauvegardée`, 'success');
    analytics.track('search_saved', { presetName, filtersCount: activeFilters.length });
}

function showSavedSearches() {
    const modal = document.getElementById('savedSearchesModal');
    const content = document.getElementById('savedSearchesContent');
    
    if (!modal || !content) return;
    
    if (savedSearches.length === 0) {
        content.innerHTML = `
            <div class="empty-searches">
                <div class="empty-icon">📂</div>
                <h3>Aucune recherche sauvegardée</h3>
                <p>Sauvegardez vos recherches favorites pour y accéder rapidement</p>
                <button class="btn btn-primary" onclick="closeModal('savedSearchesModal')">Fermer</button>
            </div>
        `;
    } else {
        content.innerHTML = `
            <div class="saved-searches-list">
                ${savedSearches.map(search => `
                    <div class="saved-search-item">
                        <div class="search-info">
                            <h4>${search.name}</h4>
                            <div class="search-details">
                                ${search.searchTerm ? `<span class="search-term">🔍 "${search.searchTerm}"</span>` : ''}
                                <span class="search-filters">${Object.values(search.filters).filter(v => v).length} filtre(s)</span>
                                <span class="search-date">${formatDate(search.createdAt)}</span>
                                <span class="search-results">${search.resultsCount} résultat(s)</span>
                            </div>
                        </div>
                        <div class="search-actions">
                            <button class="btn btn-primary btn-small" onclick="applySavedSearch(${search.id})">Appliquer</button>
                            <button class="btn btn-outline btn-small" onclick="deleteSavedSearch(${search.id})">Supprimer</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    modal.style.display = 'block';
    analytics.track('saved_searches_viewed');
}

function applySavedSearch(searchId) {
    const search = savedSearches.find(s => s.id === searchId);
    if (!search) return;
    
    // Apply search term
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = search.searchTerm || '';
    }
    
    // Apply filters
    Object.entries(search.filters).forEach(([key, value]) => {
        const element = document.getElementById(key);
        if (element) {
            element.value = value;
        }
    });
    
    // Update search clear button
    const clearBtn = document.querySelector('.search-clear');
    if (clearBtn) {
        clearBtn.style.display = search.searchTerm ? 'block' : 'none';
    }
    
    applyFilters();
    closeModal('savedSearchesModal');
    scrollToInventory();
    
    notify.show(`✅ Recherche "${search.name}" appliquée`, 'success');
    analytics.track('saved_search_applied', { searchId, searchName: search.name });
}

function deleteSavedSearch(searchId) {
    if (!confirm('Supprimer cette recherche sauvegardée ?')) return;
    
    savedSearches = savedSearches.filter(s => s.id !== searchId);
    localStorage.setItem('autodeal_saved_searches', JSON.stringify(savedSearches));
    
    showSavedSearches(); // Refresh modal
    notify.show('🗑️ Recherche supprimée', 'info');
    analytics.track('saved_search_deleted', { searchId });
}

// ===== CONTACT PROPRIÉTAIRE =====
function callOwner(phone) {
    if (phone) {
        window.location.href = `tel:${phone}`;
        analytics.track('owner_called', { phone });
    }
}

function whatsappOwner(phone, carName) {
    if (phone) {
        const message = encodeURIComponent(`Bonjour, je suis intéressé par votre ${carName}. Pouvez-vous me donner plus d'informations ?`);
        const cleanPhone = phone.replace(/^0/, '212'); // Convert Moroccan number
        window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
        analytics.track('whatsapp_opened', { phone, carName });
    }
}

function shareVehicle(carId) {
    const car = cars.find(c => c.id === carId);
    if (!car) return;
    
    const shareData = {
        title: `${car.brand} ${car.model} (${car.year})`,
        text: `Découvrez cette ${car.brand} ${car.model} de ${car.year} à ${formatPrice(car.price)}`,
        url: `${window.location.origin}${window.location.pathname}?car=${carId}`
    };
    
    if (navigator.share) {
        navigator.share(shareData)
            .then(() => analytics.track('vehicle_shared', { carId, method: 'native' }))
            .catch(err => console.log('Error sharing:', err));
    } else {
        // Fallback to clipboard
        const shareText = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
        navigator.clipboard.writeText(shareText)
            .then(() => {
                notify.show('📋 Lien copié dans le presse-papiers', 'success');
                analytics.track('vehicle_shared', { carId, method: 'clipboard' });
            })
            .catch(err => {
                notify.show('❌ Impossible de copier le lien', 'error');
            });
    }
}

// ===== HISTORIQUE DES VUES =====
function addToViewHistory(car) {
    const viewItem = {
        carId: car.id,
        brand: car.brand,
        model: car.model,
        year: car.year,
        price: car.price,
        viewedAt: new Date().toISOString()
    };
    
    // Remove if already exists
    viewHistory = viewHistory.filter(item => item.carId !== car.id);
    
    // Add to beginning
    viewHistory.unshift(viewItem);
    
    // Keep only last 20 views
    viewHistory = viewHistory.slice(0, 20);
    
    localStorage.setItem('autodeal_view_history', JSON.stringify(viewHistory));
}

// ===== RECHERCHE RAPIDE =====
function switchSearchTab(tab) {
    // Remove active class from all tabs
    document.querySelectorAll('.search-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.search-tab-content').forEach(c => c.classList.remove('active'));
    
    // Add active class to selected tab
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(tab + 'Tab').classList.add('active');
    
    analytics.track('quick_search_tab_switched', { tab });
}

function populateQuickSearch() {
    populateBrandGrid();
    populateCityGrid();
}

function populateBrandGrid() {
    const container = document.getElementById('brandGrid');
    if (!container) return;
    
    const brands = [...new Set(cars.map(car => car.brand).filter(brand => brand))].sort();
    const brandCounts = {};
    
    cars.forEach(car => {
        if (car.brand) {
            brandCounts[car.brand] = (brandCounts[car.brand] || 0) + 1;
        }
    });
    
    container.innerHTML = brands.slice(0, 12).map(brand => `
        <button class="brand-item" onclick="filterByBrand('${brand}')">
            <div class="brand-name">${brand}</div>
            <div class="brand-count">${brandCounts[brand]} véhicule(s)</div>
        </button>
    `).join('');
}

function populateCityGrid() {
    const container = document.getElementById('cityGrid');
    if (!container) return;
    
    const cities = [...new Set(cars.map(car => car.city).filter(city => city))].sort();
    const cityCounts = {};
    
    cars.forEach(car => {
        if (car.city) {
            cityCounts[car.city] = (cityCounts[car.city] || 0) + 1;
        }
    });
    
    container.innerHTML = cities.slice(0, 12).map(city => `
        <button class="city-item" onclick="filterByCity('${city}')">
            <div class="city-name">${city}</div>
            <div class="city-count">${cityCounts[city]} véhicule(s)</div>
        </button>
    `).join('');
}

// ===== FONCTIONS UTILITAIRES =====
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function scrollToInventory() {
    const inventorySection = document.getElementById('inventory');
    if (inventorySection) {
        inventorySection.scrollIntoView({ behavior: 'smooth' });
    }
}

function getCarEquipment(car) {
    const equipment = [];
    const equipmentMap = {
        airCon: 'Climatisation',
        powerSteering: 'Direction assistée',
        electricWindows: 'Vitres électriques',
        abs: 'ABS',
        airbags: 'Airbags',
        gps: 'GPS',
        bluetooth: 'Bluetooth',
        cruiseControl: 'Régulateur',
        centralLocking: 'Fermeture centralisée',
        parkingSensors: 'Capteurs parking',
        sunroof: 'Toit ouvrant',
        leatherSeats: 'Sièges cuir'
    };
    
    Object.keys(equipmentMap).forEach(key => {
        if (car[key]) {
            equipment.push(equipmentMap[key]);
        }
    });
    
    return equipment;
}

function formatPrice(price) {
    if (!price) return '0 DHS';
    return new Intl.NumberFormat('fr-MA', {
        style: 'currency',
        currency: 'MAD',
        minimumFractionDigits: 0
    }).format(price).replace('MAD', 'DHS');
}

function formatNumber(number) {
    if (!number) return '0';
    return new Intl.NumberFormat('fr-FR').format(number);
}

function formatDate(dateString) {
    if (!dateString) return 'Non renseigné';
    return new Date(dateString).toLocaleDateString('fr-FR');
}

function formatPhoneNumber(phone) {
    if (!phone || phone === 'Non renseigné') return phone;
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return cleaned.replace(/(\d{4})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4');
    }
    return phone;
}

// ===== FONCTIONS DE PAGINATION =====
function updatePagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const pagination = document.getElementById('pagination');
    const currentPageSpan = document.getElementById('currentPage');
    const totalPagesSpan = document.getElementById('totalPages');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    if (totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    }
    
    pagination.style.display = 'flex';
    
    if (currentPageSpan) currentPageSpan.textContent = currentPage;
    if (totalPagesSpan) totalPagesSpan.textContent = totalPages;
    
    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        sortAndDisplayCars();
        updatePagination(filteredCars.length);
        scrollToInventory();
        analytics.track('page_changed', { page: currentPage, direction: 'previous' });
    }
}

function nextPage() {
    const totalPages = Math.ceil(filteredCars.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        sortAndDisplayCars();
        updatePagination(filteredCars.length);
        scrollToInventory();
        analytics.track('page_changed', { page: currentPage, direction: 'next' });
    }
}

// ===== POPULATION DES FILTRES =====
function populateFilters() {
    // Brands
    const brands = [...new Set(cars.map(car => car.brand).filter(brand => brand))].sort();
    const brandFilter = document.getElementById('brandFilter');
    if (brandFilter) {
        brandFilter.innerHTML = '<option value="">Toutes les marques</option>' +
            brands.map(brand => `<option value="${brand}">${brand}</option>`).join('');
    }

    // Years
    const years = [...new Set(cars.map(car => car.year).filter(year => year))].sort((a, b) => b - a);
    const yearFilter = document.getElementById('yearFilter');
    if (yearFilter) {
        yearFilter.innerHTML = '<option value="">Toutes les années</option>' +
            years.map(year => `<option value="${year}">${year}</option>`).join('');
    }

    // Cities
    const cities = [...new Set(cars.map(car => car.city).filter(city => city))].sort();
    const cityFilter = document.getElementById('cityFilter');
    if (cityFilter) {
        cityFilter.innerHTML = '<option value="">Toutes les villes</option>' +
            cities.map(city => `<option value="${city}">${city}</option>`).join('');
    }
}

// ===== MISE À JOUR DES STATISTIQUES =====
function updateHeroStats() {
    const brands = new Set(cars.map(car => car.brand).filter(brand => brand));
    const cities = new Set(cars.map(car => car.city).filter(city => city));
    
    updateElement('heroTotalCars', cars.length);
    updateElement('heroBrands', brands.size);
    updateElement('heroCities', cities.size);
    
    // Footer stats
    updateElement('footerTotalCars', cars.length);
    updateElement('footerTotalBrands', brands.size);
    updateElement('footerTotalCities', cities.size);
    
    // Footer cities
    const footerCities = document.getElementById('footerCities');
    if (footerCities) {
        const topCities = [...cities].slice(0, 6);
        footerCities.innerHTML = topCities.map(city => 
            `<a href="#" onclick="filterByCity('${city}'); return false;">${city}</a>`
        ).join('');
    }
}

function updateResultsInfo() {
    const resultsCount = document.getElementById('resultsCount');
    const filterStatus = document.getElementById('filterStatus');
    
    if (resultsCount) {
        resultsCount.textContent = `${filteredCars.length} véhicule(s) trouvé(s)`;
    }
    
    if (filterStatus) {
        const activeFilters = Object.values(currentFilters).filter(v => v).length;
        const searchTerm = document.getElementById('searchInput')?.value;
        
        let status = '';
        if (searchTerm) {
            status += `• Recherche: "${searchTerm}" `;
        }
        if (activeFilters > 0) {
            status += `• ${activeFilters} filtre(s) actif(s)`;
        }
        
        filterStatus.textContent = status;
    }
}

// ===== FONCTIONS D'INTERFACE =====
function toggleAdvancedOptions() {
    const advancedOptions = document.getElementById('advancedOptions');
    const toggleText = document.getElementById('advancedToggleText');
    
    if (advancedOptions && toggleText) {
        isAdvancedOptionsVisible = !isAdvancedOptionsVisible;
        
        if (isAdvancedOptionsVisible) {
            advancedOptions.style.display = 'block';
            toggleText.textContent = '⚙️ Masquer options avancées';
        } else {
            advancedOptions.style.display = 'none';
            toggleText.textContent = '⚙️ Options avancées';
        }
        
        analytics.track('advanced_options_toggled', { visible: isAdvancedOptionsVisible });
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Reset current car data
        if (modalId === 'carDetailsModal') {
            currentCarId = null;
            currentImageIndex = 0;
        }
    }
}

function showLoading(show) {
    const loading = document.getElementById('loading');
    const skeleton = document.getElementById('loadingSkeleton');
    
    if (show) {
        if (loading) loading.style.display = 'flex';
        if (skeleton) {
            skeleton.style.display = 'grid';
            skeleton.innerHTML = Array(8).fill().map(() => `
                <div class="skeleton-card">
                    <div class="skeleton-image"></div>
                    <div class="skeleton-content">
                        <div class="skeleton-line"></div>
                        <div class="skeleton-line short"></div>
                        <div class="skeleton-line"></div>
                    </div>
                </div>
            `).join('');
        }
    } else {
        if (loading) loading.style.display = 'none';
        if (skeleton) skeleton.style.display = 'none';
    }
}

function showGlobalLoader(show) {
    const loader = document.getElementById('globalLoader');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
}

// ===== LAZY LOADING =====
function setupLazyLoading() {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        });
    });

    // Observe all lazy images
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

function setupLazyLoadingForNewImages() {
    // This function is called after new car cards are added
    setupLazyLoading();
}

// ===== AMÉLIORATIONS PROGRESSIVES =====
function enhanceInterface() {
    // Add touch support for mobile
    if ('ontouchstart' in window) {
        document.body.classList.add('touch-device');
    }
    
    // Add scroll-to-top button
    createScrollToTopButton();
    
    // Add keyboard navigation hints
    if (!('ontouchstart' in window)) {
        addKeyboardHints();
    }
}

function createScrollToTopButton() {
    const button = document.createElement('button');
    button.className = 'scroll-to-top';
    button.innerHTML = '↑';
    button.title = 'Haut de page';
    button.onclick = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        analytics.track('scroll_to_top_used');
    };
    
    document.body.appendChild(button);
    
    window.addEventListener('scroll', () => {
        button.style.display = window.scrollY > 500 ? 'block' : 'none';
    });
}

function addKeyboardHints() {
    // Add title attributes for keyboard shortcuts
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.title = 'Appuyez sur / pour rechercher rapidement';
    }
}

// ===== GESTION DES ÉVÉNEMENTS =====
function handleKeyboardShortcuts(e) {
    // Search shortcut
    if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.focus();
        }
    }
    
    // Close modal on Escape
    if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal[style*="block"]');
        if (openModal) {
            closeModal(openModal.id);
        }
    }
    
    // Navigation in car details modal
    if (currentCarId) {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            prevCarImage();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            nextCarImage();
        }
    }
}

function handleScroll() {
    // Add scroll-based animations or lazy loading here
}

function handleResize() {
    // Handle responsive adjustments
    if (window.innerWidth <= 768) {
        // Mobile optimizations
        itemsPerPage = 8;
    } else {
        itemsPerPage = 12;
    }
    
    // Refresh display if needed
    if (filteredCars.length > 0) {
        currentPage = 1;
        sortAndDisplayCars();
    }
}

// ===== PRÉFÉRENCES UTILISATEUR =====
function loadUserPreferences() {
    // Load saved view preference
    const savedView = localStorage.getItem('autodeal_preferred_view');
    if (savedView && ['grid', 'list', 'compact'].includes(savedView)) {
        switchView(savedView);
    }
    
    // Load saved sort preference
    const savedSort = localStorage.getItem('autodeal_preferred_sort');
    if (savedSort) {
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.value = savedSort;
            currentSort = savedSort;
        }
    }
}

function saveUserPreferences() {
    localStorage.setItem('autodeal_preferred_view', currentView);
    localStorage.setItem('autodeal_preferred_sort', currentSort);
}

// ===== FONCTIONS PLACEHOLDER POUR FUTURES FONCTIONNALITÉS =====
function showPrivacyPolicy() {
    notify.show('Politique de confidentialité en cours de rédaction', 'info');
}

function showTermsOfService() {
    notify.show('Conditions d\'utilisation en cours de rédaction', 'info');
}

function showCookiePolicy() {
    notify.show('Politique des cookies en cours de rédaction', 'info');
}

// ===== SAUVEGARDE DES PRÉFÉRENCES AU DÉCHARGEMENT =====
window.addEventListener('beforeunload', () => {
    saveUserPreferences();
    analytics.track('app_unload', { 
        sessionDuration: Date.now() - analytics.sessionStart,
        carsViewed: viewHistory.length,
        favoritesCount: favorites.length
    });
});

// ===== GESTION DES ERREURS GLOBALES =====
window.addEventListener('error', (event) => {
    console.error('Erreur globale:', event.error);
    analytics.track('client_error', { 
        message: event.error?.message,
        filename: event.filename,
        lineno: event.lineno 
    });
});

// ===== EXPORT DES FONCTIONS GLOBALES =====
window.AutoDealClient = {
    loadCars,
    showCarDetails,
    toggleFavorite,
    filterByBrand,
    filterByCity,
    filterByPrice,
    resetAllFilters,
    analytics,
    getCars: () => [...cars],
    getFavorites: () => [...favorites],
    getViewHistory: () => [...viewHistory]
};

console.log('🚗 AutoDeal Client v2.0 initialisé avec succès !');