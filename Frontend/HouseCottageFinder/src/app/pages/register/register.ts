import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  firstName = '';
  lastName = '';
  username = '';
  phone = '';
  email = '';
  password = '';
  confirmPassword = '';

  mismatch = false;
  loading = false;
  error = '';

  private auth = inject(AuthService);
  private router = inject(Router);

  showPassword = false;

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onPasswordChange() {
    this.mismatch = this.confirmPassword.length > 0 && this.confirmPassword !== this.password;
  }

  onRegister() {
    if (this.password !== this.confirmPassword) {
      this.mismatch = true;
      return;
    }

    this.error = '';
    this.loading = true;

    this.auth
      .register({
        firstName: this.firstName,
        lastName: this.lastName,
        username: this.username,
        phone: this.phone,
        email: this.email,
        password: this.password,
        confirmPassword: this.confirmPassword,
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/login'], { queryParams: { registered: 'true' } });
        },
        error: (err: HttpErrorResponse) => {
          this.loading = false;
          if (err.status === 409) {
            this.error = 'Email or username is already in use';
          } else if (err.status === 400) {
            this.error = 'Please make sure the form is filled correctly';
          } else {
            this.error = 'Could not reach the server. Please try again.';
          }
        },
      });
  }
}