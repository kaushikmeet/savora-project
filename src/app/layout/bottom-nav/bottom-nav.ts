import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './bottom-nav.html',
  styleUrl: './bottom-nav.css',
})
export class BottomNav {
items = [
    { label: 'Home', icon: '⌂', path: '/dashboard' },
    { label: 'Lists', icon: '🛒', path: '/shopping-lists' },
    { label: 'Budget', icon: '💰', path: '/budgets' },
    { label: 'Analytics', icon: '📊', path: '/analytics' },
    { label: 'Profile', icon: '👤', path: '/settings' },
  ];
}
