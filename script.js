// Gestion des données
let state = {
    ventes: [],
    compteurs: [],
    stock: [],
    depenses: [],
    avaries: [],
    machines: [],
    services: [], // Liste des types de services
    articles: [], // Liste des articles
    selectedDate: new Date().toISOString().split('T')[0]
};

// Initialiser la date
document.getElementById('operationDate').value = state.selectedDate;

// Fonction de changement de date
function changeOperationDate(date) {
    state.selectedDate = date;
    updateAllDisplays();
}

// Charger les données du localStorage au démarrage
function loadData() {
    const savedData = localStorage.getItem('copyshopData');
    if (savedData) {
        state = JSON.parse(savedData);
        state.selectedDate = document.getElementById('operationDate').value;
        updateAllDisplays();
    }
}

// Sauvegarder les données dans le localStorage
function saveData() {
    localStorage.setItem('copyshopData', JSON.stringify(state));
}

// Fonctions d'export
function exportTableToExcel(tableId, filename) {
    const table = document.getElementById(tableId);
    const ws = XLSX.utils.table_to_sheet(table);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, `${filename}_${state.selectedDate}.xlsx`);
}

function exportTableToPDF(tableId, filename) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const table = document.getElementById(tableId);
    doc.text(filename.charAt(0).toUpperCase() + filename.slice(1) + " du " + state.selectedDate, 14, 15);

    // Options pour autoTable (pour un meilleur style)
    doc.autoTable({
        html: table,
        theme: 'striped', // Ajoute des lignes zébrées
        headStyles: { fillColor: [200, 200, 200] }, // Couleur de fond pour l'en-tête
        styles: { halign: 'center' } // Alignement du texte au centre
    });

    doc.save(`${filename}_${state.selectedDate}.pdf`);
}

function printTable(tableId) {
    const printContent = document.getElementById(tableId).outerHTML;
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = `
        <div class="container">
            <h1 class="text-center">Rapport ${tableId.charAt(0).toUpperCase() + tableId.slice(1)} du ${state.selectedDate}</h1>
            ${printContent}
        </div>
    `;
    window.print();
    document.body.innerHTML = originalContent;
    loadData();
    updateAllDisplays();
    setupEventListeners();
}

// Impression de tous les rapports
function printAllReports() {
    // Afficher le tableau du bilan (qui est caché par défaut)
    document.getElementById('bilanTable').style.display = 'table';

    // Mettre à jour les valeurs du tableau du bilan
    document.getElementById('caBilan').textContent = document.getElementById('chiffreAffaires').textContent;
    document.getElementById('depensesBilan').textContent = document.getElementById('depensesJour').textContent;
    document.getElementById('beneficeBilan').textContent = document.getElementById('beneficeJour').textContent;

    const printContent = `
        <div class="container">
            <h1 class="text-center">Rapport Complet du ${state.selectedDate}</h1>
            <h2>Ventes</h2>
            ${document.getElementById('ventesTable').outerHTML}
            <h2>Compteurs</h2>
            ${document.getElementById('compteursTable').outerHTML}
            <h2>Stock</h2>
            ${document.getElementById('stockTable').outerHTML}
            <h2>Avaries</h2>
            ${document.getElementById('avariesTable').outerHTML}
            <h2>Bilan</h2>
            ${document.getElementById('bilanTable').outerHTML}
        </div>
    `;

    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;

    // Recacher le tableau du bilan après l'impression
    document.getElementById('bilanTable').style.display = 'none';

    loadData();
    updateAllDisplays();
    setupEventListeners();
}

// Gestion des onglets principaux
document.querySelectorAll('#mainTabs .nav-link').forEach(tab => {
    tab.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('#mainTabs .nav-link').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        tab.classList.add('active');
        document.getElementById(tab.dataset.tab).classList.add('active');
    });
});

// Gestion des onglets de la section "Listes"
document.querySelectorAll('#listTabs .nav-link').forEach(tab => {
    tab.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('#listTabs .nav-link').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.list-content').forEach(c => c.classList.remove('active'));

        tab.classList.add('active');
        document.getElementById(tab.dataset.list + "List").classList.add('active');
    });
});


// Gestion des ventes
function handleVenteSubmit(e) {
    e.preventDefault();
    const vente = {
        service: document.getElementById('typeService').value,
        quantite: parseInt(document.getElementById('quantiteVente').value),
        prixUnitaire: parseInt(document.getElementById('prixUnitaire').value),
        total: parseInt(document.getElementById('quantiteVente').value) * parseInt(document.getElementById('prixUnitaire').value),
        date: state.selectedDate
    };

    state.ventes.push(vente);
    saveData();
    updateVentesDisplay();
    updateBilanDisplay();
    e.target.reset();

    if (onlineMode) {
        database.ref('ventes').push(vente);
    }
}
document.getElementById('venteForm').addEventListener('submit', handleVenteSubmit);

