import { Component, inject } from '@angular/core';
import { Auth } from '../../core/services/auth';

@Component({
  selector: 'app-top-header',
  imports: [],
  templateUrl: './top-header.html',
  styleUrl: './top-header.css',
})
export class TopHeader {
private authService = inject(Auth);

  get userName(): string {
    return this.authService.currentUser()?.fullName ?? 'User';
  }

  get initials(): string {
    return this.userName
      .split(' ')
      .filter(Boolean)
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  logout(): void {
    this.authService.logout();
  }
}
