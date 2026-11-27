import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ExpensesService } from '../../../core/services/expenses.service';
import { HouseholdService } from '../../../core/services/household.service';
import { HouseholdMember } from '../../../core/models/household.model';
import { CreateExpenseRequest, Expenses, ExpenseSummary, UpdateExpenseRequest } from '../../../core/models/expense.model';
import { BudgetsService } from '../../../core/services/budgets.service';
import { Budget } from '../../../core/models/budget.model';

@Component({
  selector: 'app-expense',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './expense.html',
  styleUrl: './expense.css',
})
export class Expense {
   private readonly fb = inject(FormBuilder);
  private readonly expensesService = inject(ExpensesService);
  private readonly householdService = inject(HouseholdService);
  private readonly budgetService = inject(BudgetsService);
  readonly households = signal<HouseholdMember[]>([]);
  readonly selectedHouseholdId = signal('');

  readonly expenses = signal<Expenses[]>([]);
  readonly summary = signal<ExpenseSummary | null>(null);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly deletingId = signal<string | null>(null);

  readonly showForm = signal(false);
  readonly editingExpenseId = signal<string | null>(null);
  readonly error = signal('');
  readonly success = signal('');
  readonly searchTerm = signal('');
  readonly dateFrom = signal('');
  readonly dateTo = signal('');

  readonly filteredExpenses = computed(() => {
  const term = this.searchTerm().trim().toLowerCase();
  const baseExpenses = this.dateFilterExpense();

  if (!term) {
    return baseExpenses;
  }

  return baseExpenses.filter((expense) => {
    const itemMatches = expense.items?.some((item) =>
      item.name?.toLowerCase().includes(term)
    );

    return (
      expense.notes?.toLowerCase().includes(term) ||
      expense.id.toLowerCase().includes(term) ||
      Boolean(itemMatches)
    );
  });
});

  readonly items = this.fb.array([this.createItemForm()]);

  readonly form = this.fb.group({
    purchasedAt: [this.getCurrentLocalDateTime(), Validators.required],
    notes: ['', Validators.maxLength(1000)],
    items: this.items,
  });

  readonly calculatedTotal = computed(() => {
    const values = this.items.getRawValue();

    return values.reduce((total, item) => {
      const quantity = Number(item.quantity || 0);
      const price = Number(item.actualUnitPrice || 0);

      return total + quantity * price;
    }, 0);
  });

  // date range filter
  readonly dateFilterExpense = computed(()=>{
    const expense = this.expenses();
    const from = this.dateFrom();
    const to = this.dateTo();

    return expense.filter((expense)=>{
      const date = expense.purchasedAt.slice(0,10);
      if(from && date < from) return false;
      if (to && date > to) return false;
      return true;
    });
  });

  readonly filteredTotal = computed(() =>
  this.filteredExpenses().reduce(
    (total, expense) => total + Number(expense.totalAmount || 0),
    0,
  ),
);

readonly filteredCount = computed(() => this.filteredExpenses().length);

// monthly expenand calculate
 readonly monthlySpending = computed(() => {
  const expenses = this.expenses();
  const result = new Map<string, number>();

  for (const expense of expenses) {
    const date = new Date(expense.purchasedAt);
    const key = `${date.getFullYear()}-${String(
      date.getMonth() + 1,
    ).padStart(2, '0')}`;

    result.set(
      key,
      (result.get(key) ?? 0) + Number(expense.totalAmount),
    );
  }

  const sorted = Array.from(result.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6);

  return sorted.map(([key, amount]) => {
    const [year, month] = key.split('-').map(Number);

    return {
      key,
      label: new Date(year, month - 1, 1).toLocaleDateString(
        'en-IN',
        { month: 'short', year: '2-digit' },
      ),
      amount,
    };
  });
});

readonly maxMonthlyAmount = computed(() =>
  Math.max(
    1,
    ...this.monthlySpending().map((month) => month.amount),
  ),
);

readonly budgets = signal<Budget[]>([]);

readonly budgetComparison = computed(() => {
  const budgets = this.budgets().filter((budget) => budget.isActive);
  const expenses = this.expenses();

  return budgets.map((budget) => {
    const budgetStart = budget.startDate?.slice(0, 10) ?? '';
    const budgetEnd = budget.endDate?.slice(0, 10) ?? '';

    // Skip date comparison if budget dates are missing
    const actual = budgetStart && budgetEnd
      ? expenses
          .filter((expense) => {
            const expenseDate = expense.purchasedAt.slice(0, 10);

            return (
              expense.householdId === budget.householdId &&
              expenseDate >= budgetStart &&
              expenseDate <= budgetEnd
            );
          })
          .reduce(
            (total, expense) => total + Number(expense.totalAmount || 0),
            0,
          )
      : 0;

    const budgetAmount = Number(budget.amount || 0);
    const remaining = budgetAmount - actual;

    return {
      id: budget.id,
      name: budget.name,
      amount: budgetAmount,
      actual,
      remaining,
      percentage:
        budgetAmount > 0
          ? Math.min((actual / budgetAmount) * 100, 100)
          : 0,
      overBudget: actual > budgetAmount,
    };
  });
});

