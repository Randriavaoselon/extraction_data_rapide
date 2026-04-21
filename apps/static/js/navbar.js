document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.getElementById('navbar');
    const navContent = document.getElementById('nav-content');
    const mobileBtn = document.getElementById('mobile-menu-button');
    const closeBtn = document.getElementById('close-menu');
    const mobileMenu = document.getElementById('mobile-menu');
    const overlay = document.getElementById('menu-overlay');

    let lastScroll = 0;

    function updateNavbarStyle() {
        const currentScroll = window.pageYOffset;
        const isMobile = window.innerWidth < 1024;
        const isMenuOpen = mobileMenu && !mobileMenu.classList.contains('-translate-x-full');

        if (currentScroll > 10 || isMobile || isMenuOpen) {
            navbar.style.setProperty('background-color', 'rgba(5, 7, 10, 0.95)', 'important');
            navbar.classList.add('backdrop-blur-md', 'border-b', 'border-white/10', 'shadow-2xl');
            navContent.style.height = isMobile ? "70px" : "64px";
        } else {
            navbar.style.setProperty('background-color', 'transparent', 'important');
            navbar.classList.remove('backdrop-blur-md', 'border-b', 'border-white/10', 'shadow-2xl');
            navContent.style.height = "96px";
        }
    }

    function toggleMenu(open) {
        if (open) {
            // Force le background du drawer mobile
            mobileMenu.style.setProperty('background-color', '#05070a', 'important');
            mobileMenu.style.opacity = "1";
            mobileMenu.classList.remove('-translate-x-full');
            
            if (overlay) {
                overlay.classList.remove('opacity-0', 'pointer-events-none');
                overlay.classList.add('opacity-100');
            }
            document.body.style.overflow = "hidden";
        } else {
            mobileMenu.classList.add('-translate-x-full');
            if (overlay) {
                overlay.classList.add('opacity-0', 'pointer-events-none');
                overlay.classList.remove('opacity-100');
            }
            document.body.style.overflow = ""; 
        }
        updateNavbarStyle(); 
    }

    if (mobileBtn) mobileBtn.addEventListener('click', () => toggleMenu(true));
    if (closeBtn) closeBtn.addEventListener('click', () => toggleMenu(false));
    if (overlay) overlay.addEventListener('click', () => toggleMenu(false));
    
    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => toggleMenu(false));
    });

    window.addEventListener('scroll', () => {
        updateNavbarStyle();
        const currentScroll = window.pageYOffset;
        const isMenuOpen = !mobileMenu.classList.contains('-translate-x-full');

        if (currentScroll > lastScroll && currentScroll > 150 && !isMenuOpen) {
            navbar.classList.add('-translate-y-full');
        } else {
            navbar.classList.remove('-translate-y-full');
        }
        lastScroll = currentScroll;
    }, { passive: true });

    window.addEventListener('resize', updateNavbarStyle);
    updateNavbarStyle();
});