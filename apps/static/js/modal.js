// On récupère les éléments de la modale
const exportModal = document.getElementById('exportModal');
const btnOpenExport = document.querySelector('[data-export-btn]');
const btnCloseModal = document.getElementById('closeModal');
const btnCancelModal = document.getElementById('cancelModal');

/**
 * Ouvrir la modale (Vérifie d'abord si des lignes sont cochées)
 */
btnOpenExport.addEventListener('click', () => {
    const selectedCount = document.querySelectorAll('.row-checkbox:checked').length;
    
    if (selectedCount === 0) {
        alert("Veuillez sélectionner au moins une ligne à exporter.");
        return;
    }
    
    exportModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Empêche le scroll en arrière-plan
});

/**
 * Fermer la modale
 */
function closeModal() {
    exportModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

[btnCloseModal, btnCancelModal].forEach(btn => btn.addEventListener('click', closeModal));

exportModal.addEventListener('click', (e) => {
    if (e.target === exportModal.querySelector('.bg-gray-900\\/60')) closeModal();
});

/**
 * Fonction appelée par les boutons à l'intérieur de la modale
 */
async function confirmExport(format) {
    closeModal(); 
    await exportSelectedData(format); 
}