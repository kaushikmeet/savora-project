import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpParams,
} from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
  ApiMessageResponse,
} from '../models/category.model';

import {
  Product,
  CreateProductDto,
  UpdateProductDto,
  ProductQuery,
  ProductListResponse,
} from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class CatalogService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl =
    'http://localhost:3000/api/v1/catalog';

  // ==============================
  // CATEGORY APIs
  // ==============================

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(
      `${this.baseUrl}/categories`,
    );
  }

  getCategoryById(id: string): Observable<Category> {
    return this.http.get<Category>(
      `${this.baseUrl}/categories/${id}`,
    );
  }

  createCategory(dto: CreateCategoryDto): Observable<Category> {
    return this.http.post<Category>(
      `${this.baseUrl}/categories`,
      dto,
    );
  }

  updateCategory(
    id: string,
    dto: UpdateCategoryDto,
  ): Observable<Category> {
    return this.http.patch<Category>(
      `${this.baseUrl}/categories/${id}`,
      dto,
    );
  }

  deleteCategory(id: string): Observable<ApiMessageResponse> {
    return this.http.delete<ApiMessageResponse>(
      `${this.baseUrl}/categories/${id}`,
    );
  }

  // ==============================
  // PRODUCT APIs
  // ==============================

  getProducts(query: ProductQuery = {}): Observable<ProductListResponse> {
    let params = new HttpParams();

    if (query.page !== undefined) {
      params = params.set('page', query.page);
    }

    if (query.limit !== undefined) {
      params = params.set('limit', query.limit);
    }

    if (query.isActive !== undefined) {
      params = params.set('isActive', query.isActive);
    }

    if (query.search?.trim()) {
      params = params.set('search', query.search.trim());
    }

    if (query.categoryId) {
      params = params.set('categoryId', query.categoryId);
    }

    if (query.brand?.trim()) {
      params = params.set('brand', query.brand.trim());
    }

    return this.http.get<ProductListResponse>(
      `${this.baseUrl}/products`,
      { params },
    );
  }

  getProductById(id: string): Observable<Product> {
    return this.http.get<Product>(
      `${this.baseUrl}/products/${id}`,
    );
  }

  createProduct(dto: CreateProductDto): Observable<Product> {
    return this.http.post<Product>(
      `${this.baseUrl}/products`,
      dto,
    );
  }

  updateProduct(
    id: string,
    dto: UpdateProductDto,
  ): Observable<Product> {
    return this.http.patch<Product>(
      `${this.baseUrl}/products/${id}`,
      dto,
    );
  }

  deleteProduct(id: string): Observable<ApiMessageResponse> {
    return this.http.delete<ApiMessageResponse>(
      `${this.baseUrl}/products/${id}`,
    );
  }
}