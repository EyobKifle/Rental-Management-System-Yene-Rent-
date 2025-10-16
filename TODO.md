# TODO: Fix Header and Sidebar Layout + Add Responsiveness

## Tasks
- [x] Fix header position when sidebar is collapsed on desktop by adding CSS rule `.sidebar-collapsed .header { left: 0; }` in Css/styles.css
- [x] Enhance mobile responsiveness: Ensure sidebar is hidden by default on screens <=1024px, header adjusts to left:0, main-content takes full width, and toggle functionality works with overlay
- [x] Add tablet-specific responsiveness if needed (e.g., refine for 768px-1024px), but leverage existing media query
- [x] Verify responsiveness applies to all pages by ensuring consistent layout structure (header, sidebar, main-content) across Html/*.html files
- [x] Test layout on different screen sizes (simulate mobile/tablet/desktop) after changes

## Notes
- Existing CSS in styles.css already has @media (max-width: 1024px) for hiding sidebar and adjusting header/main-content.
- No additional breakpoints added unless issues arise; current setup covers mobile/tablet.
- All pages should include header.html and sidebar.html for consistent application.
