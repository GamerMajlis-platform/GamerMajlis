import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthApiService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-discord-callback',
  standalone: true,
  imports: [TranslateModule],
  template: `
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"
        ></div>
        <p class="text-gray-600">{{ 'AUTH.DISCORD.PROCESSING' | translate }}</p>
      </div>
    </div>
  `,
  styles: [
    `
      .animate-spin {
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class DiscordCallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authApi = inject(AuthApiService);
  private toastr = inject(ToastrService);

  ngOnInit() {
    this.handleDiscordCallback();
  }

  private handleDiscordCallback() {
    this.route.queryParams.subscribe((params) => {
      console.log('Discord callback params:', params);

      const error = params['error'];
      const errorDescription = params['error_description'];
      const code = params['code'];
      const state = params['state'];

      // Handle OAuth errors
      if (error) {
        console.error('Discord OAuth error:', error, errorDescription);
        this.toastr.error(
          `Discord authentication failed: ${errorDescription || error}`
        );
        this.router.navigate(['/login']);
        return;
      }

      // Handle missing authorization code
      if (!code) {
        this.toastr.error('No authorization code received from Discord');
        this.router.navigate(['/login']);
        return;
      }

      // Validate state parameter for security
      const storedState = localStorage.getItem('discord_oauth_state');
      if (state && storedState && state !== storedState) {
        console.error('State parameter mismatch - possible CSRF attack');
        this.toastr.error('Invalid authentication state');
        this.router.navigate(['/login']);
        return;
      }

      // Clear stored state
      localStorage.removeItem('discord_oauth_state');

      // Exchange authorization code for token via backend
      this.authApi.discordCallback(code, state || '').subscribe({
        next: (res) => {
          console.log('Discord authentication successful:', res);
          this.toastr.success('Successfully logged in with Discord!');
          this.router.navigate(['/home']);
        },
        error: (err) => {
          console.error('Discord callback error:', err);
          this.toastr.error(
            err.error?.message || 'Discord authentication failed'
          );
          this.router.navigate(['/login']);
        },
      });
    });
  }
}
