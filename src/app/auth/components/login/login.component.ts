import {
  trigger,
  state,
  style,
  animate,
  transition,
  stagger,
  query,
} from '@angular/animations';
import { NgClass } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  NgModel,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthApiService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, NgClass, RouterLink, TranslateModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(60px)' }),
        animate(
          '800ms cubic-bezier(0.35, 0, 0.25, 1)',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
    ]),
    trigger('heroAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate(
          '1200ms cubic-bezier(0.35, 0, 0.25, 1)',
          style({ opacity: 1, transform: 'scale(1)' })
        ),
      ]),
    ]),
  ],
})
export class LoginComponent {
  _ToastrService = inject(ToastrService);
  successMessage = '';
  errorMessage = '';
  fb = inject(FormBuilder);
  authApi = inject(AuthApiService);
  router = inject(Router);
  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  discordLogin() {
    // Redirect directly to Discord OAuth URL
    const discordUrl = this.authApi.getDiscordAuthUrl();
    window.location.href = discordUrl;
  }

  onSubmit() {
    this.successMessage = '';
    this.errorMessage = '';
    if (this.loginForm.invalid) return;
    const form = new FormData();
    form.append('identifier', this.loginForm.value.email);
    form.append('password', this.loginForm.value.password);
    this.authApi.login(form).subscribe({
      next: (res) => {
        console.log(res);
        this.successMessage = res.message;
        this._ToastrService.success(this.successMessage);
        setTimeout(() => {
          this.router.navigate(['/home']);
        }, 1000);
      },
      error: (err) => {
        console.error('Login error', err);
        this.errorMessage = err.error.message;
        this._ToastrService.error(this.errorMessage);
      },
    });
  }
}
