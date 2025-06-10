// ================================================================
// CONFIGURATION FIREBASE PARTAGÉE
// Ce fichier contient la configuration Firebase utilisée par les deux applications
// ================================================================

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyD_mR3fVHL21TsJmBgELm-rOBqEU0OFKfE",
    authDomain: "autodeal-8f0e7.firebaseapp.com",
    projectId: "autodeal-8f0e7",
    storageBucket: "autodeal-8f0e7.appspot.com",
    messagingSenderId: "1058923478215",
    appId: "1:1058923478215:web:9f3b8d4c5e7a2d1b4c5f6d"
};

// Données de démonstration pour le mode hors ligne
const DEMO_CARS = [
    {
        id: 'demo1',
        brand: 'Renault',
        model: 'Clio 4',
        year: 2018,
        mileage: 65000,
        price: 125000,
        fuel: 'Essence',
        transmission: 'Manuelle',
        city: 'Casablanca',
        district: 'Maarif',
        ownerName: 'Ahmed Bennani',
        ownerPhone: '0661234567',
        status: 'available',
        description: 'Voiture en excellent état, première main, jamais accidentée. Entretien régulier chez le concessionnaire.',
        firstOwner: 'Oui',
        condition: 'Excellent',
        color: 'Gris',
        doors: '5',
        fiscalPower: 6,
        engineSize: 1.2,
        airCon: true,
        powerSteering: true,
        electricWindows: true,
        abs: true,
        airbags: true,
        bluetooth: true,
        centralLocking: true,
        photos: [],
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
    },
    {
        id: 'demo2',
        brand: 'Peugeot',
        model: '208',
        year: 2020,
        mileage: 45000,
        price: 165000,
        fuel: 'Diesel',
        transmission: 'Manuelle',
        city: 'Rabat',
        district: 'Agdal',
        ownerName: 'Fatima Alami',
        ownerPhone: '0677889900',
        status: 'available',
        description: 'Véhicule bien entretenu avec carnet d\'entretien complet. Toutes les révisions effectuées.',
        firstOwner: 'Non',
        condition: 'Très bon',
        color: 'Blanc',
        doors: '5',
        fiscalPower: 5,
        engineSize: 1.5,
        airCon: true,
        powerSteering: true,
        electricWindows: true,
        abs: true,
        airbags: true,
        gps: true,
        bluetooth: true,
        cruiseControl: true,
        centralLocking: true,
        parkingSensors: true,
        photos: [],
        createdAt: new Date('2024-02-10'),
        updatedAt: new Date('2024-02-10')
    },
    {
        id: 'demo3',
        brand: 'Volkswagen',
        model: 'Golf 7',
        year: 2019,
        mileage: 38000,
        price: 245000,
        fuel: 'Essence',
        transmission: 'Automatique',
        city: 'Casablanca',
        district: 'Anfa',
        ownerName: 'Mohamed Tazi',
        ownerPhone: '0655443322',
        status: 'available',
        description: 'Golf 7 TSI, toutes options, état showroom. Pack R-Line, toit panoramique.',
        firstOwner: 'Oui',
        condition: 'Excellent',
        color: 'Noir',
        doors: '5',
        fiscalPower: 8,
        engineSize: 1.4,
        airCon: true,
        powerSteering: true,
        electricWindows: true,
        abs: true,
        airbags: true,
        gps: true,
        bluetooth: true,
        cruiseControl: true,
        centralLocking: true,
        parkingSensors: true,
        sunroof: true,
        leatherSeats: true,
        photos: [],
        createdAt: new Date('2024-03-05'),
        updatedAt: new Date('2024-03-05')
    },
    {
        id: 'demo4',
        brand: 'Toyota',
        model: 'Corolla',
        year: 2021,
        mileage: 25000,
        price: 280000,
        fuel: 'Hybride',
        transmission: 'Automatique',
        city: 'Marrakech',
        district: 'Guéliz',
        ownerName: 'Youssef Benali',
        ownerPhone: '0611223344',
        status: 'available',
        description: 'Corolla Hybride, économique et écologique. Garantie constructeur jusqu\'en 2025.',
        firstOwner: 'Oui',
        condition: 'Excellent',
        color: 'Argent',
        doors: '4',
        fiscalPower: 7,
        engineSize: 1.8,
        airCon: true,
        powerSteering: true,
        electricWindows: true,
        abs: true,
        airbags: true,
        gps: true,
        bluetooth: true,
        cruiseControl: true,
        centralLocking: true,
        parkingSensors: true,
        photos: [],
        createdAt: new Date('2024-03-20'),
        updatedAt: new Date('2024-03-20')
    },
    {
        id: 'demo5',
        brand: 'Mercedes',
        model: 'Classe A',
        year: 2018,
        mileage: 55000,
        price: 320000,
        fuel: 'Diesel',
        transmission: 'Automatique',
        city: 'Fès',
        district: 'Ville Nouvelle',
        ownerName: 'Amal Idrissi',
        ownerPhone: '0622334455',
        status: 'available',
        description: 'Mercedes Classe A AMG Line, Full options, carnet d\'entretien Mercedes.',
        firstOwner: 'Non',
        condition: 'Très bon',
        color: 'Rouge',
        doors: '5',
        fiscalPower: 9,
        engineSize: 2.0,
        airCon: true,
        powerSteering: true,
        electricWindows: true,
        abs: true,
        airbags: true,
        gps: true,
        bluetooth: true,
        cruiseControl: true,
        centralLocking: true,
        parkingSensors: true,
        sunroof: true,
        leatherSeats: true,
        photos: [],
        createdAt: new Date('2024-04-01'),
        updatedAt: new Date('2024-04-01')
    },
    {
        id: 'demo6',
        brand: 'Dacia',
        model: 'Duster',
        year: 2022,
        mileage: 15000,
        price: 180000,
        fuel: 'Essence',
        transmission: 'Manuelle',
        city: 'Tanger',
        district: 'Malabata',
        ownerName: 'Rachid Amrani',
        ownerPhone: '0633445566',
        status: 'available',
        description: 'Duster neuf, idéal pour la ville et les escapades. Garantie jusqu\'en 2025.',
        firstOwner: 'Oui',
        condition: 'Excellent',
        color: 'Bleu',
        doors: '5',
        fiscalPower: 6,
        engineSize: 1.3,
        airCon: true,
        powerSteering: true,
        electricWindows: true,
        abs: true,
        airbags: true,
        bluetooth: true,
        centralLocking: true,
        photos: [],
        createdAt: new Date('2024-04-15'),
        updatedAt: new Date('2024-04-15')
    }
];

