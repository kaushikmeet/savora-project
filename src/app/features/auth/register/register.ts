import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Auth } from '../../../core/services/auth';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  name = '';
  email = '';
  password = '';
  loading = false;
  error = '';

  constructor(
    private readonly authService: Auth,
    private readonly route: Router
  ){}

  submit(): void{
    if(this.loading) return;

    this.loading = true;
    this.error = '';

    this.authService.register({
      fullName: this.name.trim(),
      email: this.email.trim(),
      password: this.password
    }).subscribe({
      next:(res)=>{
        this.authService.saveSession(res);
        this.loading = false;
        void this.route.navigate(['/dashboard']);
      },
      error:(err)=>{
        this.loading = false;
        this.error =err.error?.message || 'Regestraion failed'; 
      }
    });
  }
}
