import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  FormControl,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap, of, catchError } from 'rxjs';
import { ShoppingListsService } from '../../../core/services/shopping-lists.service';
import { CatalogService } from '../../../core/services/catalog.service';
import { ShoppingItemPriceEstimate, ShoppingList, ShoppingListItem, ShoppingListStatus, UpsertItemPriceRequest } from '../../../core/models/shopping-list.model';
import { Product } from '../../../core/models/product.model';



@Component({
  selector: 'app-shopping-list-details',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './shopping-list-details.html',
})
export class ShoppingListDetails implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly shoppingListsService = inject(ShoppingListsService);
  private readonly catalogService = inject(CatalogService);

  readonly priceEstimates = signal<
    Record<string, ShoppingItemPriceEstimate | null>
  >({});
  readonly priceEditorItemId = signal<string | null>(null);
  readonly priceSaving = signal(false);
  readonly priceForm = this.fb.group({
    estimatedUnitPrice: [
      null as number | null,
      [
        Validators.required,
        Validators.min(0.01),
        Validators.max(9999999999.99),
      ],
    ],
    currencyCode: ['INR', [Validators.maxLength(3)]],
    source: ['MANUAL'],
    notes: ['', [Validators.maxLength(1000)]],
  });

  readonly list = signal<ShoppingList | null>(null);
  readonly products = signal<Product[]>([]);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly productsLoading = signal(false);

  readonly error = signal('');
  readonly success = signal('');

  readonly showItemForm = signal(false);
  readonly editingItem = signal<ShoppingListItem | null>(null);

  readonly searchControl = new FormControl('', {
    nonNullable: true,
  });

  readonly activeItems = computed(() =>
    (this.list()?.items ?? []).filter((item) => !item.isPurchased),
  );

  readonly purchasedItems = computed(() =>
    (this.list()?.items ?? []).filter((item) => item.isPurchased),
  );

  readonly totalItems = computed(() =>
    this.list()?.items?.length ?? 0,
  );

  readonly purchasedCount = computed(() =>
    this.purchasedItems().length,
  );

  readonly progress = computed(() => {
    const total = this.totalItems();

    return total > 0
      ? Math.round((this.purchasedCount() / total) * 100)
      : 0;
  });

  readonly isReadOnly = computed(() => {
    const status = this.list()?.status;

    return (
      status === 'COMPLETED' ||
      status === 'ARCHIVED'
    );
  });

  readonly itemForm = this.fb.nonNullable.group({
    productId: ['', Validators.required],
    quantity: [
      1,
      [
        Validators.required,
        Validators.min(0.001),
        Validators.max(9999999.999),
      ],
    ],
    unit: ['', Validators.maxLength(50)],
    notes: ['', Validators.maxLength(500)],
  });

  ngOnInit(): void {
    this.loadList();
    this.loadProducts();
    this.setupProductSearch();
  }

  private get listId(): string {
    return this.route.snapshot.paramMap.get('id') ?? '';
  }

  loadList(): void {
    if (!this.listId) {
      this.error.set('Shopping list ID is missing.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.shoppingListsService.getListById(this.listId).subscribe({
      next: (list) => {
        this.list.set(list);
        list.items?.forEach((item) => {
        this.loadItemPriceEstimate(item.id);
      });
      this.loading.set(false);
      },
      error: (err) => {
        this.error.set(
          err?.error?.message || 'Unable to load shopping list.',
        );
        this.loading.set(false);
      },
    });
  }

  private loadProducts(search = ''): void {
    this.productsLoading.set(true);

    this.catalogService.getProducts({
      page: 1,
      limit: 100,
      isActive: true,
      search,
    }).subscribe({
      next: (response) => {
        this.products.set(response.items);
        this.productsLoading.set(false);
      },
      error: () => {
        this.productsLoading.set(false);
        this.error.set('Unable to load catalog products.');
      },
    });
  }

  private setupProductSearch(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((search) => {
          this.productsLoading.set(true);

          return this.catalogService.getProducts({
            page: 1,
            limit: 100,
            isActive: true,
            search: search.trim(),
          }).pipe(
            catchError(() => {
              this.error.set('Unable to search catalog products.');
              return of({ items: [], pagination: {
                page: 1,
                limit: 100,
                total: 0,
                totalPages: 0,
              } });
            }),
          );
        }),
      )
      .subscribe((response) => {
        this.products.set(response.items);
        this.productsLoading.set(false);
      });
  }

  openAddItemForm(): void {
    if (this.isReadOnly()) return;

    this.editingItem.set(null);

    this.itemForm.reset({
      productId: '',
      quantity: 1,
      unit: '',
      notes: '',
    });

    this.searchControl.setValue('');
    this.showItemForm.set(true);
  }

  openEditItemForm(item: ShoppingListItem): void {
    if (this.isReadOnly()) return;

    this.editingItem.set(item);

    this.itemForm.reset({
      productId: item.productId,
      quantity: Number(item.quantity),
      unit: item.unit ?? '',
      notes: item.notes ?? '',
    });

    this.showItemForm.set(true);
  }

  closeItemForm(): void {
    this.showItemForm.set(false);
    this.editingItem.set(null);
    this.itemForm.reset({
      productId: '',
      quantity: 1,
      unit: '',
      notes: '',
    });
  }

  saveItem(): void {
    if (this.itemForm.invalid || this.saving() || this.isReadOnly()) {
      this.itemForm.markAllAsTouched();
      return;
    }

    const value = this.itemForm.getRawValue();
    const editing = this.editingItem();

    this.saving.set(true);
    this.error.set('');
    this.success.set('');

    const payload = {
      quantity: Number(value.quantity),
      unit: value.unit.trim() || undefined,
      notes: value.notes.trim() || undefined,
    };

    const request = editing
      ? this.shoppingListsService.updateItem(
          this.listId,
          editing.id,
          payload,
        )
      : this.shoppingListsService.addItem(
          this.listId,
          {
            productId: value.productId,
            ...payload,
          },
        );

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeItemForm();
        this.success.set(
          editing ? 'Item updated successfully.' : 'Item added successfully.',
        );
        this.loadList();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(
          err?.error?.message || 'Unable to save shopping-list item.',
        );
      },
    });
  }

  togglePurchased(item: ShoppingListItem): void {
    if (this.isReadOnly()) return;

    this.error.set('');
    this.success.set('');

    this.shoppingListsService
      .togglePurchased(this.listId, item.id)
      .subscribe({
        next: () => {
          this.success.set(
            item.isPurchased
              ? 'Item marked as pending.'
              : 'Item marked as purchased.',
          );
          this.loadList();
        },
        error: (err) => {
          this.error.set(
            err?.error?.message || 'Unable to update purchase status.',
          );
        },
      });
  }

  deleteItem(item: ShoppingListItem): void {
    if (this.isReadOnly()) return;

    const productName = item.product?.name ?? 'this item';

    if (!confirm(`Delete "${productName}" from this shopping list?`)) {
      return;
    }

    this.shoppingListsService
      .deleteItem(this.listId, item.id)
      .subscribe({
        next: () => {
          this.success.set('Item deleted successfully.');
          this.loadList();
        },
        error: (err) => {
          this.error.set(
            err?.error?.message || 'Unable to delete item.',
          );
        },
      });
  }

  completeList(): void {
    const list = this.list();

    if (!list || list.status !== 'ACTIVE') return;

    if (!confirm(`Complete "${list.name}"?`)) return;

    this.shoppingListsService.updateList(list.id, {
      status: 'COMPLETED',
    }).subscribe({
      next: () => {
        this.success.set('Shopping list completed.');
        this.loadList();
      },
      error: (err) => {
        this.error.set(
          err?.error?.message || 'Unable to complete shopping list.',
        );
      },
    });
  }

  getProductName(item: ShoppingListItem): string {
    return item.product?.name ?? 'Unknown product';
  }

  getProductDetails(item: ShoppingListItem): string {
    const product = item.product;

    if (!product) return '';

    return [
      product.brand,
      product.variant,
    ].filter(Boolean).join(' · ');
  }

  getStatusLabel(status: ShoppingListStatus): string {
    switch (status) {
      case 'ACTIVE':
        return 'Active';
      case 'COMPLETED':
        return 'Completed';
      case 'ARCHIVED':
        return 'Archived';
      default:
        return status;
    }
  }


