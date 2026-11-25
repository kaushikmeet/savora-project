import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from './api';
import {
  ShoppingList,
  ShoppingListItem,
  CreateShoppingListRequest,
  UpdateShoppingListRequest,
  AddShoppingListItemRequest,
  UpdateShoppingListItemRequest,
  UpsertItemPriceRequest,
  ShoppingItemPriceEstimate,
} from '../models/shopping-list.model';

import {} from '../models/shopping-list.model';


@Injectable({
  providedIn: 'root',
})
export class ShoppingListsService {
  private readonly api = inject(Api);
  private readonly endpoint = '/shopping-lists';

  getLists(): Observable<ShoppingList[]> {
    return this.api.get<ShoppingList[]>(this.endpoint);
  }

  getListById(id: string): Observable<ShoppingList> {
    return this.api.get<ShoppingList>(`${this.endpoint}/${id}`);
  }

  createList(dto: CreateShoppingListRequest): Observable<ShoppingList> {
    return this.api.post<ShoppingList>(this.endpoint, dto);
  }

  updateList(
    id: string,
    dto: UpdateShoppingListRequest,
  ): Observable<ShoppingList> {
    return this.api.patch<ShoppingList>(
      `${this.endpoint}/${id}`,
      dto,
    );
  }

  deleteList(id: string): Observable<unknown> {
    return this.api.delete<unknown>(`${this.endpoint}/${id}`);
  }

  addItem(
    listId: string,
    dto: AddShoppingListItemRequest,
  ): Observable<ShoppingListItem> {
    return this.api.post<ShoppingListItem>(
      `${this.endpoint}/${listId}/items`,
      dto,
    );
  }

  updateItem(
    listId: string,
    itemId: string,
    dto: UpdateShoppingListItemRequest,
  ): Observable<ShoppingListItem> {
    return this.api.patch<ShoppingListItem>(
      `${this.endpoint}/${listId}/items/${itemId}`,
      dto,
    );
  }

  togglePurchased(
    listId: string,
    itemId: string,
  ): Observable<ShoppingListItem> {
    return this.api.patch<ShoppingListItem>(
      `${this.endpoint}/${listId}/items/${itemId}/purchase`,
      {},
    );
  }

  deleteItem(listId: string, itemId: string): Observable<unknown> {
    return this.api.delete<unknown>(
      `${this.endpoint}/${listId}/items/${itemId}`,
    );
  }


getItemPriceEstimate(
  listId: string,
  itemId: string,
) {
  return this.api.get<ShoppingItemPriceEstimate>(
    `/shopping-lists/${listId}/items/${itemId}/price-estimate`,
  );
}

createItemPriceEstimate(
  listId: string,
  itemId: string,
  payload: UpsertItemPriceRequest,
) {
  return this.api.post<ShoppingItemPriceEstimate>(
    `/shopping-lists/${listId}/items/${itemId}/price-estimate`,
    payload,
  );
}

updateItemPriceEstimate(
  listId: string,
  itemId: string,
  payload: UpsertItemPriceRequest,
) {
  return this.api.put<ShoppingItemPriceEstimate>(
    `/shopping-lists/${listId}/items/${itemId}/price-estimate`,
    payload,
  );
}

deleteItemPriceEstimate(
  listId: string,
  itemId: string,
) {
  return this.api.delete<{ message: string }>(
    `/shopping-lists/${listId}/items/${itemId}/price-estimate`,
  );
}

}