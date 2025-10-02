import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-auth-success',
  standalone: true,
  template: `
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"
        ></div>
        <p class="text-gray-600">Finishing sign-in...</p>
      </div>
    </div>
  `,
})
export class AuthSuccessComponent implements OnInit {
  _PLATFORM_ID = inject(PLATFORM_ID);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toastr = inject(ToastrService);

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const token = params['token'];
      if (token) {
        if (isPlatformBrowser(this._PLATFORM_ID)) {
          localStorage.setItem('auth_token', token);
        }
        this.toastr.success('Signed in successfully');
      } else {
        this.toastr.error('Missing token');
        // this.router.navigate(['/login']);
      }
    });
  }
}