// Gestion des compteurs
function handleCompteurSubmit(e) {
    e.preventDefault();
    const debut = parseInt(document.getElementById('compteurDebut').value);
    const fin = parseInt(document.getElementById('compteurFin').value);

    if (validateCompteurs(debut, fin)) {
        const compteur = {
            machine: document.getElementById('machine').value,
            debut: debut,
            fin: fin,
            difference: fin - debut,
            date: state.selectedDate
        };

        state.compteurs.push(compteur);
        saveData();
        updateCompteursDisplay();
        e.target.reset();

        if (onlineMode) {
            database.ref('compteurs').push(compteur);
        }
    }
}
document.getElementById('compteurForm').addEventListener('submit', handleCompteurSubmit);


// Gestion des avariés
function handleAvarieSubmit(e) {
    e.preventDefault();
    const avarie = {
        machine: document.getElementById('machineAvarie').value,
        nombre: parseInt(document.getElementById('nombreAvaries').value),
        cause: document.getElementById('causeAvarie').value,
        date: state.selectedDate
    };

    state.avaries.push(avarie);
    saveData();
    updateAvariesDisplay();
    e.target.reset();

    if (onlineMode) {
        database.ref('avaries').push(avarie);
    }
}
document.getElementById('avarieForm').addEventListener('submit', handleAvarieSubmit);

// Gestion du stock
function handleStockSubmit(e) {
    e.preventDefault();
    const stockItem = {
        article: document.getElementById('article').value,
        quantite: parseInt(document.getElementById('quantiteStock').value),
        prixAchat: parseInt(document.getElementById('prixAchat').value),
        valeur: parseInt(document.getElementById('quantiteStock').value) * parseInt(document.getElementById('prixAchat').value),
        date: state.selectedDate
    };

    state.stock.push(stockItem);
    state.depenses.push({
        montant: stockItem.valeur,
        date: state.selectedDate
    });

    saveData();
    updateStockDisplay();
    updateBilanDisplay();
    e.target.reset();

    if (onlineMode) {
        database.ref('stock').push(stockItem);
        database.ref('depenses').push({
            montant: stockItem.valeur,
            date: state.selectedDate
        });
    }
}
document.getElementById('stockForm').addEventListener('submit', handleStockSubmit);

// Gestion des machines
function handleMachineSubmit(e) {
    e.preventDefault();
    const machineName = document.getElementById('machineName').value;

    if (machineName.trim() !== "") { // Vérifier que le nom n'est pas vide
        state.machines.push(machineName);
        saveData();
        updateMachinesDisplay();
        updateMachineSelects(); // Mettre à jour les listes déroulantes des machines
        e.target.reset();

        if (onlineMode) {
            database.ref('machines').push(machineName);
        }
    } else {
        alert("Veuillez entrer un nom de machine valide.");
    }
}
document.getElementById('machineForm').addEventListener('submit', handleMachineSubmit);

function removeMachine(index) {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette machine ?")) {
        const machineToRemove = state.machines[index];
        state.machines.splice(index, 1);
        saveData();
        updateMachinesDisplay();
        updateMachineSelects();

        if (onlineMode) {
            const machineQuery = database.ref('machines').orderByValue().equalTo(machineToRemove);
            machineQuery.once('value', (snapshot) => {
                snapshot.forEach((childSnapshot) => {
                    childSnapshot.ref.remove();
                });
            });
        }
    }
}

// Gestion des types de services
function handleServiceSubmit(e) {
    e.preventDefault();
    const serviceName = document.getElementById('serviceName').value;

    if (serviceName.trim() !== "") {
        state.services.push(serviceName);
        saveData();
        updateServicesDisplay();
        updateServiceSelect(); // Mettre à jour la liste déroulante des services
        e.target.reset();

        if (onlineMode) {
            database.ref('services').push(serviceName);
        }
    } else {
        alert("Veuillez entrer un nom de service valide.");
    }
}
document.getElementById('serviceForm').addEventListener('submit', handleServiceSubmit);

function removeService(index) {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce service ?")) {
        const serviceToRemove = state.services[index];
        state.services.splice(index, 1);
        saveData();
        updateServicesDisplay();
        updateServiceSelect();

        if (onlineMode) {
            const serviceQuery = database.ref('services').orderByValue().equalTo(serviceToRemove);
            serviceQuery.once('value', (snapshot) => {
                snapshot.forEach((childSnapshot) => {
                    childSnapshot.ref.remove();
                });
            });
        }
    }
}

