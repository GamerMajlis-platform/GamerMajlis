// import {
//   Directive,
//   ElementRef,
//   Input,
//   OnInit,
//   OnDestroy,
//   Renderer2,
// } from '@angular/core';

// export type AnimationType =
//   | 'fadeIn'
//   | 'fadeInUp'
//   | 'fadeInDown'
//   | 'fadeInLeft'
//   | 'fadeInRight'
//   | 'scaleIn'
//   | 'scaleInUp'
//   | 'slideInLeft'
//   | 'slideInRight'
//   | 'slideInUp'
//   | 'slideInDown'
//   | 'rotateIn'
//   | 'flipInX'
//   | 'flipInY'
//   | 'bounceIn';

// @Directive({
//   selector: '[appScrollAnimate]',
//   standalone: true,
// })
// export class ScrollAnimateDirective implements OnInit, OnDestroy {
//   @Input() appScrollAnimate: AnimationType = 'fadeInUp';
//   @Input() animationDelay: number = 0;
//   @Input() animationDuration: number = 600;
//   @Input() animationOffset: number = 100; // pixels from bottom of viewport
//   @Input() animationOnce: boolean = true; // animate only once

//   private observer!: IntersectionObserver;
//   private hasAnimated = false;

//   constructor(private element: ElementRef, private renderer: Renderer2) {}

//   ngOnInit() {
//     this.initializeElement();
//     this.createObserver();
//   }

//   ngOnDestroy() {
//     if (this.observer) {
//       this.observer.disconnect();
//     }
//   }

//   private initializeElement() {
//     // Set initial styles based on animation type
//     this.renderer.setStyle(this.element.nativeElement, 'opacity', '0');
//     this.renderer.setStyle(
//       this.element.nativeElement,
//       'transition',
//       `all ${this.animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`
//     );

//     // Apply initial transform based on animation type
//     const initialTransform = this.getInitialTransform();
//     if (initialTransform) {
//       this.renderer.setStyle(
//         this.element.nativeElement,
//         'transform',
//         initialTransform
//       );
//     }
//   }

//   private getInitialTransform(): string {
//     switch (this.appScrollAnimate) {
//       case 'fadeInUp':
//       case 'slideInUp':
//         return 'translateY(30px)';
//       case 'fadeInDown':
//       case 'slideInDown':
//         return 'translateY(-30px)';
//       case 'fadeInLeft':
//       case 'slideInLeft':
//         return 'translateX(-30px)';
//       case 'fadeInRight':
//       case 'slideInRight':
//         return 'translateX(30px)';
//       case 'scaleIn':
//         return 'scale(0.95)';
//       case 'scaleInUp':
//         return 'scale(0.95) translateY(20px)';
//       case 'rotateIn':
//         return 'rotate(-10deg) scale(0.95)';
//       case 'flipInX':
//         return 'rotateX(-90deg) scale(0.95)';
//       case 'flipInY':
//         return 'rotateY(-90deg) scale(0.95)';
//       case 'bounceIn':
//         return 'scale(0.3)';
//       default:
//         return '';
//     }
//   }

//   private createObserver() {
//     const options = {
//       root: null,
//       rootMargin: `0px 0px -${this.animationOffset}px 0px`,
//       threshold: 0.1,
//     };

//     this.observer = new IntersectionObserver((entries) => {
//       entries.forEach((entry) => {
//         if (entry.isIntersecting) {
//           if (!this.hasAnimated || !this.animationOnce) {
//             setTimeout(() => {
//               this.animateElement();
//             }, this.animationDelay);
//             this.hasAnimated = true;
//           }

//           if (this.animationOnce) {
//             this.observer.unobserve(entry.target);
//           }
//         } else if (!this.animationOnce) {
//           // Reset animation if animationOnce is false
//           this.resetElement();
//         }
//       });
//     }, options);

//     this.observer.observe(this.element.nativeElement);
//   }

//   private animateElement() {
//     this.renderer.setStyle(this.element.nativeElement, 'opacity', '1');
//     this.renderer.setStyle(
//       this.element.nativeElement,
//       'transform',
//       'translate(0) scale(1) rotate(0)'
//     );

//     // Add specific animation class for complex animations
//     if (this.appScrollAnimate === 'bounceIn') {
//       this.renderer.addClass(this.element.nativeElement, 'animate-bounce-in');
//     }

//     // Emit custom event when animation completes
//     setTimeout(() => {
//       this.element.nativeElement.dispatchEvent(
//         new CustomEvent('animationComplete')
//       );
//     }, this.animationDuration);
//   }

//   private resetElement() {
//     this.renderer.setStyle(this.element.nativeElement, 'opacity', '0');
//     const initialTransform = this.getInitialTransform();
//     if (initialTransform) {
//       this.renderer.setStyle(
//         this.element.nativeElement,
//         'transform',
//         initialTransform
//       );
//     }
//   }
// }
