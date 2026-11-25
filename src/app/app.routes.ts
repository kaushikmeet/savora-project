import { Routes } from '@angular/router';
import { guestGuard } from './core/guards/guest-guard';
import { authGuard } from './core/guards/auth-guard';
import { Register } from './features/auth/register/register';
import { Login } from './features/auth/login/login';
import { Dashboard } from './features/dashboard/dashboard';
import { Shell } from './layout/shell/shell';

import { Budgets } from './features/budgets/budgets';
import { Expenses } from './features/expenses/expenses';
import { Households } from './features/households/households';
import { Categories } from './features/catalog/categories/categories';
import { Products } from './features/catalog/products/products';
import { ShoppingLists } from './features/shopping/shopping-lists/shopping-lists';
import { ShoppingListDetails } from './features/shopping/shopping-list-details/shopping-list-details';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    component: Login
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    component: Register
  },
  {
    path:'',
    component: Shell,
    canActivate:[authGuard],
    children:[
      {
        path: 'dashboard',
        canActivate: [authGuard],
        component: Dashboard
      },
      {
        path:'households',
        component: Households
      },
      {
        path:'shopping-lists',
        component: ShoppingLists,
      },
      {
        path:'shopping-lists/:id',
        component:ShoppingListDetails
      },
      {
        path:'budgets',
        component: Budgets
      },
      {
        path:'expenses',
        component: Expenses
      },
      {
        path: 'admin/catalog/categories',
        component: Categories
      },
      {
        path: 'admin/catalog/products',
        component: Products
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];