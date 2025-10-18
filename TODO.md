# TODO List for Rental Management System Updates

## Task 1: Fix input borders and modal button UI
- [ ] Define `--border-color` in `Css/styles.css`
- [ ] Ensure modal inputs have visible borders
- [ ] Improve cancel button styling (consistent padding, hover effects)

## Task 2: Move modals to respective pages
- [ ] Remove `createAndOpenModal` from `Js/shared.js`
- [ ] Add modal creation logic to `Js/units-details.js`
- [ ] Add modal-specific CSS to `Css/units-details.css`
- [ ] Add modal creation logic to `Js/tenants.js`
- [ ] Add modal-specific CSS to `Css/tenants.css`
- [ ] Add modal creation logic to `Js/leases.js`
- [ ] Add modal-specific CSS to `Css/leases.css`

## Task 3: Update tenants display to table
- [ ] Change `Html/tenants.html` from grid to table structure
- [ ] Update `Js/tenants.js` to render table with columns: Name, Contact, Property, Lease Period, Next Due Status, Action
- [ ] Fetch lease data for period and next due in tenants.js

## Task 4: Update leases table and add view details
- [ ] Update `Html/leases.html` table headers for new columns: Tenant Name, Property, Rent, Withholding, Period, Status, Action
- [ ] Modify `Js/leases.js` to use new columns (add withholding field, change period to lease period)
- [ ] Update action dropdown in leases.js to include viewdetails
- [ ] Create view details modal in `Js/leases.js` with images for withholding receipt, lease agreement, receipt, and receipt number
- [ ] Add view details modal styles to `Css/leases.css`
