document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('#sidebar .nav-link');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    const recordPaymentModal = document.getElementById('record-payment-modal');
    const openRecordPaymentModalBtn = document.getElementById('open-record-payment-modal');
    const closeModalBtns = document.querySelectorAll('.close-modal-btn');

    // Function to set active state on nav links
    navLinks.forEach(link => {
        if (link.href === window.location.href) {
            link.classList.add('active');
            link.parentNode.classList.add('active'); // Add to parent li for styling
        }
    });

    // Sidebar toggle functionality (for responsive design)
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active'); // Use 'active' class to toggle
        });
    }

    // Function to open a modal
    function openModal(modal) {
        modal.classList.remove('hidden');
    }

    // Function to close a modal
    function closeModal(modal) {
        modal.classList.add('hidden');
    }

    // Event listeners for modal buttons
    if (openRecordPaymentModalBtn && recordPaymentModal) {
        openRecordPaymentModalBtn.addEventListener('click', () => openModal(recordPaymentModal));
    }
});
lucide.createIcons();


