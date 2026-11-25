import {
  Component,
  OnInit,
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
import { Category, CreateCategoryDto } from '../../../core/models/category.model';
import { CatalogService } from '../../../core/services/catalog.service';



interface CategoryRow {
  category: Category;
  depth: number;
}

@Component({
  selector: 'app-category-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './categories.html',
})
export class Categories implements OnInit {
  private readonly catalogService = inject(CatalogService);
  private readonly fb = inject(FormBuilder);

  categories = signal<Category[]>([]);
  loading = signal(false);
  saving = signal(false);
  error = signal('');
  success = signal('');

  search = signal('');

  modalOpen = signal(false);
  editingCategory = signal<Category | null>(null);

  // Flatten hierarchy into rows for display
  categoryRows = computed(() => {
    const categories = this.categories();
    const searchText = this.search().trim().toLowerCase();

    const categoryMap = new Map<string, Category[]>();

    for (const category of categories) {
      const parentKey = category.parentId ?? 'root';

      if (!categoryMap.has(parentKey)) {
        categoryMap.set(parentKey, []);
      }

      categoryMap.get(parentKey)!.push(category);
    }

    const rows: CategoryRow[] = [];

    const traverse = (parentId: string | null, depth: number) => {
      const key = parentId ?? 'root';
      const children = categoryMap.get(key) ?? [];

      for (const category of children) {
        rows.push({ category, depth });
        traverse(category.id, depth + 1);
      }
    };

    traverse(null, 0);

    if (!searchText) {
      return rows;
    }

    return rows.filter(({ category }) =>
      category.name.toLowerCase().includes(searchText) ||
      category.slug.toLowerCase().includes(searchText),
    );
  });

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    slug: [
      '',
      [
        Validators.required,
        Validators.maxLength(120),
        Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      ],
    ],
    description: ['', Validators.maxLength(500)],
    icon: ['', Validators.maxLength(100)],
    parentId: [''],
    isActive: [true],
  });

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading.set(true);
    this.error.set('');

    this.catalogService.getCategories().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(
          err?.error?.message || 'Failed to load categories.',
        );
        this.loading.set(false);
      },
    });
  }

  openCreateModal(): void {
    this.editingCategory.set(null);

    this.form.reset({
      name: '',
      slug: '',
      description: '',
      icon: '',
      parentId: '',
      isActive: true,
    });

    this.modalOpen.set(true);
    this.clearMessages();
  }

  openEditModal(category: Category): void {
    this.editingCategory.set(category);

    this.form.reset({
      name: category.name,
      slug: category.slug,
      description: category.description ?? '',
      icon: category.icon ?? '',
      parentId: category.parentId ?? '',
      isActive: category.isActive,
    });

    this.modalOpen.set(true);
    this.clearMessages();
  }

  closeModal(): void {
    if (this.saving()) return;

    this.modalOpen.set(false);
    this.editingCategory.set(null);
  }

  saveCategory(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid || this.saving()) {
      return;
    }

    this.saving.set(true);
    this.clearMessages();

    const formValue = this.form.getRawValue();

    const dto: CreateCategoryDto = {
      name: formValue.name!.trim(),
      slug: formValue.slug!.trim(),
      description: formValue.description?.trim() || undefined,
      icon: formValue.icon?.trim() || undefined,
      parentId: formValue.parentId || null,
      isActive: formValue.isActive ?? true,
    };

    const editing = this.editingCategory();

    const request = editing
      ? this.catalogService.updateCategory(editing.id, dto)
      : this.catalogService.createCategory(dto);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.modalOpen.set(false);
        this.editingCategory.set(null);

        this.success.set(
          editing
            ? 'Category updated successfully.'
            : 'Category created successfully.',
        );

        this.loadCategories();
      },
      error: (err) => {
        this.saving.set(false);

        this.error.set(
          err?.error?.message || 'Failed to save category.',
        );
      },
    });
  }

  deleteCategory(category: Category): void {
    const confirmed = confirm(
      `Are you sure you want to delete "${category.name}"?`,
    );

    if (!confirmed) return;

    this.clearMessages();

    this.catalogService.deleteCategory(category.id).subscribe({
      next: () => {
        this.success.set('Category deleted successfully.');
        this.loadCategories();
      },
      error: (err) => {
        this.error.set(
          err?.error?.message || 'Failed to delete category.',
        );
      },
    });
  }

  getParentName(category: Category): string {
    if (!category.parentId) {
      return 'Root category';
    }

    return (
      this.categories().find(
        (item) => item.id === category.parentId,
      )?.name ?? 'Unknown parent'
    );
  }

  getParentOptions(): Category[] {
    const editingId = this.editingCategory()?.id;

    return this.categories().filter(
      (category) => category.id !== editingId,
    );
  }

  generateSlug(): void {
    const name = this.form.controls.name.value ?? '';

    const slug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    this.form.controls.slug.setValue(slug);
  }

  clearMessages(): void {
    this.error.set('');
    this.success.set('');
  }
}