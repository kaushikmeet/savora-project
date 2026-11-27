
import { Injectable, inject } from '@angular/core';

import { Api } from '../services/api';

import {
  Budget,
  CreateBudgetRequest,
  UpdateBudgetRequest,
  BudgetCategoryAllocation,
  CreateBudgetCategoryAllocationRequest,
  BudgetListResponse,
} from '../models/budget.model';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BudgetsService {
  private readonly api = inject(Api);

  // Household budgets
    getHouseholdBudgets(householdId: string) {
    return this.api
      .get<BudgetListResponse>(
        `/households/${householdId}/budgets`,
      )
      .pipe(
        map((response) => response.items ?? []),
      );
  }
//   getHouseholdBudgets(householdId: string) {
//   return this.api.get<Budget[] | { data: Budget[] } | { budgets: Budget[] }>(
//     `/households/${householdId}/budgets`,
//   ).pipe(
//     map((response) => {
//       if (Array.isArray(response)) {
//         return response;
//       }

//       if ('data' in response && Array.isArray(response.data)) {
//         return response.data;
//       }

//       if ('budgets' in response && Array.isArray(response.budgets)) {
//         return response.budgets;
//       }

//       return [];
//     }),
//   );
// }

  createBudget(householdId: string, payload: CreateBudgetRequest) {
  return this.api.post<Budget>(
    `/households/${householdId}/budgets`,
    payload,
  );
}

  // Single budget
  getBudget(budgetId: string) {
    return this.api.get<Budget>(
      `/budgets/${budgetId}`,
    );
  }

  updateBudget(
    budgetId: string,
    payload: UpdateBudgetRequest,
  ) {
    return this.api.patch<Budget>(
      `/budgets/${budgetId}`,
      payload,
    );
  }

  deleteBudget(budgetId: string) {
    return this.api.delete<{ message: string }>(
      `/budgets/${budgetId}`,
    );
  }

  // Budget categories
  getBudgetCategories(budgetId: string) {
  return this.api
    .get<
      BudgetCategoryAllocation[] |
      { items: BudgetCategoryAllocation[] } |
      { data: BudgetCategoryAllocation[] } |
      { allocations: BudgetCategoryAllocation[] }
    >(`/budgets/${budgetId}/categories`)
    .pipe(
      map((response) => {
        if (Array.isArray(response)) {
          return response;
        }

        if ('items' in response && Array.isArray(response.items)) {
          return response.items;
        }

        if ('data' in response && Array.isArray(response.data)) {
          return response.data;
        }

        if (
          'allocations' in response &&
          Array.isArray(response.allocations)
        ) {
          return response.allocations;
        }

        return [];
      }),
    );
}

  addBudgetCategory(
    budgetId: string,
    payload: CreateBudgetCategoryAllocationRequest,
  ) {
    return this.api.post<BudgetCategoryAllocation>(
      `/budgets/${budgetId}/categories`,
      payload,
    );
  }

  deleteBudgetCategory(
    budgetId: string,
    allocationId: string,
  ) {
    return this.api.delete<{ message: string }>(
      `/budgets/${budgetId}/categories/${allocationId}`,
    );
  }
}
