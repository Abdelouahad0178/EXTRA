// Global variables
let db;
let isFirebaseConnected = false;
let cars = [];
let clients = [];
let salesmen = [];
let quotes = [];
let sales = [];
let reservations = [];
let currentEditId = null;
let currentEditClientId = null;
let currentEditSalesmanId = null;
let currentCarPhotos = [];
let carImageIndices = {}; // Track current image index for each car

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    setupPhotoUpload();
    setupEventListeners();
    loadStoredConfig();
});

function loadStoredConfig() {
    // Check if Firebase config is stored in localStorage
    const storedConfig = JSON.parse(localStorage.getItem('firebaseConfig') || '{}');
    if (storedConfig.apiKey && storedConfig.projectId) {
        document.getElementById('apiKey').value = storedConfig.apiKey;
        document.getElementById('authDomain').value = storedConfig.authDomain || '';
        document.getElementById('projectId').value = storedConfig.projectId;
        document.getElementById('appId').value = storedConfig.appId || '';
    }
}

function initializeFirebase() {
    const apiKey = document.getElementById('apiKey').value;
    const authDomain = document.getElementById('authDomain').value;
    const projectId = document.getElementById('projectId').value;
    const appId = document.getElementById('appId').value;

    if (!apiKey || !projectId) {
        showNotification('API Key et Project ID sont requis', 'error');
        return;
    }

    const firebaseConfig = {
        apiKey: apiKey,
        authDomain: authDomain || `${projectId}.firebaseapp.com`,
        projectId: projectId,
        storageBucket: `${projectId}.appspot.com`,
        messagingSenderId: "123456789",
        appId: appId || "demo-app-id"
    };

    try {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        
        // Test connection
        db.collection('test').doc('connection').set({
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            isFirebaseConnected = true;
            updateFirebaseStatus(true);
            enableButtons();
            localStorage.setItem('firebaseConfig', JSON.stringify(firebaseConfig));
            document.getElementById('firebaseConfigSection').classList.add('hidden');
            document.getElementById('appContent').classList.remove('hidden');
            loadAllData();
            showNotification('Firebase connecté avec succès', 'success');
        }).catch((error) => {
            console.error('Erreur de connexion Firebase:', error);
            showNotification('Erreur de connexion: ' + error.message, 'error');
            updateFirebaseStatus(false);
        });
    } catch (error) {
        console.error('Erreur d\'initialisation Firebase:', error);
        showNotification('Erreur de configuration: ' + error.message, 'error');
        updateFirebaseStatus(false);
    }
}

function updateFirebaseStatus(connected) {
    const statusElement = document.getElementById('firebaseStatus');
    if (connected) {
        statusElement.className = 'firebase-status firebase-connected';
        statusElement.textContent = '🟢 Firebase connecté';
    } else {
        statusElement.className = 'firebase-status firebase-disconnected';
        statusElement.textContent = '🔴 Firebase déconnecté';
    }
}

function enableButtons() {
    const buttons = ['addCarBtn', 'addClientBtn', 'addSalesmanBtn', 'exportBtn'];
    buttons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.disabled = false;
    });
}

async function loadAllData() {
    try {
        showLoading(true);
        await Promise.all([
            loadCars(),
            loadClients(),
            loadSalesmen(),
            loadQuotes(),
            loadSales(),
            loadReservations()
        ]);
        
        displayCars();
        displayClients();
        displaySalesmen();
        updateDashboard();
        populateFilters();
        populateSelects();
        showLoading(false);
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        showNotification('Erreur lors du chargement des données', 'error');
        showLoading(false);
    }
}

// Firebase CRUD operations for Cars
async function loadCars() {
    if (!isFirebaseConnected) return;
    try {
        const snapshot = await db.collection('cars').get();
        cars = [];
        snapshot.forEach(doc => {
            cars.push({ id: doc.id, ...doc.data() });
        });
    } catch (error) {
        console.error('Erreur chargement voitures:', error);
        throw error;
    }
}

