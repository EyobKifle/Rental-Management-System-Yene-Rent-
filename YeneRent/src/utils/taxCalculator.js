/**
 * taxCalculator.js
 * A module for calculating estimated taxes based on Ethiopian tax regulations.
 * Note: This provides an estimation for informational purposes and is not a substitute for professional tax advice.
 *
 * This is the consolidated and corrected version.
 */
class TaxCalculator {
    constructor(settings) {
        // Default settings can be overridden by user-configured values
        this.settings = {
            vatRate: 0.15, // 15%
            withholdingTaxRate: 0.15, // 15% for building rent
            businessIncomeTaxRate: 0.30, // 30% flat rate for estimation
            expenseVatDeductibleRate: 1.0, // 100% of VAT on expenses is deductible
            ...settings,
        };
    }

    /**
     * Calculates all relevant taxes based on financial data.
     * @param {object} data - Contains totalRevenue, totalExpenses, and payments grouped by property.
     * @returns {object} An object with a detailed breakdown of calculated taxes.
     */
    calculateAllTaxes(data) {
        const { totalRevenue, totalExpenses, paymentsByProperty, expenses } = data;

        // 1. Calculate VAT Payable
        const totalVatOnRevenue = totalRevenue * this.settings.vatRate;
        // Assuming expenses have a 'vat' field or we estimate it
        const totalVatOnExpenses = expenses.reduce((sum, expense) => {
            // Only consider expenses where VAT is applicable and deductible
            if (expense.category !== 'Salaries' && expense.category !== 'Tax') {
                return sum + (expense.amount * this.settings.vatRate);
            }
            return sum;
        }, 0);
        const deductibleVat = totalVatOnExpenses * this.settings.expenseVatDeductibleRate;
        const vatPayable = totalVatOnRevenue - deductibleVat;

        // 2. Calculate Withholding Tax
        // This is based on properties marked for withholding tax.
        let withholdingTax = 0;
        for (const propId in paymentsByProperty) {
            const prop = paymentsByProperty[propId];
            if (prop.taxType && (prop.taxType.includes('withholding') || prop.taxType.includes('all-taxes'))) {
                withholdingTax += prop.totalIncome * this.settings.withholdingTaxRate;
            }
        }

        // 3. Calculate Business Income Tax (Schedule 'C' Estimation)
        // Net profit for tax purposes might exclude certain non-deductible expenses.
        // For this estimation, we'll use (Total Revenue - Total Expenses).
        const taxableProfit = totalRevenue - totalExpenses;
        const businessIncomeTax = taxableProfit > 0 ? taxableProfit * this.settings.businessIncomeTaxRate : 0;

        // 4. Aggregate results
        const totalTaxLiability = vatPayable + businessIncomeTax; // Withholding is often paid by the client, but we show it for tracking.

        return {
            vat: {
                vatOnRevenue: totalVatOnRevenue,
                deductibleVatOnExpenses: deductibleVat,
                payable: Math.max(0, vatPayable), // VAT payable cannot be negative
            },
            withholdingTax: {
                total: withholdingTax,
            },
            businessIncomeTax: {
                taxableProfit: taxableProfit,
                payable: Math.max(0, businessIncomeTax),
            },
            totalTaxLiability: Math.max(0, totalTaxLiability),
        };
    }

    /**
     * A placeholder for a more complex progressive tax calculation (Ethiopian Schedule C).
     * @param {number} annualProfit - The total annual profit.
     * @returns {number} The calculated income tax.
     */
    _calculateProgressiveIncomeTax(annualProfit) {
        // This is a simplified version of the annual business profit tax schedule.
        if (annualProfit <= 7200) return 0;
        if (annualProfit <= 19800) return (annualProfit * 0.10) - 720;
        if (annualProfit <= 38400) return (annualProfit * 0.15) - 1710;
        if (annualProfit <= 63000) return (annualProfit * 0.20) - 3630;
        if (annualProfit <= 93600) return (annualProfit * 0.25) - 6780;
        if (annualProfit <= 130800) return (annualProfit * 0.30) - 11460;
        return (annualProfit * 0.35) - 18000;
    }
}

export default TaxCalculator;
