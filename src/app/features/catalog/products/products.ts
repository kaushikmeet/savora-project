import {
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CreateProductDto, Product, ProductQuery } from '../../../core/models/product.model';
import { Category } from '../../../core/models/category.model';
import { CatalogService } from '../../../core/services/catalog.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject } from 'rxjs';



@Component({
  selector: 'app-product-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl:'./products.html',
})
export class Products implements OnInit {
  private readonly catalogService = inject(CatalogService);
  private readonly fb = inject(FormBuilder);
  private readonly searchSubject = new Subject<string>();

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);

  loading = signal(false);
  saving = signal(false);

  error = signal('');
  success = signal('');

  modalOpen = signal(false);
  editingProduct = signal<Product | null>(null);

  // Search and filters
  search = signal('');
  categoryFilter = signal('');
  brandFilter = signal('');
  statusFilter = signal<'all' | 'active' | 'inactive'>('all');


  // Pagination
  page = signal(1);
  limit = signal(10);
  total = signal(0);
  totalPages = signal(0);

  // Image preview
  imagePreview = signal('');

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    brand: ['', Validators.maxLength(200)],
    barcode: ['', Validators.maxLength(100)],
    categoryId: ['', Validators.required],
    variant: ['', Validators.maxLength(100)],
    quantity: [null as number | null, [Validators.min(0.001)]],
    unit: ['', Validators.maxLength(30)],
    imageUrl: ['', Validators.maxLength(500)],
    description: ['', Validators.maxLength(500)],
    isActive: [true],
  });

  ngOnInit(): void {
  this.loadCategories();

  this.searchSubject
    .pipe(
      debounceTime(300),
      distinctUntilChanged(),
    )
    .subscribe((value) => {
      this.search.set(value);
      this.page.set(1);
      this.loadProducts();
    });

    this.loadProducts();
  }

  // ==============================
  // LOAD CATEGORIES
  // ==============================

  loadCategories(): void {
    this.catalogService.getCategories().subscribe({
      next: (categories) => {
        this.categories.set(categories);
      },
      error: () => {
        this.error.set('Failed to load categories.');
      },
    });
  }

  // ==============================
  // LOAD PRODUCTS
  // ==============================

  loadProducts(): void {
  this.loading.set(true);
  this.error.set('');

  const status = this.statusFilter();

  const query: ProductQuery = {
    page: this.page(),
    limit: this.limit(),
    search: this.search().trim() || undefined,
    categoryId: this.categoryFilter() || undefined,
    brand: this.brandFilter().trim() || undefined,
    isActive:
      status === 'all'
        ? undefined
        : status === 'active',
  };

  this.catalogService.getProducts(query).subscribe({
    next: (response) => {
      this.products.set(response.items);
      this.total.set(response.pagination.total);
      this.totalPages.set(response.pagination.totalPages);
      this.page.set(response.pagination.page);
      this.limit.set(response.pagination.limit);
      this.loading.set(false);
    },
    error: (err) => {
      this.error.set(
        err?.error?.message || 'Failed to load products.',
      );
      this.loading.set(false);
    },
  });
}

  // ==============================
  // SEARCH / FILTER
  // ==============================

  onSearchChange(value: string): void {
    this.searchSubject.next(value);
    this.search.set(value);
    this.page.set(1);
    this.loadProducts();
  }

  onCategoryFilterChange(value: string): void {
    this.categoryFilter.set(value);
    this.page.set(1);
    this.loadProducts();
  }

  onBrandFilterChange(value: string): void {
    this.brandFilter.set(value);
    this.page.set(1);
    this.loadProducts();
  }

  clearFilters(): void {
    this.search.set('');
    this.searchSubject.next('');
    this.categoryFilter.set('');
    this.brandFilter.set('');
    this.statusFilter.set('all');
    this.page.set(1);
    this.loadProducts();
  }

  onStatusFilterChange(value: 'all' | 'active' | 'inactive'): void {
    this.statusFilter.set(value);
    this.page.set(1);
    this.loadProducts();
  }

  // ==============================
  // PAGINATION
  // ==============================

  previousPage(): void {
    if (this.page() > 1) {
      this.page.update((value) => value - 1);
      this.loadProducts();
    }
  }

  nextPage(): void {
    if (this.page() < this.totalPages()) {
      this.page.update((value) => value + 1);
      this.loadProducts();
    }
  }

  onPageSizeChange(value: string): void {
    this.limit.set(Number(value));
    this.page.set(1);
    this.loadProducts();
  }

  get startItem(): number {
    if (this.total() === 0) return 0;
    return (this.page() - 1) * this.limit() + 1;
  }

  get endItem(): number {
    return Math.min(this.page() * this.limit(), this.total());
  }

  // ==============================
  // CREATE
  // ==============================

  openCreateModal(): void {
    this.editingProduct.set(null);
    this.imagePreview.set('');

    this.form.reset({
      name: '',
      brand: '',
      barcode: '',
      categoryId: '',
      variant: '',
      quantity: null,
      unit: '',
      imageUrl: '',
      description: '',
      isActive: true,
    });

    this.clearMessages();
    this.modalOpen.set(true);
  }

  // ==============================
  // EDIT
  // ==============================

  openEditModal(product: Product): void {
    this.editingProduct.set(product);

    this.imagePreview.set(product.imageUrl ?? '');

    this.form.reset({
      name: product.name,
      brand: product.brand ?? '',
      barcode: product.barcode ?? '',
      categoryId: product.categoryId,
      variant: product.variant ?? '',
      quantity:
        product.quantity != null
          ? Number(product.quantity)
          : null,
      unit: product.unit ?? '',
      imageUrl: product.imageUrl ?? '',
      description: product.description ?? '',
      isActive: product.isActive,
    });

    this.clearMessages();
    this.modalOpen.set(true);
  }

  // ==============================
  // MODAL
  // ==============================

  closeModal(): void {
    if (this.saving()) return;

    this.modalOpen.set(false);
    this.editingProduct.set(null);
    this.imagePreview.set('');
  }

  // ==============================
  // IMAGE PREVIEW
  // ==============================

  onImageUrlChange(value: string): void {
    this.imagePreview.set(value.trim());
  }

  // ==============================
  // SAVE
  // ==============================

  saveProduct(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid || this.saving()) {
      return;
    }

    this.saving.set(true);
    this.clearMessages();

    const value = this.form.getRawValue();

    const dto: CreateProductDto = {
      name: value.name!.trim(),
      brand: value.brand?.trim() || undefined,
      barcode: value.barcode?.trim() || undefined,
      categoryId: value.categoryId!,
      variant: value.variant?.trim() || undefined,
      quantity: value.quantity ?? undefined,
      unit: value.unit?.trim() || undefined,
      imageUrl: value.imageUrl?.trim() || undefined,
      description: value.description?.trim() || undefined,
      isActive: value.isActive ?? true,
    };

    const editing = this.editingProduct();

    const request = editing
      ? this.catalogService.updateProduct(editing.id, dto)
      : this.catalogService.createProduct(dto);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.modalOpen.set(false);
        this.editingProduct.set(null);

        this.success.set(
          editing
            ? 'Product updated successfully.'
            : 'Product created successfully.',
        );

        this.loadProducts();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(
          err?.error?.message || 'Failed to save product.',
        );
      },
    });
  }

  // ==============================
  // DEACTIVATE
  // ==============================

  deleteProduct(product: Product): void {
    const confirmed = confirm(
      `Are you sure you want to deactivate "${product.name}"?`,
    );

    if (!confirmed) return;

    this.clearMessages();

    this.catalogService.deleteProduct(product.id).subscribe({
      next: () => {
        this.success.set('Product deactivated successfully.');
        this.loadProducts();
      },
      error: (err) => {
        this.error.set(
          err?.error?.message || 'Failed to deactivate product.',
        );
      },
    });
  }

  // ==============================
  // UTILITIES
  // ==============================

  getCategoryName(categoryId: string): string {
    return (
      this.categories().find((category) => category.id === categoryId)
        ?.name ?? 'Unknown category'
    );
  }

  clearMessages(): void {
    this.error.set('');
    this.success.set('');
  }

  activateProduct(product: Product): void {
  const confirmed = confirm(
    `Are you sure you want to activate "${product.name}"?`,
  );

  if (!confirmed) return;

  this.clearMessages();

  this.catalogService
    .updateProduct(product.id, { isActive: true })
    .subscribe({
      next: () => {
        this.success.set('Product activated successfully.');
        this.loadProducts();
      },
      error: (err) => {
        this.error.set(
          err?.error?.message || 'Failed to activate product.',
        );
      },
    });
}
  
}