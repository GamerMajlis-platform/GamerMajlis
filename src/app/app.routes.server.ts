import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Static routes that can be prerendered
  {
    path: '',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'home',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'tournaments',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'marketplace',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'events',
    renderMode: RenderMode.Prerender,
  },
  // Auth routes (can be prerendered as they're static)
  {
    path: 'login',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'register',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'auth/success',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'api/auth/discord/callback',
    renderMode: RenderMode.Server, // Callback processing
  },
  // Dynamic and authenticated routes should use Server-Side Rendering
  {
    path: 'tournaments/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'tournaments/:id/edit',
    renderMode: RenderMode.Server,
  },
  {
    path: 'tournaments/create',
    renderMode: RenderMode.Server, // Requires authentication
  },
  {
    path: 'products',
    renderMode: RenderMode.Server, // Assuming this needs dynamic data
  },
  {
    path: 'profile',
    renderMode: RenderMode.Server, // Requires authentication
  },
  {
    path: 'wishlist',
    renderMode: RenderMode.Server, // Requires authentication
  },
  {
    path: 'chatsPage',
    renderMode: RenderMode.Server, // Interactive chat
  },
  // Fallback for all other routes
  {
    path: '**',
    renderMode: RenderMode.Server, // Not found page - can handle any route
  },
];