async function saveCar(carData) {
    if (!isFirebaseConnected) return;
    try {
        const docRef = await db.collection('cars').add({
            ...carData,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error('Erreur sauvegarde voiture:', error);
        throw error;
    }
}

async function updateCar(id, carData) {
    if (!isFirebaseConnected) return;
    try {
        await db.collection('cars').doc(id).update({
            ...carData,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Erreur mise à jour voiture:', error);
        throw error;
    }
}

async function deleteCar(id) {
    if (!isFirebaseConnected) return;
    try {
        await db.collection('cars').doc(id).delete();
    } catch (error) {
        console.error('Erreur suppression voiture:', error);
        throw error;
    }
}

// Firebase CRUD operations for Clients
async function loadClients() {
    if (!isFirebaseConnected) return;
    try {
        const snapshot = await db.collection('clients').get();
        clients = [];
        snapshot.forEach(doc => {
            clients.push({ id: doc.id, ...doc.data() });
        });
    } catch (error) {
        console.error('Erreur chargement clients:', error);
        throw error;
    }
}

async function saveClient(clientData) {
    if (!isFirebaseConnected) return;
    try {
        const docRef = await db.collection('clients').add({
            ...clientData,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error('Erreur sauvegarde client:', error);
        throw error;
    }
}

async function updateClient(id, clientData) {
    if (!isFirebaseConnected) return;
    try {
        await db.collection('clients').doc(id).update({
            ...clientData,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Erreur mise à jour client:', error);
        throw error;
    }
}

async function deleteClient(id) {
    if (!isFirebaseConnected) return;
    try {
        await db.collection('clients').doc(id).delete();
    } catch (error) {
        console.error('Erreur suppression client:', error);
        throw error;
    }
}

// Firebase CRUD operations for Salesmen
async function loadSalesmen() {
    if (!isFirebaseConnected) return;
    try {
        const snapshot = await db.collection('salesmen').get();
        salesmen = [];
        snapshot.forEach(doc => {
            salesmen.push({ id: doc.id, ...doc.data() });
        });
    } catch (error) {
        console.error('Erreur chargement vendeurs:', error);
        throw error;
    }
}

async function saveSalesman(salesmanData) {
    if (!isFirebaseConnected) return;
    try {
        const docRef = await db.collection('salesmen').add({
            ...salesmanData,
            totalSales: 0,
            totalRevenue: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error('Erreur sauvegarde vendeur:', error);
        throw error;
    }
}

async function updateSalesman(id, salesmanData) {
    if (!isFirebaseConnected) return;
    try {
        await db.collection('salesmen').doc(id).update({
            ...salesmanData,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Erreur mise à jour vendeur:', error);
        throw error;
    }
}

async function deleteSalesman(id) {
    if (!isFirebaseConnected) return;
    try {
        await db.collection('salesmen').doc(id).delete();
    } catch (error) {
        console.error('Erreur suppression vendeur:', error);
        throw error;
    }
}

// Firebase CRUD operations for other entities
async function loadQuotes() {
    if (!isFirebaseConnected) return;
    try {
        const snapshot = await db.collection('quotes').get();
        quotes = [];
        snapshot.forEach(doc => {
            quotes.push({ id: doc.id, ...doc.data() });
        });
    } catch (error) {
        console.error('Erreur chargement devis:', error);
        throw error;
    }
}

async function loadSales() {
    if (!isFirebaseConnected) return;
    try {
        const snapshot = await db.collection('sales').get();
        sales = [];
        snapshot.forEach(doc => {
            sales.push({ id: doc.id, ...doc.data() });
        });
    } catch (error) {
        console.error('Erreur chargement ventes:', error);
        throw error;
    }
}

async function loadReservations() {
    if (!isFirebaseConnected) return;
    try {
        const snapshot = await db.collection('reservations').get();
        reservations = [];
        snapshot.forEach(doc => {
            reservations.push({ id: doc.id, ...doc.data() });
        });
    } catch (error) {
        console.error('Erreur chargement réservations:', error);
        throw error;
    }
}

// Photo upload functionality
function setupPhotoUpload() {
    const uploadArea = document.getElementById('photoUploadArea');
    const photoInput = document.getElementById('photoInput');

    if (!uploadArea || !photoInput) return;

    uploadArea.addEventListener('click', () => {
        photoInput.click();
    });

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        handlePhotoUpload(files);
    });

    photoInput.addEventListener('change', (e) => {
        handlePhotoUpload(e.target.files);
    });
}

async function handlePhotoUpload(files) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    
    for (let file of files) {
        if (!allowedTypes.includes(file.type)) {
            showNotification(`Format non supporté: ${file.name}`, 'error');
            continue;
        }
        
        if (file.size > maxSize) {
            showNotification(`Fichier trop volumineux: ${file.name}`, 'error');
            continue;
        }

        try {
            showUploadProgress(true);
            const base64 = await convertToBase64(file);
            
            // Create compressed version
            const compressedBase64 = await compressImage(base64, 800, 600, 0.8);
            
            currentCarPhotos.push({
                id: Date.now() + Math.random(),
                name: file.name,
                data: compressedBase64,
                size: file.size
            });
            
            displayUploadedPhotos();
            showUploadProgress(false);
            showNotification(`Photo ${file.name} ajoutée`, 'success');
        } catch (error) {
            console.error('Erreur upload photo:', error);
            showNotification(`Erreur lors de l'upload: ${file.name}`, 'error');
            showUploadProgress(false);
        }
    }
}

function convertToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

function compressImage(base64, maxWidth, maxHeight, quality) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
            // Calculate new dimensions
            let { width, height } = img;
            if (width > height) {
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        
        img.src = base64;
    });
}

function displayUploadedPhotos() {
    const container = document.getElementById('uploadedPhotos');
    if (!container) return;
    
    container.innerHTML = currentCarPhotos.map(photo => `
        <div class="uploaded-photo">
            <img src="${photo.data}" alt="${photo.name}">
            <button class="remove-photo" onclick="removePhoto('${photo.id}')">&times;</button>
        </div>
    `).join('');
}

function removePhoto(photoId) {
    currentCarPhotos = currentCarPhotos.filter(photo => photo.id !== photoId);
    displayUploadedPhotos();
    showNotification('Photo supprimée', 'success');
}

function showUploadProgress(show) {
    const progress = document.getElementById('uploadProgress');
    const progressBar = document.getElementById('uploadProgressBar');
    
    if (!progress || !progressBar) return;
    
    if (show) {
        progress.style.display = 'block';
        progressBar.style.width = '0%';
        
        // Simulate progress
        let width = 0;
        const interval = setInterval(() => {
            width += 10;
            progressBar.style.width = width + '%';
            if (width >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    progress.style.display = 'none';
                }, 500);
            }
        }, 100);
    } else {
        progress.style.display = 'none';
    }
}

// Event listeners
function setupEventListeners() {
    // Search and filters
    document.getElementById('searchInput').addEventListener('input', filterCars);
    document.getElementById('brandFilter').addEventListener('change', filterCars);
    document.getElementById('yearFilter').addEventListener('change', filterCars);
    document.getElementById('priceFilter').addEventListener('change', filterCars);
    document.getElementById('statusFilter').addEventListener('change', filterCars);
    
    // City filter
    const cityFilter = document.getElementById('cityFilter');
    if (cityFilter) {
        cityFilter.addEventListener('change', filterCars);
    }

    // Forms
    document.getElementById('carForm').addEventListener('submit', handleCarFormSubmit);
    document.getElementById('clientForm').addEventListener('submit', handleClientFormSubmit);
    document.getElementById('salesmanForm').addEventListener('submit', handleSalesmanFormSubmit);

    // Modal close on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) closeModal(this.id);
        });
    });
}

// Display functions
function displayCars(carsToShow = cars) {
    const grid = document.getElementById('carsGrid');
    
    if (carsToShow.length === 0) {
        grid.innerHTML = '<div style="text-align: center; padding: 2rem; color: #666;">Aucune voiture trouvée</div>';
        return;
    }

    grid.innerHTML = carsToShow.map(car => {
        // Initialize image index for this car
        if (!carImageIndices[car.id]) {
            carImageIndices[car.id] = 0;
        }
        
        const currentIndex = carImageIndices[car.id];
        
        // Get equipment list
        const equipmentList = getCarEquipment(car);
        
        return `
            <div class="car-card ${car.status || 'available'}" onclick="showCarDetails('${car.id}')">
                <div class="car-status status-${car.status || 'available'}">
                    ${getStatusLabel(car.status || 'available')}
                </div>
                <div class="car-images">
                    <div class="car-image" id="carImage-${car.id}">
                        ${car.photos && car.photos.length > 0 ? 
                            `<img src="${car.photos[currentIndex].data}" alt="${car.brand} ${car.model}">` :
                            '🚗'
                        }
                    </div>
                    ${car.photos && car.photos.length > 1 ? `
                        <button class="image-nav prev" onclick="event.stopPropagation(); prevImage('${car.id}')">&lt;</button>
                        <button class="image-nav next" onclick="event.stopPropagation(); nextImage('${car.id}')">&gt;</button>
                        <div class="image-dots">
                            ${car.photos.map((_, index) => `
                                <div class="image-dot ${index === currentIndex ? 'active' : ''}" onclick="event.stopPropagation(); showImage('${car.id}', ${index})"></div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="car-info">
                    <div class="car-title">${car.brand} ${car.model}</div>
                    <div class="car-details">
                        <span>📅 ${car.year}</span>
                        <span>🛣️ ${formatNumber(car.mileage)} km</span>
                        <span>⛽ ${car.fuel}</span>
                        <span>⚙️ ${car.transmission}</span>
                        <span>🎨 ${car.color || 'N/A'}</span>
                        <span>🚪 ${car.doors ? car.doors + ' portes' : 'N/A'}</span>
                        ${car.fiscalPower ? `<span>🔧 ${car.fiscalPower} CV</span>` : ''}
                        ${car.engineSize ? `<span>⚡ ${car.engineSize}L</span>` : ''}
                    </div>
                    
                    ${car.city || car.district ? `
                        <div class="car-location">
                            <span>📍 ${car.city || ''}${car.district ? ', ' + car.district : ''}</span>
                        </div>
                    ` : ''}
                    
                    ${car.condition ? `
                        <div style="margin: 0.5rem 0; font-size: 0.9rem;">
                            <span style="background: #e8f5e9; color: #2e7d32; padding: 0.2rem 0.5rem; border-radius: 12px;">
                                ${car.condition}
                            </span>
                            ${car.firstOwner === 'Oui' ? '<span style="background: #e3f2fd; color: #1976d2; padding: 0.2rem 0.5rem; border-radius: 12px; margin-left: 0.5rem;">1ère main</span>' : ''}
                        </div>
                    ` : ''}
                    
                    ${car.ownerName && car.ownerPhone ? `
                        <div class="car-owner">
                            <div class="car-owner-name">👤 ${car.ownerName}</div>
                            <div class="car-owner-phone">📞 ${car.ownerPhone}</div>
                        </div>
                    ` : ''}
                    
                    ${equipmentList.length > 0 ? `
                        <div class="car-equipment">
                            <div class="equipment-tags">
                                ${equipmentList.slice(0, 4).map(eq => `<span class="equipment-tag">${eq}</span>`).join('')}
                                ${equipmentList.length > 4 ? `<span class="equipment-tag">+${equipmentList.length - 4} autres</span>` : ''}
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="car-price">${formatPrice(car.price)}</div>
                    
                    <div class="car-actions" onclick="event.stopPropagation()">
                        <button class="btn btn-small btn-edit" onclick="editCar('${car.id}')">
                            ✏️ Modifier
                        </button>
                        <button class="btn btn-small btn-delete" onclick="deleteCarConfirm('${car.id}')">
                            🗑️ Supprimer
                        </button>
                        ${(car.status || 'available') === 'available' ? `
                            <button class="btn btn-small btn-reserve" onclick="showReserveModal('${car.id}')">
                                📅 Réserver
                            </button>
                            <button class="btn btn-small btn-quote" onclick="showQuoteModal('${car.id}')">
                                📄 Devis
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Get car equipment list
function getCarEquipment(car) {
    const equipment = [];
    if (car.airCon) equipment.push('Climatisation');
    if (car.powerSteering) equipment.push('Direction assistée');
    if (car.electricWindows) equipment.push('Vitres électriques');
    if (car.abs) equipment.push('ABS');
    if (car.airbags) equipment.push('Airbags');
    if (car.gps) equipment.push('GPS');
    if (car.bluetooth) equipment.push('Bluetooth');
    if (car.cruiseControl) equipment.push('Régulateur');
    if (car.centralLocking) equipment.push('Fermeture centralisée');
    if (car.parkingSensors) equipment.push('Capteurs parking');
    if (car.sunroof) equipment.push('Toit ouvrant');
    if (car.leatherSeats) equipment.push('Sièges cuir');
    return equipment;
}

// Image navigation functions
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
        imageElement.innerHTML = `<img src="${car.photos[currentIndex].data}" alt="${car.brand} ${car.model}">`;
    }
    
    // Update dots
    const card = imageElement.closest('.car-card');
    if (card) {
        const dots = card.querySelectorAll('.image-dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentIndex);
        });
    }
}

function displayClients() {
    const clientsList = document.getElementById('clientsList');
    
    if (clients.length === 0) {
        clientsList.innerHTML = '<div style="text-align: center; padding: 2rem; color: #666;">Aucun client enregistré</div>';
        return;
    }

    clientsList.innerHTML = clients.map(client => `
        <div class="client-card">
            <div class="client-header">
                <div class="client-name">${client.firstName} ${client.name}</div>
                <div>
                    <button class="btn btn-small btn-edit" onclick="editClient('${client.id}')">Modifier</button>
                    <button class="btn btn-small btn-delete" onclick="deleteClientConfirm('${client.id}')">Supprimer</button>
                </div>
            </div>
            <div class="client-info">
                <div>📞 ${client.phone}</div>
                <div>📧 ${client.email || 'Non renseigné'}</div>
                <div>🏠 ${client.address || 'Non renseigné'}</div>
                <div>🏙️ ${client.city || 'Non renseigné'}</div>
                <div>🆔 ${client.cin || 'Non renseigné'}</div>
                <div>🎂 ${client.birthDate ? formatDate(client.birthDate) : 'Non renseigné'}</div>
                <div>💼 ${client.profession || 'Non renseigné'}</div>
                ${client.notes ? `<div>📝 ${client.notes}</div>` : ''}
            </div>
        </div>
    `).join('');
}

function displaySalesmen() {
    const salesmenList = document.getElementById('salesmenList');
    
    if (salesmen.length === 0) {
        salesmenList.innerHTML = '<div style="text-align: center; padding: 2rem; color: #666;">Aucun vendeur enregistré</div>';
        return;
    }

    salesmenList.innerHTML = salesmen.map(salesman => `
        <div class="client-card">
            <div class="client-header">
                <div class="client-name">${salesman.firstName} ${salesman.name}</div>
                <div>
                    <button class="btn btn-small btn-edit" onclick="editSalesman('${salesman.id}')">Modifier</button>
                    <button class="btn btn-small btn-delete" onclick="deleteSalesmanConfirm('${salesman.id}')">Supprimer</button>
                </div>
            </div>
            <div class="client-info">
                <div>📞 ${salesman.phone}</div>
                <div>📧 ${salesman.email || 'Non renseigné'}</div>
                <div>💰 Commission: ${salesman.commission}%</div>
                <div>📅 Embauché le: ${formatDate(salesman.hireDate)}</div>
                <div>🚗 Ventes: ${salesman.totalSales || 0}</div>
                <div>💵 CA: ${formatPrice(salesman.totalRevenue || 0)}</div>
                ${salesman.notes ? `<div>📝 ${salesman.notes}</div>` : ''}
            </div>
        </div>
    `).join('');
}

// Form handlers
async function handleCarFormSubmit(e) {
    e.preventDefault();
    
    if (!isFirebaseConnected) {
        showNotification('Firebase non connecté', 'error');
        return;
    }

    const submitBtn = document.getElementById('carSubmitBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<div class="spinner" style="width: 20px; height: 20px; margin: 0;"></div>';
    submitBtn.disabled = true;

    try {
        const formData = {
            brand: document.getElementById('brand').value,
            model: document.getElementById('model').value,
            year: parseInt(document.getElementById('year').value),
            mileage: parseInt(document.getElementById('mileage').value),
            price: parseInt(document.getElementById('price').value),
            fuel: document.getElementById('fuel').value,
            transmission: document.getElementById('transmission').value,
            color: document.getElementById('color').value,
            vin: document.getElementById('vin').value,
            doors: document.getElementById('doors').value,
            fiscalPower: parseInt(document.getElementById('fiscalPower').value) || null,
            engineSize: parseFloat(document.getElementById('engineSize').value) || null,
            condition: document.getElementById('condition').value,
            firstOwner: document.getElementById('firstOwner').value,
            ownerName: document.getElementById('ownerName').value,
            ownerPhone: document.getElementById('ownerPhone').value,
            city: document.getElementById('city').value,
            district: document.getElementById('district').value,
            // Equipment
            airCon: document.getElementById('airCon').checked,
            powerSteering: document.getElementById('powerSteering').checked,
            electricWindows: document.getElementById('electricWindows').checked,
            abs: document.getElementById('abs').checked,
            airbags: document.getElementById('airbags').checked,
            gps: document.getElementById('gps').checked,
            bluetooth: document.getElementById('bluetooth').checked,
            cruiseControl: document.getElementById('cruiseControl').checked,
            centralLocking: document.getElementById('centralLocking').checked,
            parkingSensors: document.getElementById('parkingSensors').checked,
            sunroof: document.getElementById('sunroof').checked,
            leatherSeats: document.getElementById('leatherSeats').checked,
            description: document.getElementById('description').value,
            photos: currentCarPhotos,
            status: 'available'
        };

        if (currentEditId) {
            await updateCar(currentEditId, formData);
            const index = cars.findIndex(car => car.id === currentEditId);
            if (index !== -1) {
                cars[index] = { ...cars[index], ...formData };
            }
            showNotification('Voiture modifiée avec succès', 'success');
        } else {
            const newId = await saveCar(formData);
            const newCar = { id: newId, ...formData };
            cars.push(newCar);
            showNotification('Voiture ajoutée avec succès', 'success');
        }

        closeModal('carModal');
        displayCars();
        updateDashboard();
        populateFilters();
        populateSelects();
        
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        showNotification('Erreur lors de la sauvegarde: ' + error.message, 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Client form handler
async function handleClientFormSubmit(e) {
    e.preventDefault();
    
    if (!isFirebaseConnected) {
        showNotification('Firebase non connecté', 'error');
        return;
    }

    const submitBtn = document.getElementById('clientSubmitBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<div class="spinner" style="width: 20px; height: 20px; margin: 0;"></div>';
    submitBtn.disabled = true;

    try {
        const formData = {
            name: document.getElementById('clientName').value,
            firstName: document.getElementById('clientFirstName').value,
            phone: document.getElementById('clientPhone').value,
            email: document.getElementById('clientEmail').value,
            city: document.getElementById('clientCity').value,
            cin: document.getElementById('clientCin').value,
            address: document.getElementById('clientAddress').value,
            birthDate: document.getElementById('clientBirthDate').value,
            profession: document.getElementById('clientProfession').value,
            notes: document.getElementById('clientNotes').value
        };

        if (currentEditClientId) {
            await updateClient(currentEditClientId, formData);
            const index = clients.findIndex(client => client.id === currentEditClientId);
            if (index !== -1) {
                clients[index] = { ...clients[index], ...formData };
            }
            showNotification('Client modifié avec succès', 'success');
        } else {
            const newId = await saveClient(formData);
            const newClient = { id: newId, ...formData };
            clients.push(newClient);
            showNotification('Client ajouté avec succès', 'success');
        }

        closeModal('clientModal');
        displayClients();
        updateDashboard();
        populateSelects();
        
    } catch (error) {
        console.error('Erreur lors de la sauvegarde client:', error);
        showNotification('Erreur lors de la sauvegarde: ' + error.message, 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Salesman form handler
async function handleSalesmanFormSubmit(e) {
    e.preventDefault();
    
    if (!isFirebaseConnected) {
        showNotification('Firebase non connecté', 'error');
        return;
    }

    const submitBtn = document.getElementById('salesmanSubmitBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<div class="spinner" style="width: 20px; height: 20px; margin: 0;"></div>';
    submitBtn.disabled = true;

    try {
        const formData = {
            name: document.getElementById('salesmanName').value,
            firstName: document.getElementById('salesmanFirstName').value,
            phone: document.getElementById('salesmanPhone').value,
            email: document.getElementById('salesmanEmail').value,
            commission: parseFloat(document.getElementById('salesmanCommission').value),
            hireDate: document.getElementById('salesmanHireDate').value,
            notes: document.getElementById('salesmanNotes').value
        };

        if (currentEditSalesmanId) {
            await updateSalesman(currentEditSalesmanId, formData);
            const index = salesmen.findIndex(salesman => salesman.id === currentEditSalesmanId);
            if (index !== -1) {
                salesmen[index] = { ...salesmen[index], ...formData };
            }
            showNotification('Vendeur modifié avec succès', 'success');
        } else {
            const newId = await saveSalesman(formData);
            const newSalesman = { id: newId, ...formData, totalSales: 0, totalRevenue: 0 };
            salesmen.push(newSalesman);
            showNotification('Vendeur ajouté avec succès', 'success');
        }

        closeModal('salesmanModal');
        displaySalesmen();
        updateDashboard();
        populateSelects();
        
    } catch (error) {
        console.error('Erreur lors de la sauvegarde vendeur:', error);
        showNotification('Erreur lors de la sauvegarde: ' + error.message, 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Modal functions
function showAddCarModal() {
    if (!isFirebaseConnected) {
        showNotification('Firebase non connecté', 'error');
        return;
    }
    
    currentEditId = null;
    currentCarPhotos = [];
    document.getElementById('modalTitle').textContent = 'Ajouter une voiture';
    document.getElementById('submitBtnText').textContent = 'Ajouter';
    document.getElementById('carForm').reset();
    
    // Reset all checkboxes
    const checkboxes = document.querySelectorAll('#carForm input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
    
    displayUploadedPhotos();
    document.getElementById('carModal').style.display = 'block';
}

function showAddClientModal() {
    if (!isFirebaseConnected) {
        showNotification('Firebase non connecté', 'error');
        return;
    }
    
    currentEditClientId = null;
    document.getElementById('clientModalTitle').textContent = 'Ajouter un client';
    document.getElementById('clientSubmitBtnText').textContent = 'Ajouter';
    document.getElementById('clientForm').reset();
    document.getElementById('clientModal').style.display = 'block';
}

function showAddSalesmanModal() {
    if (!isFirebaseConnected) {
        showNotification('Firebase non connecté', 'error');
        return;
    }
    
    currentEditSalesmanId = null;
    document.getElementById('salesmanModalTitle').textContent = 'Ajouter un vendeur';
    document.getElementById('salesmanSubmitBtnText').textContent = 'Ajouter';
    document.getElementById('salesmanForm').reset();
    // Set default hire date to today
    document.getElementById('salesmanHireDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('salesmanModal').style.display = 'block';
}

function editCar(id) {
    const car = cars.find(c => c.id === id);
    if (!car) return;

    currentEditId = id;
    currentCarPhotos = car.photos || [];
    document.getElementById('modalTitle').textContent = 'Modifier la voiture';
    document.getElementById('submitBtnText').textContent = 'Modifier';

    // Fill form
    document.getElementById('brand').value = car.brand;
    document.getElementById('model').value = car.model;
    document.getElementById('year').value = car.year;
    document.getElementById('mileage').value = car.mileage;
    document.getElementById('price').value = car.price;
    document.getElementById('fuel').value = car.fuel;
    document.getElementById('transmission').value = car.transmission;
    document.getElementById('color').value = car.color || '';
    document.getElementById('vin').value = car.vin || '';
    document.getElementById('doors').value = car.doors || '';
    document.getElementById('fiscalPower').value = car.fiscalPower || '';
    document.getElementById('engineSize').value = car.engineSize || '';
    document.getElementById('condition').value = car.condition || 'Bon';
    document.getElementById('firstOwner').value = car.firstOwner || 'Non';
    document.getElementById('ownerName').value = car.ownerName || '';
    document.getElementById('ownerPhone').value = car.ownerPhone || '';
    document.getElementById('city').value = car.city || '';
    document.getElementById('district').value = car.district || '';
    document.getElementById('description').value = car.description || '';
    
    // Equipment checkboxes
    document.getElementById('airCon').checked = car.airCon || false;
    document.getElementById('powerSteering').checked = car.powerSteering || false;
    document.getElementById('electricWindows').checked = car.electricWindows || false;
    document.getElementById('abs').checked = car.abs || false;
    document.getElementById('airbags').checked = car.airbags || false;
    document.getElementById('gps').checked = car.gps || false;
    document.getElementById('bluetooth').checked = car.bluetooth || false;
    document.getElementById('cruiseControl').checked = car.cruiseControl || false;
    document.getElementById('centralLocking').checked = car.centralLocking || false;
    document.getElementById('parkingSensors').checked = car.parkingSensors || false;
    document.getElementById('sunroof').checked = car.sunroof || false;
    document.getElementById('leatherSeats').checked = car.leatherSeats || false;

    displayUploadedPhotos();
    document.getElementById('carModal').style.display = 'block';
}

function editClient(id) {
    const client = clients.find(c => c.id === id);
    if (!client) return;

    currentEditClientId = id;
    document.getElementById('clientModalTitle').textContent = 'Modifier le client';
    document.getElementById('clientSubmitBtnText').textContent = 'Modifier';

    // Fill form
    document.getElementById('clientName').value = client.name;
    document.getElementById('clientFirstName').value = client.firstName;
    document.getElementById('clientPhone').value = client.phone;
    document.getElementById('clientEmail').value = client.email || '';
    document.getElementById('clientCity').value = client.city || '';
    document.getElementById('clientCin').value = client.cin || '';
    document.getElementById('clientAddress').value = client.address || '';
    document.getElementById('clientBirthDate').value = client.birthDate || '';
    document.getElementById('clientProfession').value = client.profession || '';
    document.getElementById('clientNotes').value = client.notes || '';

    document.getElementById('clientModal').style.display = 'block';
}

function editSalesman(id) {
    const salesman = salesmen.find(s => s.id === id);
    if (!salesman) return;

    currentEditSalesmanId = id;
    document.getElementById('salesmanModalTitle').textContent = 'Modifier le vendeur';
    document.getElementById('salesmanSubmitBtnText').textContent = 'Modifier';

    // Fill form
    document.getElementById('salesmanName').value = salesman.name;
    document.getElementById('salesmanFirstName').value = salesman.firstName;
    document.getElementById('salesmanPhone').value = salesman.phone;
    document.getElementById('salesmanEmail').value = salesman.email || '';
    document.getElementById('salesmanCommission').value = salesman.commission;
    document.getElementById('salesmanHireDate').value = salesman.hireDate;
    document.getElementById('salesmanNotes').value = salesman.notes || '';

    document.getElementById('salesmanModal').style.display = 'block';
}

async function deleteCarConfirm(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette voiture ?')) return;
    
    try {
        await deleteCar(id);
        cars = cars.filter(car => car.id !== id);
        displayCars();
        updateDashboard();
        populateFilters();
        populateSelects();
        showNotification('Voiture supprimée avec succès', 'success');
    } catch (error) {
        console.error('Erreur suppression:', error);
        showNotification('Erreur lors de la suppression', 'error');
    }
}

async function deleteClientConfirm(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) return;
    
    try {
        await deleteClient(id);
        clients = clients.filter(client => client.id !== id);
        displayClients();
        updateDashboard();
        populateSelects();
        showNotification('Client supprimé avec succès', 'success');
    } catch (error) {
        console.error('Erreur suppression client:', error);
        showNotification('Erreur lors de la suppression', 'error');
    }
}

async function deleteSalesmanConfirm(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce vendeur ?')) return;
    
    try {
        await deleteSalesman(id);
        salesmen = salesmen.filter(salesman => salesman.id !== id);
        displaySalesmen();
        updateDashboard();
        populateSelects();
        showNotification('Vendeur supprimé avec succès', 'success');
    } catch (error) {
        console.error('Erreur suppression vendeur:', error);
        showNotification('Erreur lors de la suppression', 'error');
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    
    // Reset edit IDs based on modal type
    if (modalId === 'carModal') {
        currentEditId = null;
        currentCarPhotos = [];
    } else if (modalId === 'clientModal') {
        currentEditClientId = null;
    } else if (modalId === 'salesmanModal') {
        currentEditSalesmanId = null;
    }
}

// Utility functions
function filterCars() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const brandFilter = document.getElementById('brandFilter').value;
    const yearFilter = document.getElementById('yearFilter').value;
    const priceFilter = document.getElementById('priceFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const cityFilter = document.getElementById('cityFilter') ? document.getElementById('cityFilter').value : '';

    let filtered = cars.filter(car => {
        const matchesSearch = searchTerm === '' || 
            car.brand.toLowerCase().includes(searchTerm) ||
            car.model.toLowerCase().includes(searchTerm) ||
            (car.description || '').toLowerCase().includes(searchTerm) ||
            (car.vin || '').toLowerCase().includes(searchTerm) ||
            (car.ownerName || '').toLowerCase().includes(searchTerm) ||
            (car.city || '').toLowerCase().includes(searchTerm);

        const matchesBrand = brandFilter === '' || car.brand === brandFilter;
        const matchesYear = yearFilter === '' || car.year.toString() === yearFilter;
        const matchesStatus = statusFilter === '' || (car.status || 'available') === statusFilter;
        const matchesCity = cityFilter === '' || car.city === cityFilter;
        
        let matchesPrice = true;
        if (priceFilter) {
            if (priceFilter === '0-100000') {
                matchesPrice = car.price <= 100000;
            } else if (priceFilter === '100000-200000') {
                matchesPrice = car.price > 100000 && car.price <= 200000;
            } else if (priceFilter === '200000-300000') {
                matchesPrice = car.price > 200000 && car.price <= 300000;
            } else if (priceFilter === '300000+') {
                matchesPrice = car.price > 300000;
            }
        }

        return matchesSearch && matchesBrand && matchesYear && matchesPrice && matchesStatus && matchesCity;
    });

    displayCars(filtered);
}

function populateFilters() {
    // Brands
    const brands = [...new Set(cars.map(car => car.brand))].sort();
    const brandFilter = document.getElementById('brandFilter');
    brandFilter.innerHTML = '<option value="">Toutes les marques</option>' +
        brands.map(brand => `<option value="${brand}">${brand}</option>`).join('');

    // Years
    const years = [...new Set(cars.map(car => car.year))].sort((a, b) => b - a);
    const yearFilter = document.getElementById('yearFilter');
    yearFilter.innerHTML = '<option value="">Toutes les années</option>' +
        years.map(year => `<option value="${year}">${year}</option>`).join('');

    // Cities
    const cities = [...new Set(cars.map(car => car.city).filter(city => city))].sort();
    const cityFilter = document.getElementById('cityFilter');
    if (cityFilter) {
        cityFilter.innerHTML = '<option value="">Toutes les villes</option>' +
            cities.map(city => `<option value="${city}">${city}</option>`).join('');
    }
}

function populateSelects() {
    // Implementation for populating client/salesman selects
    // Similar to filters
}

function updateDashboard() {
    const availableCars = cars.filter(car => (car.status || 'available') === 'available');
    const totalValue = availableCars.reduce((sum, car) => sum + car.price, 0);
    
    document.getElementById('totalCars').textContent = availableCars.length;
    document.getElementById('totalValue').textContent = formatPrice(totalValue);
    document.getElementById('totalSales').textContent = sales.length;
    document.getElementById('totalRevenue').textContent = formatPrice(0); // Calculate from sales
    document.getElementById('totalClients').textContent = clients.length;
    document.getElementById('pendingQuotes').textContent = quotes.filter(q => q.status === 'pending').length;
}

function getStatusLabel(status) {
    switch(status) {
        case 'available': return 'Disponible';
        case 'reserved': return 'Réservé';
        case 'sold': return 'Vendu';
        default: return 'Disponible';
    }
}

function formatPrice(price) {
    return new Intl.NumberFormat('fr-MA', {
        style: 'currency',
        currency: 'MAD',
        minimumFractionDigits: 0
    }).format(price).replace('MAD', 'DHS');
}

function formatNumber(number) {
    return new Intl.NumberFormat('fr-FR').format(number);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('fr-FR');
}

function showLoading(show) {
    const loading = document.getElementById('loading');
    loading.style.display = show ? 'block' : 'none';
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
}

function exportData() {
    if (!isFirebaseConnected) {
        showNotification('Firebase non connecté', 'error');
        return;
    }
    
    const data = {
        cars,
        clients,
        salesmen,
        quotes,
        sales,
        reservations,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `autodeal-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    showNotification('Données exportées avec succès', 'success');
}

// Tab switching
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.getElementById(tabName + 'Tab').classList.add('active');
    event.target.classList.add('active');
    
    switch(tabName) {
        case 'dashboard':
            updateDashboard();
            break;
        case 'clients':
            displayClients();
            break;
        case 'salesmen':
            displaySalesmen();
            break;
    }
}

// Car details function
function showCarDetails(id) {
    const car = cars.find(c => c.id === id);
    if (!car) return;
    
    const equipmentList = getCarEquipment(car);
    
    const details = `
Détails du véhicule:

${car.brand} ${car.model} (${car.year})
Prix: ${formatPrice(car.price)}
Kilométrage: ${formatNumber(car.mileage)} km
Carburant: ${car.fuel}
Transmission: ${car.transmission}
Couleur: ${car.color || 'Non spécifiée'}
Portes: ${car.doors ? car.doors + ' portes' : 'Non spécifié'}
Puissance: ${car.fiscalPower ? car.fiscalPower + ' CV' : 'Non spécifiée'}
Cylindrée: ${car.engineSize ? car.engineSize + 'L' : 'Non spécifiée'}
N° Châssis: ${car.vin || 'Non renseigné'}
État: ${car.condition || 'Non spécifié'}
Première main: ${car.firstOwner || 'Non spécifié'}
Statut: ${getStatusLabel(car.status || 'available')}

Propriétaire:
${car.ownerName || 'Non renseigné'}
📞 ${car.ownerPhone || 'Non renseigné'}

Localisation:
${car.city || 'Non spécifiée'}${car.district ? ', ' + car.district : ''}

Équipements:
${equipmentList.length > 0 ? equipmentList.join(', ') : 'Aucun équipement renseigné'}

Description:
${car.description || 'Aucune description'}

Photos: ${car.photos ? car.photos.length : 0} photo(s)
    `;
    
    alert(details);
}

// Placeholder functions for future features
function showReserveModal(carId) {
    showNotification('Fonctionnalité de réservation en cours de développement', 'warning');
}

function showQuoteModal(carId) {
    showNotification('Fonctionnalité de devis en cours de développement', 'warning');
}