// Gestion des articles
function handleArticleSubmit(e) {
    e.preventDefault();
    const articleName = document.getElementById('articleName').value;

    if (articleName.trim() !== "") {
        state.articles.push(articleName);
        saveData();
        updateArticlesDisplay();
        updateArticleSelect(); // Mettre à jour la liste déroulante des articles
        e.target.reset();

        if (onlineMode) {
            database.ref('articles').push(articleName);
        }
    } else {
        alert("Veuillez entrer un nom d'article valide.");
    }
}
document.getElementById('articleForm').addEventListener('submit', handleArticleSubmit);

function removeArticle(index) {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet article ?")) {
        const articleToRemove = state.articles[index];
        state.articles.splice(index, 1);
        saveData();
        updateArticlesDisplay();
        updateArticleSelect();

        if (onlineMode) {
            const articleQuery = database.ref('articles').orderByValue().equalTo(articleToRemove);
            articleQuery.once('value', (snapshot) => {
                snapshot.forEach((childSnapshot) => {
                    childSnapshot.ref.remove();
                });
            });
        }
    }
}


// Fonctions d'affichage
function updateVentesDisplay() {
    const ventesTable = document.getElementById('ventesTable').getElementsByTagName('tbody')[0];
    ventesTable.innerHTML = '';

    const ventesJour = state.ventes.filter(v => v.date === state.selectedDate);

    ventesJour.forEach(vente => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${vente.service}</td> 
            <td>${vente.quantite}</td>
            <td>${vente.prixUnitaire.toLocaleString('fr-FR')} FCFA</td>
            <td>${vente.total.toLocaleString('fr-FR')} FCFA</td>
        `;
        ventesTable.appendChild(row);
    });
}

function updateCompteursDisplay() {
    const compteursTable = document.getElementById('compteursTable').getElementsByTagName('tbody')[0];
    compteursTable.innerHTML = '';

    const compteursJour = state.compteurs.filter(c => c.date === state.selectedDate);

    compteursJour.forEach(compteur => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${compteur.machine}</td> 
            <td>${compteur.debut}</td>
            <td>${compteur.fin}</td>
            <td>${compteur.difference}</td>
        `;
        compteursTable.appendChild(row);
    });
}

function updateAvariesDisplay() {
    const avariesTable = document.getElementById('avariesTable').getElementsByTagName('tbody')[0];
    avariesTable.innerHTML = '';

    const avariesJour = state.avaries.filter(a => a.date === state.selectedDate);

    avariesJour.forEach(avarie => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${avarie.machine}</td> 
            <td>${avarie.nombre}</td>
            <td>${avarie.cause}</td>
        `;
        avariesTable.appendChild(row);
    });
}

function updateStockDisplay() {
    const stockTable = document.getElementById('stockTable').getElementsByTagName('tbody')[0];
    stockTable.innerHTML = '';

    const stockConsolide = consolidateStock();

    Object.entries(stockConsolide).forEach(([article, data]) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${article}</td> 
            <td>${data.quantite}</td>
            <td>${data.valeur.toLocaleString('fr-FR')} FCFA</td>
        `;
        stockTable.appendChild(row);
    });
}

function updateBilanDisplay() {
    // Calcul du chiffre d'affaires
    const ca = state.ventes
        .filter(v => v.date === state.selectedDate)
        .reduce((sum, v) => sum + v.total, 0);

    // Calcul des dépenses
    const depenses = state.depenses
        .filter(d => d.date === state.selectedDate)
        .reduce((sum, d) => sum + d.montant, 0);

    // Calcul du bénéfice
    const benefice = ca - depenses;

    document.getElementById('chiffreAffaires').textContent = `${ca.toLocaleString('fr-FR')} FCFA`;
    document.getElementById('depensesJour').textContent = `${depenses.toLocaleString('fr-FR')} FCFA`;
    document.getElementById('beneficeJour').textContent = `${benefice.toLocaleString('fr-FR')} FCFA`;
}

// Affichage de la liste des machines
function updateMachinesDisplay() {
    const machinesTable = document.getElementById('machinesTable').getElementsByTagName('tbody')[0];
    machinesTable.innerHTML = '';

    state.machines.forEach((machine, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${machine}</td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="removeMachine(${index})">Supprimer</button>
            </td>
        `;
        machinesTable.appendChild(row);
    });
}

// Affichage de la liste des services
function updateServicesDisplay() {
    const servicesTable = document.getElementById('servicesTable').getElementsByTagName('tbody')[0];
    servicesTable.innerHTML = '';

    state.services.forEach((service, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${service}</td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="removeService(${index})">Supprimer</button>
            </td>
        `;
        servicesTable.appendChild(row);
    });
}

