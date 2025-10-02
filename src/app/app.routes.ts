import { Routes } from '@angular/router';
import { AuthLayoutComponent } from './core/layouts/auth-layout/auth-layout.component';
import { MainLayoutComponent } from './core/layouts/main-layout/main-layout.component';
import { authGuard } from './core/guard/auth.guard';
import { homeGuard } from './core/guard/home.guard';

export const routes: Routes = [
  {
    path: 'api/auth/discord/callback',
    redirectTo: 'auth/discord/callback',
    pathMatch: 'full',
  },
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full',
  },
  // Public routes (no authentication required)
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./pages/home/home.component').then((e) => e.HomeComponent),
        title: 'GamerMajlis - Home',
      },
    ],
  },
  // Auth routes (redirect to home if already authenticated)
  {
    path: '',
    component: AuthLayoutComponent,
    canActivate: [homeGuard],
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
      {
        path: 'auth/success',
        loadComponent: () =>
          import('./auth/components/auth-success/auth-success.component').then(
            (e) => e.AuthSuccessComponent
          ),
        title: 'Completing Sign-in',
      },
      {
        path: 'api/auth/discord/callback',
        loadComponent: () =>
          import(
            './auth/components/discord-callback/discord-callback.component'
          ).then((e) => e.DiscordCallbackComponent),
        title: 'Discord Authentication',
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
  // Protected routes (authentication required)
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'products',
        loadComponent: () =>
          import('./pages/product-details/product-details.component').then(
            (e) => e.ProductDetailsComponent
          ),
        title: 'Product Details',
      },
      {
        path: 'wishlist',
        loadComponent: () =>
          import('./pages/wishlist/wishlist.component').then(
            (e) => e.WishlistComponent
          ),
        title: 'GamerMajlis - wishlist',
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/user-profile/user-profile.component').then(
            (e) => e.UserProfileComponent
          ),
        title: 'GamerMajlis - Profile',
      },
      {
        path: 'profile/:id',
        loadComponent: () =>
          import('./pages/user-profile/user-profile.component').then(
            (e) => e.UserProfileComponent
          ),
        title: 'GamerMajlis - User Profile',
      },
      {
        path: 'marketplace',
        loadComponent: () =>
          import('./pages/marketplace/marketplace.component').then(
            (e) => e.MarketplaceComponent
          ),
        title: 'GamerMajlis - Marketplace',
      },
      {
        path: 'marketplace/product/:id',
        loadComponent: () =>
          import('./pages/product-details/product-details.component').then(
            (e) => e.ProductDetailsComponent
          ),
        title: 'Product Details - GamerMajlis',
      },
      {
        path: 'events',
        loadComponent: () =>
          import('./pages/events/events.component').then(
            (e) => e.EventsComponent
          ),
        title: 'GamerMajlis - Events',
      },
      {
        path: 'events/create',
        loadComponent: () =>
          import(
            './pages/events/components/event-form/event-form.component'
          ).then((e) => e.EventFormComponent),
        title: 'Create Event - GamerMajlis',
      },
      {
        path: 'events/:id',
        loadComponent: () =>
          import(
            './pages/events/components/event-detail/event-detail.component'
          ).then((e) => e.EventDetailComponent),
        title: 'Event Details - GamerMajlis',
      },
      {
        path: 'events/:id/edit',
        loadComponent: () =>
          import(
            './pages/events/components/event-form/event-form.component'
          ).then((e) => e.EventFormComponent),
        title: 'Edit Event - GamerMajlis',
      },
      {
        path: 'events/:id/attendees',
        loadComponent: () =>
          import(
            './pages/events/components/attendees-management/attendees-management.component'
          ).then((e) => e.AttendeesManagementComponent),
        title: 'Event Attendees - GamerMajlis',
      },
      {
        path: 'timeline',
        loadComponent: () =>
          import('./pages/timeline/timeline.component').then(
            (e) => e.TimelineComponent
          ),
        title: 'Timeline - GamerMajlis',
      },
      // Media feature routes
      {
        path: 'media',
        loadComponent: () =>
          import('./pages/media/media-list/media-list.component').then(
            (e) => e.MediaListComponent
          ),
        title: 'Media - GamerMajlis',
      },
      {
        path: 'media/upload',
        loadComponent: () =>
          import('./pages/media/media-upload/media-upload.component').then(
            (e) => e.MediaUploadComponent
          ),
        title: 'Upload Media - GamerMajlis',
      },
      {
        path: 'media/:id',
        loadComponent: () =>
          import('./pages/media/media-detail/media-detail.component').then(
            (e) => e.MediaDetailComponent
          ),
        title: 'Media Detail - GamerMajlis',
      },
      // Posts feature routes
      {
        path: 'posts',
        loadComponent: () =>
          import('./pages/posts/posts-feed/posts-feed.component').then(
            (e) => e.PostsFeedComponent
          ),
        title: 'Posts - GamerMajlis',
      },
      {
        path: 'posts/create',
        loadComponent: () =>
          import('./pages/posts/post-create/post-create.component').then(
            (e) => e.PostCreateComponent
          ),
        title: 'Create Post - GamerMajlis',
      },
      {
        path: 'posts/:id',
        loadComponent: () =>
          import('./pages/posts/post-detail/post-detail.component').then(
            (e) => e.PostDetailComponent
          ),
        title: 'Post Detail - GamerMajlis',
      },
      {
        path: 'tournaments',
        loadComponent: () =>
          import('./pages/tournaments/tournaments.component').then(
            (e) => e.TournamentsComponent
          ),
        title: 'GamerMajlis - Tournaments',
      },
      {
        path: 'tournaments/create',
        loadComponent: () =>
          import('./pages/tournaments/tournament-form.component').then(
            (e) => e.TournamentFormComponent
          ),
        title: 'Create Tournament - GamerMajlis',
      },
      {
        path: 'tournaments/:id',
        loadComponent: () =>
          import('./pages/tournaments/tournament-detail.component').then(
            (e) => e.TournamentDetailComponent
          ),
        title: 'Tournament Details - GamerMajlis',
      },
      {
        path: 'tournaments/:id/edit',
        loadComponent: () =>
          import('./pages/tournaments/tournament-form.component').then(
            (e) => e.TournamentFormComponent
          ),
        title: 'Edit Tournament - GamerMajlis',
      },
      {
        path: 'chatsPage',
        loadComponent: () =>
          import('./pages/chat-page/chat-page.component').then(
            (e) => e.ChatPageComponent
          ),
        title: 'GamerMajlis - Chats',
      },
    ],
  },
  {
    path: '**',
    loadComponent: () =>
      import('./pages/not-found/not-found.component').then(
        (e) => e.NotFoundComponent
      ),
    title: 'Not Found',
  },
];
