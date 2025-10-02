import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

export const authGuard: CanActivateFn = (route, state) => {
  const _PLATFORM_ID = inject(PLATFORM_ID);
  const router = inject(Router);
  const toastrService = inject(ToastrService);
  let token!: string | null;
  if (isPlatformBrowser(_PLATFORM_ID)) {
    token = localStorage.getItem('auth_token');
    if (!token) {
      toastrService.error('You need to login first');
      router.navigate(['/login']);
      return false;
    }
  }

  return true;
};
