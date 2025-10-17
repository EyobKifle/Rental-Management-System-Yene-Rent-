document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const addExpenseBtn = document.getElementById('add-expense-btn');
    const expenseModalContainer = document.getElementById('expense-modal');
    const expenseList = document.getElementById('expense-list');
    const emptyState = document.getElementById('empty-state');
    const searchInput = document.getElementById('search-input');

    // Storage Keys
    const EXPENSE_KEY = 'expenses';
    const PROPERTY_KEY = 'properties';

    // Data
    let expenses = [];
    let properties = [];

    const initialize = async () => {
        await window.rentalUtils.headerPromise; // Ensures shared components are loaded
        [expenses, properties] = await Promise.all([
            api.get(EXPENSE_KEY),
            api.get(PROPERTY_KEY)
        ]);
        renderExpenses();
    };

    const renderExpenses = (filter = '') => {
        expenseList.innerHTML = '';
        
        const filteredExpenses = expenses.filter(expense => {
            const property = properties.find(p => p.id === expense.propertyId);
            const searchLower = filter.toLowerCase();
            return expense.category.toLowerCase().includes(searchLower) ||
                   (property && property.name.toLowerCase().includes(searchLower));
        });

        if (filteredExpenses.length === 0) {
            emptyState.classList.remove('hidden');
            expenseList.parentElement.classList.add('hidden');
        } else {
            emptyState.classList.add('hidden');
            expenseList.parentElement.classList.remove('hidden');
            filteredExpenses.forEach(expense => {
                const property = properties.find(p => p.id === expense.propertyId);
                const card = document.createElement('div');
                card.className = 'expense-card';
                card.innerHTML = `
                    <div class="expense-card-header">
                        <div>
                            <h3>${expense.category}</h3>
                            <span class="amount">${rentalUtils.formatCurrency(expense.amount)}</span>
                        </div>
                        <div class="action-dropdown">
                            <button type="button" class="action-dropdown-btn" data-id="${expense.id}"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                            <div id="dropdown-${expense.id}" class="dropdown-menu hidden">
                                <a href="#" class="dropdown-item edit-btn" data-id="${expense.id}"><i class="fa-solid fa-pencil"></i>Edit</a>
                                <a href="#" class="dropdown-item delete-btn" data-id="${expense.id}"><i class="fa-solid fa-trash-can"></i>Delete</a>
                            </div>
                        </div>
                    </div>
                    <div class="expense-card-details">
                        <div><span>Date</span><span>${rentalUtils.formatDate(expense.date)}</span></div>
                        <div><span>Property</span><span>${property?.name || 'General'}</span></div>
                    </div>
                `;
                expenseList.appendChild(card);
            });
        }
    };

    const openExpenseModal = async (expense = null) => {
        const response = await fetch('modal.html');
        expenseModalContainer.innerHTML = await response.text();
        const modal = expenseModalContainer.querySelector('.modal-overlay');
        modal.querySelector('#modal-title').textContent = expense ? 'Edit Expense' : 'Add New Expense';

        const propertyOptions = properties.map(p => `<option value="${p.id}" ${expense && expense.propertyId === p.id ? 'selected' : ''}>${p.name}</option>`).join('');
        const categories = ['Maintenance', 'Utilities', 'Taxes', 'Insurance', 'Management Fees', 'Other'];
        const categoryOptions = categories.map(c => `<option value="${c}" ${expense && expense.category === c ? 'selected' : ''}>${c}</option>`).join('');

        modal.querySelector('#modal-body').innerHTML = `
            <form id="expense-form">
                <input type="hidden" id="expense-id" value="${expense ? expense.id : ''}">
                <div class="form-row">
                    <div class="form-group">
                        <label for="expense-category" class="form-label">Category</label>
                        <select id="expense-category" class="form-input" required>${categoryOptions}</select>
                    </div>
                    <div class="form-group">
                        <label for="expense-amount" class="form-label">Amount (ETB)</label>
                        <input type="number" id="expense-amount" class="form-input" value="${expense ? expense.amount : ''}" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="expense-date" class="form-label">Date</label>
                        <input type="date" id="expense-date" class="form-input" value="${expense ? expense.date : ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="expense-property" class="form-label">Property (Optional)</label>
                        <select id="expense-property" class="form-input">
                            <option value="">General / Unassigned</option>
                            ${propertyOptions}
                        </select>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="close-modal-btn btn-secondary">Cancel</button>
                    <button type="submit" class="btn-primary">Save Expense</button>
                </div>
            </form>
        `;
        rentalUtils.openModal(modal);
        modal.querySelector('#expense-form').addEventListener('submit', handleFormSubmit);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const form = e.target;
        if (!rentalUtils.validateForm(form)) return;

        const id = form.querySelector('#expense-id').value;
        const expenseData = {
            id: id || rentalUtils.generateId(),
            category: form.querySelector('#expense-category').value,
            amount: parseFloat(form.querySelector('#expense-amount').value),
            date: form.querySelector('#expense-date').value,
            propertyId: form.querySelector('#expense-property').value,
        };

        if (id) {
            await api.update(EXPENSE_KEY, id, expenseData);
            expenses = expenses.map(ex => ex.id === id ? expenseData : ex);
        } else {
            await api.create(EXPENSE_KEY, expenseData);
            expenses.push(expenseData);
        }

        renderExpenses();
        rentalUtils.closeModal(form.closest('.modal-overlay'));
        rentalUtils.showNotification(`Expense ${id ? 'updated' : 'added'} successfully!`);
    };

    expenseList.addEventListener('click', (e) => {
        const id = e.target.closest('[data-id]')?.dataset.id;
        if (!id) return;

        if (e.target.closest('.edit-btn')) {
            e.preventDefault();
            const expenseToEdit = expenses.find(ex => ex.id === id);
            openExpenseModal(expenseToEdit);
        } else if (e.target.closest('.action-dropdown-btn')) {
            // Close all other dropdowns first
            document.querySelectorAll('.dropdown-menu').forEach(menu => menu.classList.add('hidden'));
            document.getElementById(`dropdown-${id}`).classList.toggle('hidden');
        } else if (e.target.closest('.delete-btn')) {
            e.preventDefault();
            if (rentalUtils.confirm('Are you sure you want to delete this expense?')) {
                api.delete(EXPENSE_KEY, id).then(() => {
                    expenses = expenses.filter(ex => ex.id !== id);
                    renderExpenses();
                    rentalUtils.showNotification('Expense deleted successfully!', 'error');
                });
            }
        }
    });

    addExpenseBtn.addEventListener('click', () => openExpenseModal());
    searchInput.addEventListener('input', rentalUtils.debounce(e => renderExpenses(e.target.value), 300));

    initialize();
});