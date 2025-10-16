document.addEventListener('DOMContentLoaded', () => {
    const headerPromise = window.rentalUtils.headerPromise;

    // Ensure the promise exists (it won't on pages without a header-container)
    if (headerPromise) {
        headerPromise.then(headerContainer => {
            if (headerContainer) {
                setupMainLayoutInteractions(headerContainer);
            }
        });
    }
});

function setupMainLayoutInteractions(headerContainer) {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');

    const sidebarToggle = headerContainer.querySelector('#sidebar-toggle');
    const userMenuButton = headerContainer.querySelector('#user-menu-button');
    const userMenu = headerContainer.querySelector('#user-menu');

    if (sidebarToggle && sidebar && mainContent) {
        sidebarToggle.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                // On mobile, we might want a different behavior, like an overlay
                document.body.classList.toggle('sidebar-toggled-on-mobile');
            } else {
                // On desktop, collapse/expand the sidebar
                document.body.classList.toggle('sidebar-collapsed');
            }
        });
    }

    if (userMenuButton && userMenu) {
        userMenuButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent the global click listener from closing it immediately
            userMenu.classList.toggle('hidden');
        });
    }

    document.addEventListener('click', (event) => {
        if (userMenu && !userMenu.classList.contains('hidden') && !userMenuButton.contains(event.target) && !userMenu.contains(event.target)) {
            userMenu.classList.add('hidden');
        }
    });
}