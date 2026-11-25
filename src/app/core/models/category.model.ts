export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  parentId: string | null;
  parent?: Category | null;
  children?: Category[];
  isActive: boolean;
  createdAt: string;
}

export interface CreateCategoryDto {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parentId?: string | null;
  isActive?: boolean;
}

export interface UpdateCategoryDto {
  name?: string;
  slug?: string;
  description?: string;
  icon?: string;
  parentId?: string | null;
  isActive?: boolean;
}

export interface CategoryQuery {
  search?: string;
  parentId?: string;
  isActive?: boolean;
}

export interface ApiMessageResponse {
  message: string;
}