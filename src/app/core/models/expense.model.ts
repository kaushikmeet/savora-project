
export interface ExpenseItem {
  id: string;
  expenseId: string;
  shoppingListItemId: string | null;
  productId: string | null;
  name: string;
  quantity: string;
  unit: string | null;
  actualUnitPrice: string;
  lineTotal: string;
  createdAt: string;
}

export interface Expenses {
  id: string;
  householdId: string;
  shoppingListId: string | null;
  totalAmount: string;
  currencyCode: string;
  purchasedAt: string;
  notes: string | null;
  recordedByUserId: string;
  items: ExpenseItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseItemRequest {
  shoppingListItemId?: string;
  productId?: string;
  name: string;
  quantity: number;
  unit?: string;
  actualUnitPrice: number;
}

export interface CreateExpenseRequest {
  householdId: string;
  shoppingListId?: string;
  purchasedAt: string;
  currencyCode?: string;
  notes?: string;
  items: CreateExpenseItemRequest[];
}

export interface UpdateExpenseRequest {
  purchasedAt?: string;
  notes?: string;
}

export interface ExpenseSummary {
  expenseCount: number;
  totalSpent: string;
  currencyCode: string;
}
