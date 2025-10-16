document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const sidebarContainer = document.getElementById('sidebar-container');
    const addExpenseBtn = document.getElementById('add-expense-btn');
    const expenseModalContainer = document.getElementById('expense-modal');
    const expensesTableBody = document.getElementById('expenses-table-body');
    const emptyState = document.getElementById('empty-state');
    const searchInput = document.getElementById('search-input');

    // Storage Keys
    const EXPENSE_KEY = 'expenses';
    const PROPERTY_KEY = 'properties';

    // Data
    let expenses = [];
    let properties = [];

    const initialize = async () => {
        // Wait for shared components like the sidebar to be ready
        await window.rentalUtils.sidebarPromise;
        [expenses, properties] = await Promise.all([
            api.get(EXPENSE_KEY),
            api.get(PROPERTY_KEY)
        ]);
        renderExpenses();
    };

    const renderExpenses = (filter = '') => {
        expensesTableBody.innerHTML = '';
        
        const filteredExpenses = expenses.filter(expense => 
            expense.category.toLowerCase().includes(filter.toLowerCase()) ||
            (expense.description && expense.description.toLowerCase().includes(filter.toLowerCase()))
        );

        if (filteredExpenses.length === 0) {
            emptyState.classList.remove('hidden');
            expensesTableBody.parentElement.classList.add('hidden');
        } else {
            emptyState.classList.add('hidden');
            expensesTableBody.parentElement.classList.remove('hidden');
            filteredExpenses.forEach(expense => {
                const property = properties.find(p => p.id === expense.propertyId);
                const row = document.createElement('tr');
                row.className = 'hover:bg-gray-50';
                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${expense.category}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${rentalUtils.formatCurrency(expense.amount)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${rentalUtils.formatDate(expense.date)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${property?.name || 'General'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs">${expense.description || ''}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium relative">
                        <div class="relative inline-block text-left">
                            <button type="button" class="action-dropdown-btn text-gray-400 hover:text-gray-700" data-id="${expense.id}">
                                <i data-lucide="more-horizontal" class="w-5 h-5"></i>
                            </button>
                            <div id="dropdown-${expense.id}" class="dropdown-menu hidden">
                                <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 edit-btn" data-id="${expense.id}">Edit</a>
                                <a href="#" class="block px-4 py-2 text-sm text-red-600 hover:bg-red-50 delete-btn" data-id="${expense.id}">Delete</a>
                            </div>
                        </div>
                    </td>
                `;
                expensesTableBody.appendChild(row);
            });
            rentalUtils.setupLucideIcons();
        }
    };

    const openExpenseModal = async (expense = null) => {
        const response = await fetch('modal.html');
        expenseModalContainer.innerHTML = await response.text();
        const modal = expenseModalContainer.querySelector('.modal-overlay');
        modal.querySelector('#modal-title').textContent = expense ? 'Edit Expense' : 'Add Expense';

        const propertyOptions = properties.map(p => `<option value="${p.id}" ${expense && expense.propertyId === p.id ? 'selected' : ''}>${p.name}</option>`).join('');
        const categories = ['Maintenance', 'Utilities', 'Taxes', 'Insurance', 'Other'];
        const categoryOptions = categories.map(c => `<option value="${c}" ${expense && expense.category === c ? 'selected' : ''}>${c}</option>`).join('');

        modal.querySelector('#modal-content').innerHTML = `
            <form id="expense-form" class="space-y-4">
                <input type="hidden" id="expense-id" value="${expense ? expense.id : ''}">
                <div class="grid grid-cols-2 gap-4">
                    <div class="form-group">
                        <label for="expense-category" class="form-label">Category</label>
                        <select id="expense-category" class="form-input" required>${categoryOptions}</select>
                    </div>
                    <div class="form-group">
                        <label for="expense-amount" class="form-label">Amount (ETB)</label>
                        <input type="number" id="expense-amount" class="form-input" value="${expense ? expense.amount : ''}" required>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
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
                <div class="form-group">
                    <label for="expense-description" class="form-label">Description (Optional)</label>
                    <textarea id="expense-description" class="form-input" rows="3">${expense ? expense.description : ''}</textarea>
                </div>
                <div class="flex justify-end space-x-3 pt-4">
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
            description: form.querySelector('#expense-description').value,
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

    expensesTableBody.addEventListener('click', (e) => {
        const id = e.target.closest('[data-id]')?.dataset.id;
        if (!id) return;

        if (e.target.closest('.edit-btn')) {
            e.preventDefault();
            const expenseToEdit = expenses.find(ex => ex.id === id);
            openExpenseModal(expenseToEdit);
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