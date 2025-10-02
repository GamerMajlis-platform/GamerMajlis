import {
  AfterViewChecked,
  Component,
  DoCheck,
  HostListener,
  inject,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterModule,
} from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../../services/language.service';
import { AuthApiService } from '../../../auth/services/auth.service';
import { ProfileService } from '../../services/Profile/profile.service';
import {
  ProfileResponse,
  User,
} from '../../interfaces/Profile/profile.interface';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RouterLink,
    RouterLinkActive,
    TranslateModule,
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate(
          '200ms ease-in',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
      transition(':leave', [
        animate(
          '200ms ease-out',
          style({ opacity: 0, transform: 'translateY(-10px)' })
        ),
      ]),
    ]),
    trigger('slideInLeft', [
      transition(':enter', [
        style({ transform: 'translateX(-100%)', opacity: 0 }),
        animate(
          '300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          style({ transform: 'translateX(0)', opacity: 1 })
        ),
      ]),
      transition(':leave', [
        animate(
          '250ms cubic-bezier(0.55, 0.055, 0.675, 0.19)',
          style({ transform: 'translateX(-100%)', opacity: 0 })
        ),
      ]),
    ]),
  ],
})
export class NavbarComponent implements OnInit, DoCheck {
  userData: ProfileResponse = {} as ProfileResponse;
  _ProfileService = inject(ProfileService);
  _AuthApiService = inject(AuthApiService);
  router = inject(Router);
  isMobileMenuOpen = false;
  scrolled = false;
  isMobileView = false;
  isTabletView = false;
  _PLATFORM_ID = inject(PLATFORM_ID);
  profileOpen = false;
  profilePictureUrl = '';
  isAuthenticated$: boolean = false;
  token: string | null = null;

  constructor(public language: LanguageService) {}

  ngOnInit() {
    if (isPlatformBrowser(this._PLATFORM_ID)) {
      this.checkScreenSize();
      this.setupEventListeners();
      this.getUserData();
    }
  }

  ngDoCheck() {
    this.checkScreenSize();
    if (isPlatformBrowser(this._PLATFORM_ID)) {
      this.token = localStorage.getItem('auth_token');
      this.isAuthenticated$ = !!this.token;
      if (!this.userData.user && this.token) {
        this.getUserData();
      }
      if (this?.userData?.user?.profilePictureUrl) {
        this.profilePictureUrl = this.userData.user
          ? this.userData.user.profilePictureUrl
            ? 'http://localhost:8080/api' + this.userData.user.profilePictureUrl
            : '/images/user4.jpg'
          : '/images/user4.jpg';
      }
    }
  }

  getUserData() {
    this._ProfileService.getMyProfile().subscribe({
      next: (res) => {
        this.userData = res;
        if (res.user.profilePictureUrl) {
          this.profilePictureUrl = res.user.profilePictureUrl
            ? 'http://localhost:8080/api' + res.user.profilePictureUrl
            : '/images/user4.jpg';
        } else {
          this.profilePictureUrl = '/images/user4.jpg';
        }
      },
      error: (err) => {
        console.error('Failed to get user data:', err);
        this.profilePictureUrl = '/images/user4.jpg';
      },
    });
  }

  private setupEventListeners() {
    if (!isPlatformBrowser(this._PLATFORM_ID)) return;

    // Resize listener with debouncing
    let resizeTimeout: any;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.checkScreenSize();
        // Auto-close mobile menu on resize to desktop
        if (!this.isMobileView && this.isMobileMenuOpen) {
          this.closeMobileMenu();
        }
      }, 100);
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (event: Event) => {
      const target = event.target as HTMLElement;
      const navbar = target.closest('nav');
      const mobileMenu = target.closest('.mobile-drawer');

      if (!navbar && !mobileMenu && this.isMobileMenuOpen) {
        this.closeMobileMenu();
      }
    });

    // Close mobile menu on escape key
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Escape' && this.isMobileMenuOpen) {
        this.closeMobileMenu();
      }
    });
  }

  private checkScreenSize() {
    if (!isPlatformBrowser(this._PLATFORM_ID)) return;

    const width = window.innerWidth;

    // Mobile: < 768px, Tablet: 768px - 1023px, Desktop: >= 1024px
    this.isMobileView = width < 768;
    this.isTabletView = width >= 768 && width < 1024;

    // Force close mobile menu when switching to tablet/desktop
    if (!this.isMobileView && this.isMobileMenuOpen) {
      this.closeMobileMenu();
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (isPlatformBrowser(this._PLATFORM_ID)) {
      this.scrolled = window.pageYOffset > 10;
    }
  }

  toggleMobileMenu() {
    if (this.isMobileMenuOpen) {
      this.closeMobileMenu();
    } else {
      this.openMobileMenu();
    }
  }

  private openMobileMenu() {
    this.isMobileMenuOpen = true;
    if (isPlatformBrowser(this._PLATFORM_ID)) {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = this.getScrollbarWidth() + 'px';
    }
  }

  public closeMobileMenu() {
    this.isMobileMenuOpen = false;
    if (isPlatformBrowser(this._PLATFORM_ID)) {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
  }

  private getScrollbarWidth(): number {
    if (!isPlatformBrowser(this._PLATFORM_ID)) return 0;

    const scrollDiv = document.createElement('div');
    scrollDiv.style.cssText =
      'width: 100px; height: 100px; overflow: scroll; position: absolute; top: -9999px;';
    document.body.appendChild(scrollDiv);
    const scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
    document.body.removeChild(scrollDiv);
    return scrollbarWidth;
  }

  logout() {
    this._AuthApiService.logout().subscribe({
      next: () => {
        this.closeMobileMenu();
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Logout error', err);
      },
    });
  }

  closeProfileMenu() {
    this.profileOpen = false;
  }

  // Getter for responsive nav items
  get navItems() {
    return [
      { path: 'home', label: 'NAV.HOME', icon: 'fa-home' },
      { path: 'tournaments', label: 'NAV.TOURNAMENTS', icon: 'fa-trophy' },
      { path: 'marketplace', label: 'NAV.MARKETPLACE', icon: 'fa-store' },
      { path: 'events', label: 'NAV.EVENTS', icon: 'fa-calendar-check' },
      { path: 'timeline', label: 'TIMELINE.TITLE', icon: 'fa-stream' },
    ];
  }
}
