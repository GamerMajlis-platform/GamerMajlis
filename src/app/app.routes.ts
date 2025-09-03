import { Routes } from '@angular/router';
import { AuthLayoutComponent } from './core/layouts/auth-layout/auth-layout.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full',
  },
  {
    path: '',
    component: AuthLayoutComponent,
    // canActivate: [homeGuard],
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./auth/components/login/login.component').then(
            (e) => e.LoginComponent
          ),
        title: 'Sign In',
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./auth/components/sign-up/sign-up.component').then(
            (e) => e.SignUpComponent
          ),
        title: 'Sign Up',
      },
      // {
      //   path: 'forgetPassword',
      //   loadComponent: () =>
      //     import('./auth/pages/forget-password/forget-password.component').then(
      //       (e) => e.ForgetPasswordComponent
      //     ),
      //   title: 'Forget Password',
      // },
      // {
      //   path: 'verifyResetCode',
      //   loadComponent: () =>
      //     import(
      //       './auth/pages/verify-reset-code/verify-reset-code.component'
      //     ).then((e) => e.VerifyResetCodeComponent),
      //   title: 'Verify Reset Code',
      // },
      // {
      //   path: 'resetPassword',
      //   loadComponent: () =>
      //     import('./auth/pages/reset-password/reset-password.component').then(
      //       (e) => e.ResetPasswordComponent
      //     ),
      //   title: 'Reset Password',
      // },
    ],
  },
  {
    path: '',
    // component: MainLayoutComponent,
    // canActivate: [authGuard],
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./pages/home/home.component').then((e) => e.HomeComponent),
        title: 'Fast-Cart Home',
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./pages/product-details/product-details.component').then(
            (e) => e.ProductDetailsComponent
          ),
      },
      {
        path: 'wishlist',
        loadComponent: () =>
          import('./pages/wishlist/wishlist.component').then(
            (e) => e.WishlistComponent
          ),
      },
    ],
  },
  //   {
  //     path: '**',
  //     loadComponent: () =>
  //       import('./pages/notfound/notfound.component').then(
  //         (e) => e.NotfoundComponent
  //       ),
  //     title: 'Not Found',
  //   },
];
