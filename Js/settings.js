document.addEventListener('DOMContentLoaded', () => {
    const tabsContainer = document.querySelector('.settings-tabs');
    const tabLinks = document.querySelectorAll('.setting-tab');
    const tabPanels = document.querySelectorAll('.setting-tab-content');

    const initialize = async () => {
        await window.rentalUtils.headerPromise;
        
        tabsContainer.addEventListener('click', (e) => {
            e.preventDefault();
            const clickedTab = e.target.closest('.setting-tab');
            if (!clickedTab) return;

            const tabId = clickedTab.dataset.tab;

            tabLinks.forEach(link => {
                link.classList.toggle('active-tab', link === clickedTab);
            });

            tabPanels.forEach(panel => {
                panel.classList.toggle('hidden', panel.id !== `${tabId}-tab-panel`);
            });
        });
    };

    initialize();
});