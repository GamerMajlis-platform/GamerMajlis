import {
  Directive,
  ElementRef,
  Input,
  HostListener,
  AfterViewInit,
  Renderer2,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Generic animation directive
 * Usage:
 *  <div appAnimate="fade-slide" animateTap="scale" />
 * Available entry animations: fade, fade-slide, fade-up, zoom-in, pop, stagger-parent (for parent container)
 * Available tap animations: scale, press, bounce
 */
@Directive({
  // Support both camelCase and lowercase attribute forms to satisfy custom linters/parsers
  selector: '[appAnimate],[appanimate]',
  standalone: true,
})
export class AnimateDirective implements AfterViewInit {
  // Primary (camelCase) inputs
  @Input('appAnimate') entry: string | undefined; // entry animation name
  @Input('appanimate') set entryLower(v: string | undefined) {
    if (v) this.entry = v;
  }

  @Input() animateTap: string | undefined; // tap animation name
  @Input('animatetap') set animateTapLower(v: string | undefined) {
    if (v) this.animateTap = v;
  }

  @Input() animateDelay: string | number | undefined; // optional delay (ms or css time)
  @Input('animatedelay') set animateDelayLower(v: any) {
    if (v !== undefined) this.animateDelay = v;
  }

  @Input() animateOnce: boolean = true; // if false will re-trigger on visibility
  @Input('animateonce') set animateOnceLower(v: any) {
    if (v !== undefined)
      this.animateOnce = v === '' || v === true || v === 'true';
  }

  @Input() animateThreshold: number = 0.15; // intersection threshold
  @Input('animatethreshold') set animateThresholdLower(v: any) {
    if (!isNaN(parseFloat(v))) this.animateThreshold = parseFloat(v);
  }

  private hasEntered = false;

  private isBrowser: boolean;
  constructor(
    private el: ElementRef<HTMLElement>,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngAfterViewInit(): void {
    // Prepare base class
    this.renderer.addClass(this.el.nativeElement, 'anim-pre');
    if (this.entry === 'stagger-parent') {
      this.renderer.addClass(this.el.nativeElement, 'anim-stagger-parent');
    }

    // Intersection observer for entry animations
    if (this.entry && this.isBrowser) {
      // If element already in view (e.g., SSR first paint) play immediately
      const playIfVisible = () => {
        const rect = this.el.nativeElement.getBoundingClientRect();
        const vh = window.innerHeight || document.documentElement.clientHeight;
        if (rect.top < vh && rect.bottom > 0) {
          this.playEntry();
          this.hasEntered = true;
          return true;
        }
        return false;
      };
      if (!playIfVisible()) {
        const io = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                if (!this.hasEntered || !this.animateOnce) {
                  this.playEntry();
                  if (this.animateOnce) this.hasEntered = true;
                }
              } else if (!this.animateOnce) {
                this.resetEntry();
              }
            });
          },
          { threshold: this.animateThreshold }
        );
        io.observe(this.el.nativeElement);
      }
    } else if (this.entry && !this.isBrowser) {
      // On server just add enter state for correct SSR HTML (no animation)
      this.playEntry();
    }
  }

  private playEntry() {
    const el = this.el.nativeElement;
    el.classList.add('anim-enter');
    if (this.entry) {
      el.classList.add('anim-' + this.entry);
    }
    if (this.animateDelay) {
      const delayValue =
        typeof this.animateDelay === 'number'
          ? `${this.animateDelay}ms`
          : this.animateDelay;
      el.style.animationDelay = delayValue as string;
    }
  }

  private resetEntry() {
    const el = this.el.nativeElement;
    el.classList.remove('anim-enter');
    if (this.entry) {
      el.classList.remove('anim-' + this.entry);
    }
  }

  @HostListener('pointerdown') onPointerDown() {
    if (!this.animateTap) return;
    const el = this.el.nativeElement;
    el.classList.add('tap-' + this.animateTap);
  }

  @HostListener('pointerup') @HostListener('pointerleave') onPointerRelease() {
    if (!this.animateTap) return;
    const el = this.el.nativeElement;
    // force reflow for retrigger
    el.classList.remove('tap-' + this.animateTap);
    void el.offsetWidth;
  }
}
