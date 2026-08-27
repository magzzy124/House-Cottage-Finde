import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, UserProfile } from '../../services/auth-service';

@Component({
  selector: 'app-profile',
  imports: [FormsModule, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  profile = signal<UserProfile | null>(null);
  loading = signal(true);
  saving = signal(false);
  success = signal('');
  error = signal('');

  firstName = '';
  lastName = '';
  phone = '';
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  memberSince = '';

  ngOnInit() {
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadProfile();
  }

  loadProfile() {
    this.auth.getProfile().subscribe({
      next: (res) => {
        this.profile.set(res);
        this.firstName = res.firstName;
        this.lastName = res.lastName;
        this.phone = res.phone;
        this.memberSince = new Date(res.createdAt).toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric'
        });
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSave() {
    this.error.set('');
    this.success.set('');

    if (this.newPassword && this.newPassword !== this.confirmPassword) {
      this.error.set('New passwords do not match');
      return;
    }

    this.saving.set(true);

    const payload: any = {
      firstName: this.firstName,
      lastName: this.lastName,
      phone: this.phone,
    };

    if (this.newPassword) {
      payload.currentPassword = this.currentPassword;
      payload.newPassword = this.newPassword;
    }

    this.auth.updateProfile(payload).subscribe({
      next: (res) => {
        this.auth.setCurrentUser({
          id: res.id,
          firstName: res.firstName,
          lastName: res.lastName,
          username: res.username,
          email: res.email,
        });
        this.saving.set(false);
        this.success.set('Profile updated successfully');
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.message || 'Failed to update profile');
      },
    });
  }
}
