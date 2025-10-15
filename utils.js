// utils.js - Shared JavaScript utilities

// Function to open a modal
function openModal(modal) {
    modal.classList.remove('hidden');
}

// Function to close a modal
function closeModal(modal) {
    modal.classList.add('hidden');
}

// Function to include HTML content
async function includeHTML(target, url) {
    const resp = await fetch(url);
    if (resp.ok) {
        const html = await resp.text();
        document.getElementById(target).innerHTML = html;
    } else {
        console.error(`Failed to fetch ${url}: ${resp.status} ${resp.statusText}`);
        document.getElementById(target).innerHTML = '<p class="text-red-500">Failed to load content.</p>';
    }
}

// Export the functions to make them accessible in other files
export { openModal, closeModal, includeHTML };