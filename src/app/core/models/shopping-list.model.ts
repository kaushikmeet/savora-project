export type ShoppingListStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

export interface ShoppingListItem {
  id: string;
  shoppingListId: string;
  productId: string;

  product?: {
    id: string;
    name: string;
    brand?: string | null;
    variant?: string | null;
    category?: {
      id: string;
      name: string;
    } | null;
  };

  quantity: string;
  unit: string | null;
  notes: string | null;
  isPurchased: boolean;
  purchasedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
 
export interface ShoppingList {
  id: string;
  householdId: string;
  name: string;
  description: string | null;
  status: ShoppingListStatus;
  createdBy: string;
  items?: ShoppingListItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateShoppingListRequest {
  householdId: string;
  name: string;
  description?: string;
}

export interface UpdateShoppingListRequest {
  name?: string;
  description?: string | null;
  status?: ShoppingListStatus;
}

export interface AddShoppingListItemRequest {
  productId: string;
  quantity: number;
  unit?: string;
  notes?: string;
}

export interface UpdateShoppingListItemRequest {
  quantity?: number;
  unit?: string | null;
  notes?: string | null;
  isPurchased?: boolean;
}


export type PriceEstimateSource =
  | 'MANUAL'
  | 'PRODUCT'
  | 'HISTORICAL'
  | 'AI';

export interface ShoppingItemPriceEstimate {
  id?: string;
  shoppingListItemId: string;
  estimatedUnitPrice: string | null;
  quantity: string;
  estimatedTotal: string | null;
  currencyCode: string;
  source: PriceEstimateSource | null;
  notes: string | null;
  estimatedByUserId?: string;
  estimatedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpsertItemPriceRequest {
  estimatedUnitPrice: number;
  currencyCode?: string;
  source?: PriceEstimateSource;
  notes?: string;
}
