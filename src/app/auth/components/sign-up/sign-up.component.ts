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
import { SignUpService } from '../../services/sign-up.service';
import { AuthApiService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { timeout } from 'rxjs';

@Component({
  selector: 'app-sign-up',
  imports: [ReactiveFormsModule, NgClass, RouterLink, TranslateModule],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.css',
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
export class SignUpComponent {
  _ToastrService = inject(ToastrService);
  successMessage = '';
  errorMessage = '';

  _SignUpService = inject(SignUpService);
  authApi = inject(AuthApiService);
  router = inject(Router);
  fb = inject(FormBuilder);
  signUpForm: FormGroup = this.fb.group(
    {
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^[A-Z][A-Za-z0-9]{7,}$/),
        ],
      ],
      displayName: ['', [Validators.required, Validators.minLength(3)]],
      repassword: ['', [Validators.required]],
    },
    { validators: this.checkPasswords }
  );

  checkPasswords(form: AbstractControl): ValidationErrors | null {
    const password = form.get('password')?.value;
    const rePassword = form.get('repassword')?.value;
    return password === rePassword ? null : { notSame: true };
  }

  onSubmit() {
    this.successMessage = '';
    this.errorMessage = '';
    if (this.signUpForm.invalid) return;
    const form = new FormData();
    const Email = new FormData();
    Email.append('email', this.signUpForm.value.email);
    form.append('email', this.signUpForm.value.email);
    form.append('password', this.signUpForm.value.password);
    form.append('displayName', this.signUpForm.value.displayName);
    this.authApi.signUp(form).subscribe({
      next: (res) => {
        console.log(res);
        this.successMessage = res.message;
        this._ToastrService.success(this.successMessage);
        this.authApi.sendEmailVerification(Email).subscribe({
          next: (res) => {
            console.log(res);
          },
          error: (err) => {
            console.error('Send email verification error', err);
          },
        });
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1000);
      },
      error: (err) => {
        console.error('Signup error', err);
        this.errorMessage = err.error.message;
        this._ToastrService.error(this.errorMessage);
      },
    });
  }
}
