document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('uploadForm');
    const fileInput = document.getElementById('fileInput');
    const scanBtn = document.getElementById('scanBtn');
    const dropZone = document.getElementById('dropZone');
    const tableSearch = document.getElementById('tableSearch');
    
    // Éléments de la modale d'export
    const exportModal = document.getElementById('exportModal');
    const btnCancelModal = document.getElementById('cancelModal');
    const btnCloseModal = document.getElementById('closeModal');
    
    // supprime tout événement "fantôme" qui lancerait le téléchargement direct
    let btnOpenExport = document.querySelector('[data-export-btn]');
    if (btnOpenExport) {
        const cleanBtn = btnOpenExport.cloneNode(true);
        btnOpenExport.parentNode.replaceChild(cleanBtn, btnOpenExport);
        
        // On ré-assigne la référence au bouton propre
        cleanBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const selectedCount = document.querySelectorAll('.row-checkbox:checked').length;
            
            if (selectedCount === 0) {
                alert("Veuillez sélectionner au moins une ligne dans le tableau pour exporter.");
                return;
            }

            // Affiche la modale SANS appeler exportSelectedData()
            if (exportModal) {
                exportModal.classList.remove('hidden');
                document.body.style.overflow = 'hidden'; 
            }
        });
    }

    // Charger les données sauvegardées
    const savedData = localStorage.getItem('lastAnalysisData');
    if (savedData) {
        try {
            renderTable(JSON.parse(savedData));
        } catch (e) {
            console.error("Erreur de cache:", e);
            localStorage.removeItem('lastAnalysisData');
        }
    }

    // ---  GESTION DU DRAG & DROP ---
    if (dropZone && fileInput) {
        dropZone.onclick = () => fileInput.click();

        ['dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        dropZone.addEventListener('dragover', () => {
            dropZone.classList.add('border-indigo-500', 'bg-indigo-50/50');
            dropZone.classList.remove('border-gray-200');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('border-indigo-500', 'bg-indigo-50/50');
            dropZone.classList.add('border-gray-200');
        });

        dropZone.addEventListener('drop', (e) => {
            dropZone.classList.remove('border-indigo-500', 'bg-indigo-50/50');
            dropZone.classList.add('border-gray-200');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                fileInput.files = files;
                handleFormSubmit();
            }
        });
    }

    // --- RECHERCHE ---
    if (tableSearch) {
        tableSearch.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('#tableBody tr');
            let visibleCount = 0;

            rows.forEach(row => {
                const isMatch = row.innerText.toLowerCase().includes(term);
                row.classList.toggle('hidden', !isMatch);
                if (isMatch) visibleCount++;
            });

            const rowCountBadge = document.getElementById('rowCount');
            if (rowCountBadge) rowCountBadge.innerText = `${visibleCount} résultats trouvés`;
        });
    }

    // --- FERMETURE DE LA MODALE ---
    const closeModal = () => {
        if (exportModal) {
            exportModal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    };

    if (btnCancelModal) btnCancelModal.addEventListener('click', closeModal);
    if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);

    // --- AUTRES ÉCOUTEURS D'ÉVÉNEMENTS ---
    if (scanBtn) scanBtn.onclick = () => fileInput.click();
    
    if (fileInput) {
        fileInput.onchange = () => {
            if (fileInput.files.length > 0) handleFormSubmit();
        };
    }

    if (uploadForm) {
        uploadForm.onsubmit = (e) => {
            e.preventDefault();
            handleFormSubmit();
        };
    }
});

/**
 * Fonctions globales (En dehors du DOMContentLoaded)
 */
async function confirmExport(format) {
    // Fermer la modale
    const exportModal = document.getElementById('exportModal');
    if (exportModal) {
        exportModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }

    // Lance l'export 
    await exportSelectedData(format);
}

/**
 * Logique d'envoi vers Django DRF
 */
