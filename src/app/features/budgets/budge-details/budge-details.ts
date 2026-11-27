
import {
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  Budget,
  BudgetCategoryAllocation,
  CreateBudgetCategoryAllocationRequest,
} from '../../../core/models/budget.model';
import { BudgetsService } from '../../../core/services/budgets.service';



@Component({
  selector: 'app-budget-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './budge-details.html',
})
export class BudgetDetails {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly budgetsService = inject(BudgetsService);

  readonly budget = signal<Budget | null>(null);
  readonly allocations = signal<BudgetCategoryAllocation[]>([]);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly deletingId = signal<string | null>(null);

  readonly error = signal('');
  readonly success = signal('');

  readonly budgetId = this.route.snapshot.paramMap.get('id');

  readonly totalAllocated = computed(() =>
    this.allocations().reduce(
      (total, allocation) =>
        total + Number(allocation.allocatedAmount || 0),
      0,
    ),
  );

  readonly budgetAmount = computed(() =>
    Number(this.budget()?.amount || 0),
  );

  readonly remainingBudget = computed(() =>
    this.budgetAmount() - this.totalAllocated(),
  );

  readonly allocationPercentage = computed(() => {
    const amount = this.budgetAmount();

    if (amount <= 0) {
      return 0;
    }

    return Math.min(
      100,
      (this.totalAllocated() / amount) * 100,
    );
  });

  readonly allocationForm = this.fb.group({
    categoryId: ['', [Validators.required]],
    allocatedAmount: [
      null as number | null,
      [Validators.required, Validators.min(0.01)],
    ],
  });

  constructor() {
    if (!this.budgetId) {
      this.error.set('Budget ID is missing.');
      this.loading.set(false);
      return;
    }

    this.loadBudget();
  }

  loadBudget(): void {
    if (!this.budgetId) {
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.budgetsService
      .getBudget(this.budgetId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (budget) => {
          this.budget.set(budget);
          this.loadAllocations();
        },
        error: (err) => {
          console.error('Failed to load budget:', err);
          this.error.set(
            err?.error?.message || 'Unable to load budget details.',
          );
          this.loading.set(false);
        },
      });
  }

  loadAllocations(): void {
  if (!this.budgetId) {
    this.loading.set(false);
    return;
  }

  this.budgetsService
    .getBudgetCategories(this.budgetId)
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (allocations: BudgetCategoryAllocation[]) => {
        this.allocations.set(
          Array.isArray(allocations) ? allocations : [],
        );

        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load category allocations:', err);

        this.allocations.set([]);
        this.loading.set(false);

        this.error.set(
          err?.error?.message ||
            'Unable to load budget category allocations.',
        );
      },
    });
}

  addAllocation(): void {
    if (this.allocationForm.invalid || this.saving()) {
      this.allocationForm.markAllAsTouched();
      return;
    }

    if (!this.budgetId) {
      this.error.set('Budget ID is missing.');
      return;
    }

    const formValue = this.allocationForm.getRawValue();

    const payload: CreateBudgetCategoryAllocationRequest = {
      categoryId: formValue.categoryId!.trim(),
      allocatedAmount: Number(formValue.allocatedAmount),
    };

    if (!Number.isFinite(payload.allocatedAmount) ||
        payload.allocatedAmount <= 0) {
      this.error.set('Allocated amount must be greater than zero.');
      return;
    }

    if (payload.allocatedAmount > this.remainingBudget()) {
      this.error.set(
        'Allocation cannot exceed the remaining budget.',
      );
      return;
    }

    this.saving.set(true);
    this.error.set('');
    this.success.set('');

    this.budgetsService
      .addBudgetCategory(this.budgetId, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (allocation) => {
          this.allocations.update((current) => [
            ...current,
            allocation,
          ]);

          this.allocationForm.reset({
            categoryId: '',
            allocatedAmount: null,
          });

          this.saving.set(false);
          this.success.set('Category allocation added successfully.');
        },
        error: (err) => {
          this.saving.set(false);

          this.error.set(
            Array.isArray(err?.error?.message)
              ? err.error.message.join(', ')
              : err?.error?.message ||
                  'Unable to add category allocation.',
          );
        },
      });
  }

  deleteAllocation(allocation: BudgetCategoryAllocation): void {
    if (!this.budgetId || this.deletingId()) {
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to remove this category allocation?',
    );

    if (!confirmed) {
      return;
    }

    this.deletingId.set(allocation.id);
    this.error.set('');
    this.success.set('');

    this.budgetsService
      .deleteBudgetCategory(this.budgetId, allocation.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.allocations.update((current) =>
            current.filter((item) => item.id !== allocation.id),
          );

          this.deletingId.set(null);
          this.success.set('Category allocation removed successfully.');
        },
        error: (err) => {
          this.deletingId.set(null);

          this.error.set(
            err?.error?.message ||
              'Unable to remove category allocation.',
          );
        },
      });
  }

  goToBudgets(): void {
    this.router.navigate(['/budgets']);
  }

  formatCurrency(value: number | string | null | undefined): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: this.budget()?.currencyCode || 'INR',
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  }

  getPeriodLabel(period: string): string {
    switch (period) {
      case 'WEEKLY':
        return 'Weekly';
      case 'MONTHLY':
        return 'Monthly';
      case 'CUSTOM':
        return 'Custom';
      default:
        return period;
    }
  }

  getCategoryName(allocation: BudgetCategoryAllocation): string {
    return allocation.category?.name || allocation.categoryId;
  }
}