loadItemPriceEstimate(itemId: string): void {
  const listId = this.list()?.id;

  if (!listId) return;

  this.shoppingListsService
    .getItemPriceEstimate(listId, itemId)
    .subscribe({
      next: (estimate) => {
        this.priceEstimates.update((current) => ({
          ...current,
          [itemId]: estimate,
        }));
      },
      error: () => {
        this.priceEstimates.update((current) => ({
          ...current,
          [itemId]: null,
        }));
      },
    });
}

hasPriceEstimate(itemId: string): boolean {
  return !!this.priceEstimates()[itemId]?.estimatedUnitPrice;
}

openPriceEditor(item: ShoppingListItem): void {
  const estimate = this.priceEstimates()[item.id];

  this.priceEditorItemId.set(item.id);

  this.priceForm.reset({
    estimatedUnitPrice: estimate?.estimatedUnitPrice
      ? Number(estimate.estimatedUnitPrice)
      : null,
    currencyCode: estimate?.currencyCode ?? 'INR',
    source: estimate?.source ?? 'MANUAL',
    notes: estimate?.notes ?? '',
  });
}

closePriceEditor(): void {
  this.priceEditorItemId.set(null);
  this.priceForm.reset({
    estimatedUnitPrice: null,
    currencyCode: 'INR',
    source: 'MANUAL',
    notes: '',
  });
}