  constructor() {
    this.loadHouseholds();
  }
  private createItemForm() {
    return this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      quantity: [1, [Validators.required, Validators.min(0.001)]],
      unit: ['', Validators.maxLength(50)],
      actualUnitPrice: [
        0,
        [Validators.required, Validators.min(0.01)],
      ],
    });
  }

  getCurrentLocalDateTime(): string {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;

    return new Date(now.getTime() - offset)
      .toISOString()
      .slice(0, 16);
  }

  loadHouseholds(): void {
    this.householdService.getHouseholds().subscribe({
      next: (members: HouseholdMember[]) => {
        const active = members.filter(
          (member) =>
            member.status === 'ACTIVE' && !!member.household,
        );

        this.households.set(active);

        if (active.length > 0) {
          this.selectHousehold(active[0].householdId);
        }
      },
      error: (err) => {
        console.error('Failed to load households:', err);
        this.error.set('Unable to load households.');
      },
    });
  }

 selectHousehold(householdId: string): void {
    this.selectedHouseholdId.set(householdId);

    if (householdId) {
      this.loadExpenses();
      this.loadSummary();
      this.loadBudgets(householdId)
    } else {
      this.expenses.set([]);
      this.summary.set(null);
      this.budgets.set([]);
    }
  }
  
  loadExpenses(): void {
    const householdId = this.selectedHouseholdId();
    if(!householdId) return;
    this.loading.set(true);
    this.expensesService.getExpenses(householdId).subscribe({
      next:(res)=>{
         this.expenses.set(Array.isArray(res) ? res : []);
         this.loading.set(false);
      },
      error:(err)=>{
         console.error('Failed to load expenses:', err);
         this.expenses.set([]);
         this.loading.set(false);
         this.error.set(
          err?.error?.message || 'Unable to load expenses.'
         );
      },
    });
  }

  loadSummary():void{
    const household = this.selectedHouseholdId();
    if(household){return;}
    this.expensesService.getExpenseSummary(household).subscribe({
      next:(res)=>{
        this.summary.set(res);
      },
      error:(err)=>{
        console.error('Failed to load expense summary:', err);
      },
    });
  }
  addItem(): void {
    this.items.push(this.createItemForm());
  }

  removeItem(index: number):void{
      if(this.items.length >1){
        this.items.removeAt(index);
      }
  }

   openCreateForm(): void {
    this.editingExpenseId.set(null);
    this.items.clear();
    this.items.push(this.createItemForm());

    this.form.reset({
      purchasedAt: this.getCurrentLocalDateTime(),
      notes:'',
    });

    this.showForm.set(true);
    this.error.set('');
    this.success.set('');
   }

   openEditForm(expense: Expenses): void {
    this.editingExpenseId.set(expense.id);
    this.items.clear();

    this.form.patchValue({
      purchasedAt: expense.purchasedAt.slice(0, 16),
      notes: expense.notes ?? '',
    });
     this.showForm.set(true);
     this.error.set('');
     this.success.set('');
   }

   closeForm(): void {
    this.showForm.set(false);
    this.editingExpenseId.set(null);
    this.error.set('');
   }

  // callpost and update api
 
