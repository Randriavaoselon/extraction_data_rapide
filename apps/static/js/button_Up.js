document.addEventListener('DOMContentLoaded', () => {
    const backToTop = document.getElementById('backToTop');

    // Gestion de la visibilité au scroll
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 400) {
            // Affiche le bouton avec une animation fluide
            backToTop.classList.remove('translate-y-24', 'opacity-0');
            backToTop.classList.add('translate-y-0', 'opacity-100');
        } else {
            // Cache le bouton
            backToTop.classList.remove('translate-y-0', 'opacity-100');
            backToTop.classList.add('translate-y-24', 'opacity-0');
        }
    }, { passive: true });

    // Action de retour en haut
    backToTop.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});