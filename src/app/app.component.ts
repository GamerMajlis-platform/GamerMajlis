import { Component, OnInit, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { NavbarComponent } from './core/components/navbar/navbar.component';
import { FooterComponent } from './core/components/footer/footer.component';
import { ChatbotComponent } from './shared/components/chatbot/chatbot.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, FooterComponent, ChatbotComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'GamerMajlis';
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return; // Avoid window access during SSR
    }
    const captureToken = () => {
      const href = window.location.href;
      const tokenFromSearch = new URL(href).searchParams.get('token');

      let tokenFromHash: string | null = null;
      if (window.location.hash && window.location.hash.includes('?')) {
        const query = window.location.hash.substring(
          window.location.hash.indexOf('?')
        );
        const params = new URLSearchParams(query);
        tokenFromHash = params.get('token');
      }

      const token = tokenFromSearch || tokenFromHash;
      if (token) {
        try {
          localStorage.setItem('auth_token', token);
        } catch {}
        this.router.navigate(['/home']);
        return true;
      }
      return false;
    };

    // Initial attempt
    if (captureToken()) return;

    // Also listen for late hash/search changes
    const handler = () => captureToken();
    window.addEventListener('hashchange', handler);
    window.addEventListener('popstate', handler);
  }
}
