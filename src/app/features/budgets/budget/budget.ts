
import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { HouseholdService } from '../../../core/services/household.service';
import { Household } from '../../../core/models/household.model';
import { BudgetsService } from '../../../core/services/budgets.service';
import { Budget, BudgetPeriod, CreateBudgetRequest } from '../../../core/models/budget.model';

@Component({
  selector: 'app-budgets',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './budget.html',
})
export class Budgets implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly budgetsService = inject(BudgetsService);
  private readonly householdService = inject(HouseholdService);

  readonly households = signal<Household[]>([]);
  readonly budgets = signal<Budget[]>([]);

  readonly loadingHouseholds = signal(false);
  readonly loadingBudgets = signal(false);
  readonly saving = signal(false);

  readonly error = signal('');
  readonly success = signal('');

  readonly editingId = signal<string | null>(null);
  readonly showForm = signal(false);

  readonly selectedHouseholdId = signal('');

  readonly activeBudgets = computed(() =>
    this.budgets().filter((budget) => budget.isActive !== false),
  );

  readonly inactiveBudgets = computed(() =>
    this.budgets().filter((budget) => budget.isActive === false),
  );

  readonly totalBudget = computed(() =>
    this.budgets().reduce(
      (total, budget) => total + Number(budget.amount || 0),
      0,
    ),
  );

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    amount: [
      null as number | null,
      [
        Validators.required,
        Validators.min(0.01),
        Validators.max(999999999999),
      ],
    ],
    currencyCode: ['INR', [Validators.required, Validators.maxLength(3)]],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    description: ['', Validators.maxLength(500)],
    period: ['MONTHLY', Validators.required],
    isActive: [true],
  });

  ngOnInit(): void {
    this.loadHouseholds();
  }

  loadHouseholds(): void {
    this.loadingHouseholds.set(true);
    this.error.set('');

    this.householdService.getHouseholds().subscribe({
      next: (members) => {
        const activeHouseholds = members
          .filter(
            (member) =>
              member.status === 'ACTIVE' && !!member.household,
          )
          .map((member) => member.household);

        // Remove duplicate household records if multiple memberships
        // or unexpected duplicate API data are returned.
        const uniqueHouseholds = Array.from(
          new Map(
            activeHouseholds.map((household) => [
              household.id,
              household,
            ]),
          ).values(),
        );

        this.households.set(uniqueHouseholds);
        this.loadingHouseholds.set(false);

        if (uniqueHouseholds.length) {
          const selectedId = this.selectedHouseholdId();

          if (
            !selectedId ||
            !uniqueHouseholds.some((h) => h.id === selectedId)
          ) {
            this.selectedHouseholdId.set(uniqueHouseholds[0].id);
          }

          this.loadBudgets(this.selectedHouseholdId());
        }
      },
      error: () => {
        this.error.set('Unable to load your households.');
        this.loadingHouseholds.set(false);
      },
    });
  }

  onHouseholdChange(householdId: string): void {
    this.selectedHouseholdId.set(householdId);
    this.budgets.set([]);
    this.cancelEdit();
    this.showForm.set(false);
    this.success.set('');
    this.error.set('');

    if (householdId) {
      this.loadBudgets(this.selectedHouseholdId());
    }
  }

 loadBudgets(householdId: string): void {
  this.loadingBudgets.set(true);

  this.budgetsService.getHouseholdBudgets(householdId).subscribe({
    next: (budgets: Budget[]) => {
      this.budgets.set(budgets);
      this.loadingBudgets.set(false);
    },
    error: (error) => {
      console.error('Failed to load budgets:', error);
      this.budgets.set([]);
      this.loadingBudgets.set(false);
    },
  });
}

  openCreateForm(): void {
    if (!this.selectedHouseholdId()) {
      this.error.set('Please select a household first.');
      return;
    }

    this.cancelEdit();
    this.showForm.set(true);
    this.success.set('');
    this.error.set('');

    this.form.reset({
      name: '',
      amount: null,
      currencyCode: 'INR',
      startDate: this.getFirstDayOfCurrentMonth(),
      endDate: this.getLastDayOfCurrentMonth(),
      description: '',
      isActive: true,
    });
  }

  editBudget(budget: Budget): void {
    this.editingId.set(budget.id);
    this.showForm.set(true);
    this.error.set('');
    this.success.set('');

    this.form.reset({
      name: budget.name,
      amount: Number(budget.amount),
      currencyCode: budget.currencyCode || 'INR',
      startDate: budget.startDate
        ? budget.startDate.substring(0, 10)
        : '',
      endDate: budget.endDate
        ? budget.endDate.substring(0, 10)
        : '',
      description: budget.description ?? '',
      isActive: budget.isActive !== false,
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.showForm.set(false);

    this.form.reset({
      name: '',
      amount: null,
      currencyCode: 'INR',
      startDate: '',
      endDate: '',
      description: '',
      isActive: true,
    });
  }

  save(): void {
  if (this.form.invalid || this.saving()) {
    this.form.markAllAsTouched();
    return;
  }

  const householdId = this.selectedHouseholdId();

  if (!householdId) {
    this.error.set('Please select a household.');
    return;
  }

  const formValue = this.form.getRawValue();

  const payload: CreateBudgetRequest = {
    name: String(formValue.name?.trim()),
    amount: Number(formValue.amount),
    currencyCode: String(formValue.currencyCode),
    period: (formValue.period || 'MONTHLY') as BudgetPeriod,
    startDate: formValue.startDate || undefined,
    endDate: formValue.endDate || undefined,
    description: formValue.description?.trim() || undefined,
  };

  // Validate budget amount
  if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
    this.error.set('Budget amount must be greater than zero.');
    return;
  }

  // Validate date range when both dates are provided
  if (
    payload.startDate &&
    payload.endDate &&
    payload.endDate < payload.startDate
  ) {
    this.error.set('End date must be after start date.');
    return;
  }

  this.saving.set(true);
  this.error.set('');
  this.success.set('');

  const budgetId = this.editingId();

  const request$ = budgetId
    ? this.budgetsService.updateBudget(budgetId, payload)
    : this.budgetsService.createBudget(householdId, payload);

  request$.subscribe({
    next: () => {
      this.saving.set(false);
      this.cancelEdit();

      this.success.set(
        budgetId
          ? 'Budget updated successfully.'
          : 'Budget created successfully.',
      );

      this.loadBudgets(householdId);
    },
    error: (err) => {
      this.saving.set(false);

      this.error.set(
        Array.isArray(err?.error?.message)
          ? err.error.message.join(', ')
          : err?.error?.message || 'Unable to save budget.',
      );
    },
  });
}

  deleteBudget(budget: Budget): void {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${budget.name}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    this.error.set('');
    this.success.set('');

    this.budgetsService.deleteBudget(budget.id).subscribe({
      next: () => {
        if (this.editingId() === budget.id) {
          this.cancelEdit();
        }

        this.success.set('Budget deleted successfully.');
        this.loadBudgets(this.selectedHouseholdId());
      },
      error: (err) => {
        this.error.set(
          err?.error?.message || 'Unable to delete budget.',
        );
      },
    });
  }

  getHouseholdName(householdId: string): string {
    return (
      this.households().find((h) => h.id === householdId)?.name ??
      'Household'
    );
  }

  formatCurrency(
    amount: number | string,
    currencyCode = 'INR',
  ): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currencyCode || 'INR',
      maximumFractionDigits: 2,
    }).format(Number(amount || 0));
  }

  getBudgetDuration(budget: Budget): string {
    if (!budget.startDate || !budget.endDate) {
      return 'Date range not specified';
    }

    const start = new Date(`${budget.startDate.substring(0, 10)}T00:00:00`);
    const end = new Date(`${budget.endDate.substring(0, 10)}T00:00:00`);

    const formatter = new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    return `${formatter.format(start)} – ${formatter.format(end)}`;
  }

  private getFirstDayOfCurrentMonth(): string {
    const date = new Date();
    date.setDate(1);
    return this.formatDate(date);
  }

  private getLastDayOfCurrentMonth(): string {
    const date = new Date();
    date.setMonth(date.getMonth() + 1, 0);
    return this.formatDate(date);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
