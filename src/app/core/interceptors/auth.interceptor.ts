import { HttpInterceptorFn } from '@angular/common/http';

// Certain endpoints are intentionally public and should not send an Authorization header
// even if a token exists (e.g. /trending content). This prevents 401s when a stale/invalid
// token is stored locally while still allowing the rest of the app to use auth.
function isPublicEndpoint(url: string): boolean {
  // Normalize to lower-case for comparison and strip query params
  const path = url.toLowerCase();
  return path.endsWith('/trending') || path.includes('/trending?');
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = (() => {
    try {
      return localStorage.getItem('auth_token');
    } catch {
      return null;
    }
  })();

  // Skip attaching Authorization for known public endpoints
  if (token && !isPublicEndpoint(req.url)) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};