savePriceEstimate(item: ShoppingListItem): void {
  const listId = this.list()?.id;

  if (!listId || this.priceForm.invalid || this.priceSaving()) {
    this.priceForm.markAllAsTouched();
    return;
  }

  const payload: UpsertItemPriceRequest = {
    estimatedUnitPrice: Number(
      this.priceForm.controls.estimatedUnitPrice.value,
    ),
    currencyCode:
      this.priceForm.controls.currencyCode.value || 'INR',
    source: 'MANUAL',
    notes: this.priceForm.controls.notes.value || undefined,
  };

  const isUpdate = this.hasPriceEstimate(item.id);

  this.priceSaving.set(true);
  this.error.set('');

  const request$ = isUpdate
    ? this.shoppingListsService.updateItemPriceEstimate(
        listId,
        item.id,
        payload,
      )
    : this.shoppingListsService.createItemPriceEstimate(
        listId,
        item.id,
        payload,
      );

  request$.subscribe({
    next: (estimate) => {
      this.priceEstimates.update((current) => ({
        ...current,
        [item.id]: estimate,
      }));

      this.priceSaving.set(false);
      this.closePriceEditor();
    },
    error: (err) => {
      this.error.set(
        err?.error?.message || 'Unable to save price estimate.',
      );
      this.priceSaving.set(false);
    },
  });
}

deletePriceEstimate(item: ShoppingListItem): void {
  const listId = this.list()?.id;

  if (!listId || !this.hasPriceEstimate(item.id)) return;

  this.shoppingListsService
    .deleteItemPriceEstimate(listId, item.id)
    .subscribe({
      next: () => {
        this.priceEstimates.update((current) => ({
          ...current,
          [item.id]: null,
        }));

        this.closePriceEditor();
      },
      error: (err) => {
        this.error.set(
          err?.error?.message || 'Unable to delete price estimate.',
        );
      },
    });
}

}