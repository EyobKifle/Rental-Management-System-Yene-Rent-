document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Navigation Toggle
    const navLinks = document.querySelector('.nav-links');
    const menuToggle = document.querySelector('.menu-toggle');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            // Change icon
            const icon = menuToggle.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times'); // 'X' icon
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars'); // Hamburger icon
            }
        });

        // Close menu when a link is clicked (for single-page navigation)
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                if (navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                    menuToggle.querySelector('i').classList.remove('fa-times');
                    menuToggle.querySelector('i').classList.add('fa-bars');
                }
            });
        });
    }


    // 2. Scroll Reveal Animation Logic
    const revealElements = document.querySelectorAll('.reveal');

    // Function to check if an element is in the viewport
    const isElementInViewport = (el) => {
        const rect = el.getBoundingClientRect();
        return (
            rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.left <= (window.innerWidth || document.documentElement.clientWidth) &&
            rect.bottom >= 0 &&
            rect.right >= 0
        );
    };

    // Function to handle the scroll event
    const handleScrollReveal = () => {
        revealElements.forEach(el => {
            // Only reveal if the element hasn't been revealed yet
            if (!el.classList.contains('active') && isElementInViewport(el)) {
                el.classList.add('active');
            }
        });
    };

    // Initial check and set up scroll/resize listeners
    handleScrollReveal();
    window.addEventListener('scroll', handleScrollReveal);
    window.addEventListener('resize', handleScrollReveal);
});