saveExpense(): void {
  if (this.form.invalid || this.saving()) {
    this.form.markAllAsTouched();
    return;
  }

  const householdId = this.selectedHouseholdId();

  if (!householdId) {
    this.error.set('Please select a household.');
    return;
  }

  const value = this.form.getRawValue();

  if (!value.purchasedAt) {
    this.error.set('Please select the purchase date.');
    return;
  }

  this.saving.set(true);
  this.error.set('');
  this.success.set('');

  const editingId = this.editingExpenseId();

  // UPDATE EXISTING EXPENSE
  if (editingId) {
    const payload: UpdateExpenseRequest = {
      purchasedAt: new Date(value.purchasedAt).toISOString(),
      notes: value.notes?.trim() || undefined,
    };

    this.expensesService.updateExpense(editingId, payload).subscribe({
      next: (updatedExpense) => {
        this.saving.set(false);

        this.expenses.update((current) =>
          current.map((expense) =>
            expense.id === editingId
              ? { ...expense, ...updatedExpense }
              : expense,
          ),
        );

        this.closeForm();
        this.success.set('Expense updated successfully.');

        // Refresh summary from backend.
        this.loadSummary();
      },
      error: (err) => this.handleSaveError(err),
    });

    return;
  }

  // CREATE NEW EXPENSE
  const expenseItems = (value.items ?? []).map((item) => ({
    name: item.name?.trim() ?? '',
    quantity: Number(item.quantity),
    unit: item.unit?.trim() || undefined,
    actualUnitPrice: Number(item.actualUnitPrice),
  }));

  if (
    expenseItems.some(
      (item) =>
        !item.name ||
        !Number.isFinite(item.quantity) ||
        item.quantity <= 0 ||
        !Number.isFinite(item.actualUnitPrice) ||
        item.actualUnitPrice <= 0,
    )
  ) {
    this.saving.set(false);
    this.error.set('Please enter valid item details and prices.');
    return;
  }

  const payload: CreateExpenseRequest = {
    householdId,
    purchasedAt: new Date(value.purchasedAt).toISOString(),
    currencyCode: 'INR',
    notes: value.notes?.trim() || undefined,
    items: expenseItems,
  };

  this.expensesService.createExpense(payload).subscribe({
    next: (createdExpense) => {
      this.saving.set(false);

      // Add newly created expense to the existing list.
      this.expenses.update((current) => [
        createdExpense,
        ...current,
      ]);

      // Update summary immediately.
      this.summary.update((current) => ({
        expenseCount: (current?.expenseCount ?? 0) + 1,
        totalSpent: (
          Number(current?.totalSpent ?? 0) +
          Number(createdExpense.totalAmount)
        ).toFixed(2),
        currencyCode: createdExpense.currencyCode,
      }));

      this.closeForm();
      this.success.set('Expense recorded successfully.');
    },
    error: (err) => this.handleSaveError(err),
  });
}


   private handleSaveError(err: any): void {
    this.saving.set(false);

    this.error.set(
      Array.isArray(err?.error?.message)
        ? err.error.message.join(', ')
        : err?.error?.message || 'Unable to save expense.',
    );
  }

  // call delete api
  deleteExpense(expense: Expenses): void {
    if (
      this.deletingId() ||
      !confirm('Are you sure you want to delete this expense?')
    ) {
      return;
    }

    this.deletingId.set(expense.id);
    this.error.set('');

    this.expensesService.deleteExpense(expense.id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.success.set('Expense deleted successfully.');
        this.refreshData();
      },
      error: (err) => {
        this.deletingId.set(null);
        this.error.set(
          err?.error?.message || 'Unable to delete expense.',
        );
      },
    });
  }

  private refreshData(): void {
    this.loadExpenses();
    this.loadSummary();
  }

  setSearch(value: string): void {
    this.searchTerm.set(value);
  }

  formatAmount(value: string | number): string {
    return Number(value || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  setDateFrom(value: string): void {
    this.dateFrom.set(value);
  }

  setDateTo(value: string): void {
   this.dateTo.set(value);
  }

  clearDateFilters(): void {
    this.dateFrom.set('');
    this.dateTo.set('');
  }

  loadBudgets(householdId: string): void {
  this.budgetService.getHouseholdBudgets(householdId).subscribe({
    next: (budgets: Budget[]) => {
      this.budgets.set(budgets);
    },
    error: (err) => {
      console.error('Failed to load budgets:', err);
      this.budgets.set([]);
    },
  });
}
}
