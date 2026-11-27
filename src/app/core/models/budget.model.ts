
export type BudgetPeriod = 'WEEKLY' | 'MONTHLY' | 'CUSTOM';

export interface Budget {
  id: string;
  householdId: string;
  name: string;
  amount: string | number;
  currencyCode: string;
  period: BudgetPeriod;
  startDate?: string;
  endDate?: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  isActive?: boolean;
  categories: BudgetCategoryAllocation[]
}

export interface CreateBudgetRequest {
  name: string;
  amount: number;
  currencyCode?: string;
  period: BudgetPeriod;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface UpdateBudgetRequest {
  name?: string;
  amount?: number;
  currencyCode?: string;
  period?: BudgetPeriod;
  startDate?: string;
  endDate?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface BudgetCategoryAllocation {
  id: string;
  budgetId: string;
  categoryId: string;
  category?: {
    id: string;
    name: string;
  };
  allocatedAmount: string | number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBudgetCategoryAllocationRequest {
  categoryId: string;
  allocatedAmount: number;
}

export interface BudgetPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface BudgetListResponse {
  items: Budget[];
  pagination: BudgetPagination;
}