const DEMO_CLIENTS = [
    {
        id: 'client1',
        name: 'Bennani',
        firstName: 'Ahmed',
        phone: '0661234567',
        email: 'ahmed.bennani@email.com',
        city: 'Casablanca',
        cin: 'AB123456',
        address: '123 Rue Mohammed V, Casablanca',
        birthDate: '1985-05-15',
        profession: 'Ingénieur',
        notes: 'Client fidèle, intéressé par les berlines',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
    },
    {
        id: 'client2',
        name: 'Alami',
        firstName: 'Fatima',
        phone: '0677889900',
        email: 'fatima.alami@email.com',
        city: 'Rabat',
        cin: 'CD789012',
        address: '45 Avenue Hassan II, Rabat',
        birthDate: '1990-08-22',
        profession: 'Médecin',
        notes: 'Recherche véhicule économique',
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-01')
    }
];

const DEMO_SALESMEN = [
    {
        id: 'salesman1',
        name: 'Alaoui',
        firstName: 'Youssef',
        phone: '0611223344',
        email: 'youssef.alaoui@autodeal.ma',
        commission: 5,
        hireDate: '2023-01-15',
        totalSales: 12,
        totalRevenue: 2400000,
        notes: 'Vendeur expérimenté, spécialiste des voitures allemandes',
        createdAt: new Date('2023-01-15'),
        updatedAt: new Date('2024-04-01')
    },
    {
        id: 'salesman2',
        name: 'Tazi',
        firstName: 'Karim',
        phone: '0655667788',
        email: 'karim.tazi@autodeal.ma',
        commission: 4,
        hireDate: '2023-06-01',
        totalSales: 8,
        totalRevenue: 1600000,
        notes: 'Nouveau vendeur, très motivé',
        createdAt: new Date('2023-06-01'),
        updatedAt: new Date('2024-04-01')
    }
];

// Fonction utilitaire pour initialiser Firebase
async function initializeFirebaseConfig(firebaseInstance, isModular = false) {
    try {
        if (isModular) {
            // Pour client.html (Firebase modulaire)
            const { initializeApp } = firebaseInstance;
            const app = initializeApp(FIREBASE_CONFIG);
            return app;
        } else {
            // Pour index.html (Firebase compat)
            firebaseInstance.initializeApp(FIREBASE_CONFIG);
            return firebaseInstance.firestore();
        }
    } catch (error) {
        console.error('Erreur initialisation Firebase:', error);
        throw error;
    }
}

// Export pour utilisation dans d'autres fichiers
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        FIREBASE_CONFIG,
        DEMO_CARS,
        DEMO_CLIENTS,
        DEMO_SALESMEN,
        initializeFirebaseConfig
    };
}