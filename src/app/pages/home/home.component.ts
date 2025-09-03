import {
  Component,
  OnInit,
  HostListener,
  ElementRef,
  Renderer2,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  trigger,
  state,
  style,
  animate,
  transition,
  stagger,
  query,
} from '@angular/animations';

interface Tournament {
  id: number;
  name: string;
  game: string;
  prize: string;
  players: number;
  maxPlayers: number;
  startDate: string;
  image: string;
  entryFee: string;
  status: 'live' | 'upcoming' | 'ended';
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
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
export class HomeComponent implements OnInit, AfterViewInit {
  @ViewChild('heroSection', { static: false }) heroSection!: ElementRef;
  @ViewChild('cursorLight', { static: false }) cursorLight!: ElementRef;

  scrolled = false;

  tournaments: Tournament[] = [
    {
      id: 1,
      name: 'Ultimate Showdown 2024',
      game: 'Valorant',
      prize: '$10,000',
      players: 64,
      maxPlayers: 128,
      startDate: 'Dec 15, 2023',
      image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
      entryFee: '$25',
      status: 'live',
    },
    {
      id: 2,
      name: 'Battle Royale Cup',
      game: 'Fortnite',
      prize: '$5,000',
      players: 89,
      maxPlayers: 100,
      startDate: 'Dec 18, 2023',
      image:
        'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800',
      entryFee: '$15',
      status: 'upcoming',
    },
    {
      id: 3,
      name: 'Legends Championship',
      game: 'League of Legends',
      prize: '$15,000',
      players: 32,
      maxPlayers: 64,
      startDate: 'Dec 20, 2023',
      image:
        'https://images.unsplash.com/photo-1598121500053-01e1e7a1c0f1?w=800',
      entryFee: '$30',
      status: 'upcoming',
    },
  ];

  featuredGames = [
    {
      name: 'Valorant',
      image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400',
      players: '15M+',
    },
    {
      name: 'FIFA 24',
      image:
        'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400',
      players: '20M+',
    },
    {
      name: 'CS:GO 2',
      image:
        'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400',
      players: '25M+',
    },
    {
      name: 'Rocket League',
      image:
        'https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?w=400',
      players: '10M+',
    },
  ];

  stats = [
    { label: 'Active Players', value: '50K+', icon: '👥' },
    { label: 'Live Tournaments', value: '120', icon: '🏆' },
    { label: 'Total Prizes', value: '$500K', icon: '💰' },
    { label: 'Games Available', value: '25+', icon: '🎮' },
  ];

  constructor(private renderer: Renderer2) {}

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.scrolled = window.scrollY > 50;
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    // Initialize cursor effect after view is ready
    this.initializeCursorEffect();
  }

  private createRipple(x: number, y: number, container: HTMLElement): void {
    const ripple = this.renderer.createElement('div');
    this.renderer.addClass(ripple, 'ripple-effect');
    this.renderer.setStyle(ripple, 'left', `${x - 25}px`);
    this.renderer.setStyle(ripple, 'top', `${y - 25}px`);
    this.renderer.appendChild(container, ripple);

    // Remove ripple after animation
    setTimeout(() => {
      if (container.contains(ripple)) {
        this.renderer.removeChild(container, ripple);
      }
    }, 1000);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'live':
        return 'status-live';
      case 'upcoming':
        return 'status-upcoming';
      default:
        return 'status-ended';
    }
  }
  private createMouseTrail(x: number, y: number, container: HTMLElement): void {
    const trail = this.renderer.createElement('div');
    this.renderer.addClass(trail, 'mouse-trail');
    this.renderer.setStyle(trail, 'left', `${x - 3}px`);
    this.renderer.setStyle(trail, 'top', `${y - 3}px`);
    this.renderer.appendChild(container, trail);

    // Remove trail after animation
    setTimeout(() => {
      if (container.contains(trail)) {
        this.renderer.removeChild(container, trail);
      }
    }, 800);
  }

  private initializeCursorEffect(): void {
    if (this.heroSection && this.cursorLight) {
      const heroElement = this.heroSection.nativeElement;
      const cursorElement = this.cursorLight.nativeElement;
      let animationFrameId: number;

      heroElement.addEventListener('mousemove', (e: MouseEvent) => {
        // Cancel previous animation frame for smoother performance
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }

        animationFrameId = requestAnimationFrame(() => {
          const rect = heroElement.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          // Smoother cursor light position with easing
          this.renderer.setStyle(
            cursorElement,
            'transform',
            `translate3d(${x - 300}px, ${y - 300}px, 0)`
          );
          this.renderer.setStyle(cursorElement, 'opacity', '1');

          // Update CSS custom properties smoothly
          this.renderer.setStyle(heroElement, '--mouse-x', `${x}px`);
          this.renderer.setStyle(heroElement, '--mouse-y', `${y}px`);

          // Throttled effects for better performance
          this.throttledEffects(x, y, heroElement);
        });
      });

      heroElement.addEventListener('mouseenter', () => {
        this.renderer.setStyle(
          cursorElement,
          'transition',
          'opacity 0.4s ease-out'
        );
      });

      heroElement.addEventListener('mouseleave', () => {
        this.renderer.setStyle(cursorElement, 'opacity', '0');
        this.renderer.setStyle(
          cursorElement,
          'transition',
          'opacity 0.6s ease-out'
        );
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
      });
    }
  }

  // Throttled effects for smooth performance
  private throttledEffects = this.throttle(
    (x: number, y: number, container: HTMLElement) => {
      // Only create ripple occasionally for smoother experience
      if (Math.random() > 0.7) {
        this.createRipple(x, y, container);
      }

      // Create subtle mouse trail
      if (Math.random() > 0.8) {
        this.createMouseTrail(x, y, container);
      }
    },
    150
  ); // Increased throttle time for smoother experience

  // Improved throttle function
  private throttle(func: Function, limit: number) {
    let inThrottle: boolean;
    return (...args: any[]) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }
}
