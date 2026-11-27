import { Routes } from '@angular/router';
import { guestGuard } from './core/guards/guest-guard';
import { authGuard } from './core/guards/auth-guard';
import { Register } from './features/auth/register/register';
import { Login } from './features/auth/login/login';
import { Dashboard } from './features/dashboard/dashboard';
import { Shell } from './layout/shell/shell';
import { Households } from './features/households/households';
import { Categories } from './features/catalog/categories/categories';
import { Products } from './features/catalog/products/products';
import { ShoppingLists } from './features/shopping/shopping-lists/shopping-lists';
import { ShoppingListDetails } from './features/shopping/shopping-list-details/shopping-list-details';
import { Budgets } from './features/budgets/budget/budget';
import { BudgetDetails } from './features/budgets/budge-details/budge-details';
import { Expense } from './features/expenses/expense/expense';


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
        path:'budgets/:id',
        component: BudgetDetails
      },
      {
        path:'expenses',
        component: Expense
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