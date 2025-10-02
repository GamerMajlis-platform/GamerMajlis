import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const homeGuard: CanActivateFn = (route, state) => {
  const _PLATFORM_ID = inject(PLATFORM_ID);
  const router = inject(Router);
  let token!: string;
  if (isPlatformBrowser(_PLATFORM_ID)) {
    token = localStorage.getItem('auth_token') as string;
  }

  if (token) {
    router.navigate(['/home']);
    return false;
  }

  return true;
};
