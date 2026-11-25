import { Category } from './category.model';

export interface Product {
  id: string;
  name: string;
  brand?: string | null;
  barcode?: string | null;
  categoryId: string;
  category?: Category;
  variant?: string | null;
  quantity?: number | string | null;
  unit?: string | null;
  imageUrl?: string | null;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  name: string;
  brand?: string;
  barcode?: string;
  categoryId: string;
  variant?: string;
  quantity?: number;
  unit?: string;
  imageUrl?: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateProductDto {
  name?: string;
  brand?: string;
  barcode?: string;
  categoryId?: string;
  variant?: string;
  quantity?: number;
  unit?: string;
  imageUrl?: string;
  description?: string;
  isActive?: boolean;
}

export interface ProductQuery {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  brand?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: Pagination;
}

export interface ProductQuery {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  brand?: string;
  isActive?: boolean;
}

export type ProductListResponse = PaginatedResponse<Product>;