// Affichage de la liste des articles
function updateArticlesDisplay() {
    const articlesTable = document.getElementById('articlesTable').getElementsByTagName('tbody')[0];
    articlesTable.innerHTML = '';

    state.articles.forEach((article, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${article}</td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="removeArticle(${index})">Supprimer</button>
            </td>
        `;
        articlesTable.appendChild(row);
    });
}


// Mise à jour des listes déroulantes des machines
function updateMachineSelects() {
    const machineSelect = document.getElementById('machine');
    const machineAvarieSelect = document.getElementById('machineAvarie');

    machineSelect.innerHTML = '<option value="">Sélectionner...</option>';
    machineAvarieSelect.innerHTML = '<option value="">Sélectionner...</option>';

    state.machines.forEach(machine => {
        const option1 = document.createElement('option');
        option1.value = machine;
        option1.text = machine;
        machineSelect.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = machine;
        option2.text = machine;
        machineAvarieSelect.appendChild(option2);
    });
}

// Mise à jour de la liste déroulante des services
function updateServiceSelect() {
    const serviceSelect = document.getElementById('typeService');
    serviceSelect.innerHTML = '<option value="">Sélectionner...</option>';
    state.services.forEach(service => {
        const option = document.createElement('option');
        option.value = service;
        option.text = service;
        serviceSelect.appendChild(option);
    });
}

// Mise à jour de la liste déroulante des articles
function updateArticleSelect() {
    const articleSelect = document.getElementById('article');
    articleSelect.innerHTML = '<option value="">Sélectionner...</option>';
    state.articles.forEach(article => {
        const option = document.createElement('option');
        option.value = article;
        option.text = article;
        articleSelect.appendChild(option);
    });
}

function consolidateStock() {
    const stockConsolide = {};

    state.stock.forEach(item => {
        if (!stockConsolide[item.article]) {
            stockConsolide[item.article] = {
                quantite: 0,
                valeur: 0
            };
        }
        stockConsolide[item.article].quantite += item.quantite;
        stockConsolide[item.article].valeur += item.valeur;
    });

    return stockConsolide;
}

function updateAllDisplays() {
    updateVentesDisplay();
    updateCompteursDisplay();
    updateStockDisplay();
    updateBilanDisplay();
    updateAvariesDisplay();
    updateMachinesDisplay();
    updateServicesDisplay();
    updateArticlesDisplay();
}

function setupEventListeners() {
    document.querySelectorAll('#mainTabs .nav-link').forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('#mainTabs .nav-link').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });

    document.querySelectorAll('#listTabs .nav-link').forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('#listTabs .nav-link').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.list-content').forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(tab.dataset.list + "List").classList.add('active');
        });
    });

    document.getElementById('venteForm').addEventListener('submit', handleVenteSubmit);
    document.getElementById('compteurForm').addEventListener('submit', handleCompteurSubmit);
    document.getElementById('stockForm').addEventListener('submit', handleStockSubmit);
    document.getElementById('avarieForm').addEventListener('submit', handleAvarieSubmit);
    document.getElementById('machineForm').addEventListener('submit', handleMachineSubmit);
    document.getElementById('serviceForm').addEventListener('submit', handleServiceSubmit);
    document.getElementById('articleForm').addEventListener('submit', handleArticleSubmit);
}


// Validation des compteurs
function validateCompteurs(debut, fin) {
    if (fin < debut) {
        alert('Le compteur de fin ne peut pas être inférieur au compteur de début');
        return false;
    }
    return true;
}

// Gestion des erreurs
function handleError(error) {
    console.error('Erreur:', error);
    alert('Une erreur est survenue. Veuillez réessayer.');
}

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCKYuUs_LNnZoQYSOMWEPLpIEcfampNjYA",
    authDomain: "evisions-84300.firebaseapp.com",
    databaseURL: "https://evisions-84300-default-rtdb.firebaseio.com",
    projectId: "evisions-84300",
    storageBucket: "evisions-84300.appspot.com",
    messagingSenderId: "18459203689",
    appId: "1:18459203689:web:3ad1afd2d496eab2296af8",
    measurementId: "G-T0REDWP86Q"
};

// Initialiser Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Gestion du mode en ligne/hors ligne
let onlineMode = false;
const onlineModeSwitch = document.getElementById('onlineModeSwitch');
const connectionStatus = document.getElementById('connectionStatus');

// Vérifier l'état de la connexion au démarrage
checkConnectionStatus();

// Écouteur d'événement pour le changement du mode en ligne/hors ligne
onlineModeSwitch.addEventListener('change', () => {
    onlineMode = onlineModeSwitch.checked;
    localStorage.setItem('onlineMode', onlineMode); // Mémoriser le choix de l'utilisateur

    if (onlineMode) {
        // Synchroniser les données avec Firebase
        syncDataWithFirebase();
    }

    updateConnectionStatus();
});

// Fonction pour vérifier l'état de la connexion
function checkConnectionStatus() {
    if (navigator.onLine) {
        connectionStatus.textContent = 'En ligne';
        // Charger le mode en ligne si précédemment sélectionné
        onlineMode = localStorage.getItem('onlineMode') === 'true';
        onlineModeSwitch.checked = onlineMode;
        if (onlineMode) {
            syncDataWithFirebase();
        }
    } else {
        connectionStatus.textContent = 'Hors ligne';
        onlineMode = false;
        onlineModeSwitch.checked = false;
        loadData(); // Charger les données locales si hors ligne
    }

    updateConnectionStatus();
}

// Fonction pour mettre à jour l'affichage de l'état de la connexion
function updateConnectionStatus() {
    if (onlineMode) {
        connectionStatus.textContent = 'En ligne';
        connectionStatus.classList.remove('text-danger');
        connectionStatus.classList.add('text-success');
    } else {
        connectionStatus.textContent = 'Hors ligne';
        connectionStatus.classList.remove('text-success');
        connectionStatus.classList.add('text-danger');
    }
}

// Fonction pour synchroniser les données avec Firebase
function syncDataWithFirebase() {
    // Synchroniser les ventes
    const ventesRef = database.ref('ventes');
    ventesRef.on('value', (snapshot) => {
        const firebaseVentes = snapshot.val() || [];
        state.ventes = Object.values(firebaseVentes); 
        updateVentesDisplay();
        updateBilanDisplay();
    });

    // Synchroniser les compteurs
    const compteursRef = database.ref('compteurs');
    compteursRef.on('value', (snapshot) => {
        const firebaseCompteurs = snapshot.val() || [];
        state.compteurs = Object.values(firebaseCompteurs); 
        updateCompteursDisplay();
    });

    // Synchroniser le stock
    const stockRef = database.ref('stock');
    stockRef.on('value', (snapshot) => {
        const firebaseStock = snapshot.val() || [];
        state.stock = Object.values(firebaseStock); 
        updateStockDisplay();
        updateBilanDisplay();
    });

    // Synchroniser les dépenses
    const depensesRef = database.ref('depenses');
    depensesRef.on('value', (snapshot) => {
        const firebaseDepenses = snapshot.val() || [];
        state.depenses = Object.values(firebaseDepenses);
        updateBilanDisplay();
    });

    // Synchroniser les avaries
    const avariesRef = database.ref('avaries');
    avariesRef.on('value', (snapshot) => {
        const firebaseAvaries = snapshot.val() || [];
        state.avaries = Object.values(firebaseAvaries);
        updateAvariesDisplay();
    });

    // Synchroniser les machines
    const machinesRef = database.ref('machines');
    machinesRef.on('value', (snapshot) => {
        const firebaseMachines = snapshot.val() || [];
        state.machines = Object.values(firebaseMachines);
        updateMachinesDisplay();
        updateMachineSelects();
    });

    // Synchroniser les services
    const servicesRef = database.ref('services');
    servicesRef.on('value', (snapshot) => {
        const firebaseServices = snapshot.val() || [];
        state.services = Object.values(firebaseServices);
        updateServicesDisplay();
        updateServiceSelect();
    });

    // Synchroniser les articles
    const articlesRef = database.ref('articles');
    articlesRef.on('value', (snapshot) => {
        const firebaseArticles = snapshot.val() || [];
        state.articles = Object.values(firebaseArticles);
        updateArticlesDisplay();
        updateArticleSelect();
    });

}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    try {
        loadData();
        setupEventListeners();
        updateMachineSelects(); // Initialiser les listes déroulantes des machines
        updateServiceSelect(); // Initialiser la liste déroulante des services
        updateArticleSelect(); // Initialiser la liste déroulante des articles
    } catch (error) {
        handleError(error);
    }
});

// Sauvegarde automatique périodique
setInterval(() => {
    try {
        saveData();
    } catch (error) {
        handleError(error);
    }
}, 300000); // Sauvegarde toutes les 5 minutes

// Écouteur d'événement pour la détection des changements de connexion
window.addEventListener('online', checkConnectionStatus);
window.addEventListener('offline', checkConnectionStatus);