async function handleFormSubmit(event) {
    if (event) event.preventDefault();
    
    const fileInput = document.getElementById('fileInput');
    const scanBtn = document.getElementById('scanBtn');
    if (!fileInput.files[0]) return;

    // Feedback bouton
    const originalBtn = scanBtn.innerHTML;
    scanBtn.disabled = true;
    scanBtn.innerHTML = `<svg class="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">...</svg> Analyse...`;

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    try {
        const response = await fetch('/upload/', {
            method: 'POST',
            body: formData,
            headers: { 'X-CSRFToken': getCookie('csrftoken') }
        });

        const result = await response.json();
        if (response.ok) {
            localStorage.setItem('lastAnalysisData', JSON.stringify(result.data));
            renderTable(result.data);
        } else {
            alert("Erreur: " + result.message);
        }
    } catch (error) {
        alert("Erreur réseau");
    } finally {
        scanBtn.disabled = false;
        scanBtn.innerHTML = originalBtn;
        fileInput.value = '';
    }
}

/**
 * Rendu du tableau avec colonnes de sélection
 */
function renderTable(data) {
    const head = document.getElementById('tableHead');
    const body = document.getElementById('tableBody');
    const selectAllCheck = document.getElementById('selectAll');

    head.innerHTML = '';
    body.innerHTML = '';

    // CRÉATION DU HEADER
    const trHead = document.createElement('tr');
    
    // Colonne Checkbox Header
    const thCheck = document.createElement('th');
    thCheck.className = "px-6 py-4 border-b border-gray-100 bg-gray-50 sticky top-0 w-10";
    trHead.appendChild(thCheck);

    data.columns.forEach(colName => {
        const th = document.createElement('th');
        th.className = "px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider border-b border-gray-100 sticky top-0 bg-gray-50";
        th.innerText = colName;
        trHead.appendChild(th);
    });
    head.appendChild(trHead);

    // CRÉATION DES LIGNES
    data.rows.forEach((rowData) => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-indigo-50/40 transition-colors group";
        
        // Checkbox de ligne
        const tdCheck = document.createElement('td');
        tdCheck.className = "px-6 py-4 whitespace-nowrap border-b border-gray-50";
        tdCheck.innerHTML = `<input type="checkbox" class="row-checkbox w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer">`;
        tr.appendChild(tdCheck);

        data.columns.forEach(colName => {
            const td = document.createElement('td');
            td.className = "px-6 py-4 whitespace-nowrap text-sm text-gray-600 border-b border-gray-50";
            td.innerText = rowData[colName] ?? '';
            tr.appendChild(td);
        });
        body.appendChild(tr);
    });

    // LOGIQUE "TOUT SÉLECTIONNER"
    if (selectAllCheck) {
        selectAllCheck.checked = false; 
        selectAllCheck.onclick = function() {
            const allRowChecks = document.querySelectorAll('.row-checkbox');
            allRowChecks.forEach(cb => {
                if (cb.closest('tr').style.display !== 'none') {
                    cb.checked = selectAllCheck.checked;
                    cb.closest('tr').classList.toggle('bg-indigo-50/30', cb.checked);
                }
            });
        };
    }

    // Gestion de l'affichage des conteneurs (identique à avant)
    document.getElementById('dropZone').classList.add('hidden');
    document.getElementById('resultContainer').classList.remove('hidden');
    document.getElementById('rowCount').innerText = `${data.rows.length} lignes détectées`;
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

/**
 * Collecte les lignes sélectionnées et gère le téléchargement
 */
async function exportSelectedData(format = 'xlsx') {
    const rows = document.querySelectorAll('#tableBody tr');
    const selectedData = [];
    const columns = [];

    //  Récupérer les noms des colonnes (en ignorant la première colonne de checkbox)
    document.querySelectorAll('#tableHead th').forEach((th, index) => {
        if (index > 0) columns.push(th.innerText);
    });

    // Parcourir les lignes pour trouver celles qui sont cochées
    rows.forEach(row => {
        const checkbox = row.querySelector('.row-checkbox');
        if (checkbox && checkbox.checked) {
            const rowData = {};
            const cells = row.querySelectorAll('td');
           
            columns.forEach((colName, index) => {
                rowData[colName] = cells[index + 1].innerText;
            });
            selectedData.push(rowData);
        }
    });

    if (selectedData.length === 0) {
        alert("Veuillez sélectionner au moins une ligne à exporter.");
        return;
    }

    // Envoi au serveur pour génération du fichier
    try {
        const response = await fetch('/export/', { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                selected_data: selectedData,
                format: format
            })
        });

        if (response.ok) {
           
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `export_agents.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }
    } catch (error) {
        console.error("Erreur d'export:", error);
    }
}

document.querySelector('[data-export-btn]').addEventListener('click', () => exportSelectedData('xlsx'));