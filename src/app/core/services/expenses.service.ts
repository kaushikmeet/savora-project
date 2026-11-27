
import { Injectable, inject } from '@angular/core';
import { Api } from '../services/api';

import {
  CreateExpenseRequest,
  Expenses,
  ExpenseSummary,
  UpdateExpenseRequest,
} from '../models/expense.model';

@Injectable({
  providedIn: 'root',
})
export class ExpensesService {
  private readonly api = inject(Api);
  private readonly endpoint = '/expenses';

  getExpenses(householdId: string) {
    return this.api.get<Expenses[]>(
      `${this.endpoint}?householdId=${encodeURIComponent(householdId)}`,
    );
  }

  // getExpense(id: string) {
  //   return this.api.get<Expenses>(`${this.endpoint}/${id}`);
  // }

  createExpense(payload: CreateExpenseRequest) {
    return this.api.post<Expenses>(this.endpoint, payload);
  }

  updateExpense(id: string, payload: UpdateExpenseRequest) {
    return this.api.patch<Expenses>(
      `${this.endpoint}/${id}`,
      payload,
    );
  }

  deleteExpense(id: string) {
    return this.api.delete<{ message: string }>(
      `${this.endpoint}/${id}`,
    );
  }

  getExpenseSummary(householdId: string) {
    return this.api.get<ExpenseSummary>(
      `${this.endpoint}/summary?householdId=${encodeURIComponent(householdId)}`,
    );
  }
}
