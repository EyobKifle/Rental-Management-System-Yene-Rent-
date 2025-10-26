// Js/public-page.js - Logic for public-facing pages like index.html and login.html

document.addEventListener('DOMContentLoaded', () => {
    // Initialize settings service if it's not already on the window
    if (!window.settingsService) {
        window.settingsService = new SettingsService();
    }

    /**
     * A lightweight utility class for public pages.
     */
    class PublicPageUtils {
        constructor() {
            this.init();
        }

        async init() {
            this.applyTheme();
            await this.loadPublicHeader();
            await this.initI18n();
            this.setupHeaderInteractions();
        }

        applyTheme() {
            const settings = window.settingsService.getSettings();
            const theme = settings.appearance.theme || 'light';
            document.body.setAttribute('data-theme', theme);
        }

        async loadPublicHeader() {
            const headerContainer = document.getElementById('header-container');
            if (headerContainer) {
                try {
                    const response = await fetch('/Html/header-public.html');
                    if (!response.ok) throw new Error('Failed to load public header.');
                    headerContainer.innerHTML = await response.text();
                } catch (error) {
                    console.error('Error loading public header:', error);
                    headerContainer.innerHTML = '<p style="text-align:center; color:red;">Error: Could not load page header.</p>';
                }
            }
        }

        async initI18n() {
            const settings = window.settingsService.getSettings();
            const lang = settings.regional.language || 'en';
            if (lang === 'am') {
                // Dynamically load the Amharic translation file if not already loaded
                if (!window.translations) {
                    await new Promise((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = '/Js/i18n/am.js';
                        script.onload = resolve;
                        script.onerror = reject;
                        document.head.appendChild(script);
                    });
                }
            }
            this.translatePage();
        }

        translatePage() {
            const settings = window.settingsService.getSettings();
            const lang = settings.regional.language || 'en';
            if (lang === 'en' || !window.translations) return;

            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                el.textContent = window.translations[lang]?.[key] || el.textContent;
            });
        }

        setupHeaderInteractions() {
            const themeToggle = document.getElementById('theme-toggle');
            const languageToggle = document.getElementById('language-toggle');
            const languageDropdown = document.getElementById('language-dropdown');
            const menuToggle = document.querySelector('.menu-toggle');
            const navLinks = document.querySelector('.nav-links');

            // Update theme icon on load
            if (themeToggle) {
                const themeIcon = themeToggle.querySelector('i');
                const currentTheme = document.body.getAttribute('data-theme');
                themeIcon.className = currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
                themeToggle.addEventListener('click', () => window.rentalUtils.toggleTheme.call(this));
            }

            // Language dropdown
            if (languageToggle && languageDropdown) {
                languageToggle.addEventListener('click', (e) => {
                    e.stopPropagation();
                    languageDropdown.classList.toggle('hidden');
                });
                document.addEventListener('click', () => languageDropdown.classList.add('hidden'));
                languageDropdown.addEventListener('click', (e) => e.stopPropagation()); // Prevent closing when clicking inside
            }

            // Mobile menu
            if (menuToggle && navLinks) {
                menuToggle.addEventListener('click', () => navLinks.classList.toggle('active'));
            }
        }
    }

    // Initialize the public page utilities
    new PublicPageUtils();
});