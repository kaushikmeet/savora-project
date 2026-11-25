import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Router, RouterModule } from '@angular/router';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  email = '';
  password = '';
  loading = false;
  error = '';

  constructor(
    private readonly authService: Auth,
    private readonly route: Router){}

  submit(): void{
    if(this.loading) return;

    this.loading = true;
    this.error = '';

    this.authService.login({
      email: this.email.trim(),
      password: this.password
    }).subscribe({
      next: (res)=>{
        this.authService.saveSession(res);
        this.loading = false;
        void this.route.navigate(['/dashboard'])
      },
      error:(err)=>{
        this.loading = false;
        this.error = err.error?.message|| 'Invalid email or password'
      }
    })
  }  
}
