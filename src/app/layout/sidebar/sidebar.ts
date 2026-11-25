import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  menuItems = [
    { label: 'Dashboard', icon: '▦', path: '/dashboard' },
    { label: 'Households', icon: '🏠', path: '/households' },
    { label: 'Shopping Lists', icon: '🛒', path: '/shopping-lists' },
    { label: 'Category', icon: '📦', path: 'admin/catalog/categories' },
    { label: 'Products', icon: '📦', path: 'admin/catalog/products' },
    { label: 'Budgets', icon: '💰', path: '/budgets' },
    { label: 'Expenses', icon: '🧾', path: '/expenses' },
    { label: 'Analytics', icon: '📊', path: '/analytics' },
    { label: 'Settings', icon: '⚙', path: '/settings' },
  ];


}
