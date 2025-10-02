import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
  trigger,
  state,
  style,
  animate,
  transition,
  stagger,
  query,
} from '@angular/animations';

import { AnimateDirective } from '../../shared/directives/animate.directive';
import { QuickStatsComponent } from '../../shared/components/quick-stats/quick-stats.component';
import {
  User,
  ProfileUpdateRequest,
  GamingStatistics,
  GamingPreferences,
  SocialLinks,
  PrivacySettings,
  ProfileSuggestion,
  ProfileSearchResult,
} from '../../core/interfaces/Profile/profile.interface';
import { ProfileService } from '../../core/services/Profile/profile.service';
import { API_BASE_URL } from '../../core/services/api.config';

@Component({
  selector: 'app-user-profile',
  imports: [
    CommonModule,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    AnimateDirective,
    QuickStatsComponent,
  ],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css',
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
export class UserProfileComponent implements OnInit {
  _PLATFORM_ID = inject(PLATFORM_ID);
  private profileService = inject(ProfileService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private platformId = inject(PLATFORM_ID);

  // Profile data
  currentUser = signal<User | null>(null);
  viewedUser = signal<User | null>(null);
  isOwnProfile = signal<boolean>(true);
  isLoading = signal<boolean>(false);
  isEditing = signal<boolean>(false);

  // Profile suggestions and search
  profileSuggestions = signal<ProfileSuggestion[]>([]);
  searchResults: ProfileSearchResult[] = [];
  searchQuery = signal<string>('');

  // Forms
  profileForm!: FormGroup;
  gamingStatsForm!: FormGroup;

  // File upload
  selectedFile: File | null = null;
  profilePicturePreview: string | null = null;

  // UI state
  activeTab = signal<'profile' | 'gaming' | 'privacy' | 'search'>('profile');
  showImageUpload = signal<boolean>(false);

  // Remember last non-edit tab so we can restore it after leaving edit mode
  private lastNonEditTab: 'profile' | 'gaming' | 'privacy' | 'search' =
    'profile';
  private readonly TAB_STORE_KEY = 'gm_profile_lastTab';

  // Derived / computed signals for cleaner template logic
  effectiveContentTab = computed(() => {
    // While editing we always show 'profile' content (edit form panel) regardless of lastNonEditTab
    return this.isEditing() ? 'profile' : this.activeTab();
  });

  anyFormDirty = computed(
    () => !!(this.profileForm?.dirty || this.gamingStatsForm?.dirty)
  );

  // Tab button configuration (used with @for in template)
  tabButtons: Array<{
    id: 'profile' | 'gaming' | 'privacy' | 'search' | 'edit';
    label: string;
    icon: string;
    type: 'tab' | 'edit';
    title: string;
  }> = [
    {
      id: 'profile',
      label: 'PROFILE_PAGE.TABS.OVERVIEW',
      icon: 'fa-user',
      type: 'tab',
      title: 'PROFILE_PAGE.TABS.OVERVIEW',
    },
    {
      id: 'edit',
      label: 'PROFILE_PAGE.TABS.EDIT',
      icon: 'fa-pen-to-square',
      type: 'edit',
      title: 'PROFILE_PAGE.HEADERS.EDIT_PROFILE',
    },
    {
      id: 'gaming',
      label: 'PROFILE_PAGE.TABS.STATS',
      icon: 'fa-chart-simple',
      type: 'tab',
      title: 'PROFILE_PAGE.HEADERS.GAMING_STATS',
    },
    {
      id: 'privacy',
      label: 'PROFILE_PAGE.TABS.PRIVACY',
      icon: 'fa-lock',
      type: 'tab',
      title: 'PROFILE_PAGE.HEADERS.PRIVACY_SETTINGS',
    },
    {
      id: 'search',
      label: 'PROFILE_PAGE.TABS.SEARCH',
      icon: 'fa-magnifying-glass',
      type: 'tab',
      title: 'PROFILE_PAGE.HEADERS.SEARCH_RESULTS',
    },
  ];

  // Shared class fragments for tab buttons
  tabBaseClass =
    'group relative overflow-hidden px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border backdrop-blur-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800';
  tabActiveClass =
    'bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-500 text-white border-teal-400 shadow-md shadow-teal-900/30';
  tabInactiveClass =
    'bg-slate-700/70 hover:bg-slate-600 text-slate-200 border-slate-600/60';

  ngOnInit() {
    this.initializeForms();
    this.loadProfile();
    this.loadProfileSuggestions();

    // Subscribe to route parameter changes to reload profile when navigating between users
    this.route.paramMap.subscribe((params) => {
      const userId = params.get('id');
      if (userId) {
        this.isOwnProfile.set(false);
        this.isEditing.set(false); // Exit edit mode when viewing another profile
        this.loadUserProfile(parseInt(userId));
      } else {
        this.isOwnProfile.set(true);
        this.loadMyProfile();
      }
    });

    if (isPlatformBrowser(this._PLATFORM_ID)) {
      const stored = localStorage.getItem(this.TAB_STORE_KEY) as
        | 'profile'
        | 'gaming'
        | 'privacy'
        | 'search'
        | null;
      if (
        stored &&
        ['profile', 'gaming', 'privacy', 'search'].includes(stored)
      ) {
        this.activeTab.set(stored);
        this.lastNonEditTab = stored;
      }
    }
  }

  initializeForms() {
    this.profileForm = this.fb.group({
      displayName: ['', [Validators.required, Validators.minLength(2)]],
      bio: ['', [Validators.maxLength(500)]],
      socialLinks: this.fb.group({
        twitter: [''],
        twitch: [''],
        youtube: [''],
        instagram: [''],
        discord: [''],
      }),
      gamingPreferences: this.fb.group({
        favoriteGames: [[]],
        preferredGameModes: [[]],
        playStyle: [''],
        skillLevel: ['INTERMEDIATE'],
      }),
      privacySettings: this.fb.group({
        profileVisible: [true],
        showEmail: [false],
        showGamingStats: [true],
        showSocialLinks: [true],
        allowDirectMessages: [true],
        showOnlineStatus: [true],
      }),
    });

    this.gamingStatsForm = this.fb.group({
      totalGames: [0, [Validators.min(0)]],
      winRate: [0, [Validators.min(0), Validators.max(100)]],
      favoriteMap: [''],
      totalWins: [0, [Validators.min(0)]],
      totalLosses: [0, [Validators.min(0)]],
      averageKDA: [0, [Validators.min(0)]],
      hoursPlayed: [0, [Validators.min(0)]],
    });
  }

  loadProfile() {
    this.isLoading.set(true);

    // Check if we're viewing a specific user profile from route params
    const userId = this.route.snapshot.paramMap.get('id');

    if (userId) {
      this.isOwnProfile.set(false);
      this.loadUserProfile(parseInt(userId));
    } else {
      this.isOwnProfile.set(true);
      this.loadMyProfile();
    }
  }

  loadMyProfile() {
    this.profileService.getMyProfile().subscribe({
      next: (response) => {
        if (response.success) {
          this.currentUser.set(response.user);
          this.viewedUser.set(response.user);
          this.populateProfileForm(response.user);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.showNotification('Error loading profile', 'error');
        this.isLoading.set(false);
      },
    });
  }

  loadUserProfile(userId: number) {
    this.profileService.getUserProfile(userId).subscribe({
      next: (response) => {
        if (response.success) {
          this.viewedUser.set(response.user);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading user profile:', error);
        this.showNotification('Error loading user profile', 'error');
        this.isLoading.set(false);
      },
    });

    // Also load current user's profile for comparison and own data
    if (!this.currentUser()) {
      this.profileService.getMyProfile().subscribe({
        next: (response) => {
          if (response.success) {
            this.currentUser.set(response.user);
          }
        },
        error: (error) => {
          console.error('Error loading current user profile:', error);
        },
      });
    }
  }

  populateProfileForm(user: User) {
    const gamingPrefs = this.profileService.parseGamingPreferences(
      user.gamingPreferences
    );
    const socialLinks = this.profileService.parseSocialLinks(user.socialLinks);
    const privacySettings = this.profileService.parsePrivacySettings(
      user.privacySettings
    );
    const gamingStats = this.profileService.parseGamingStatistics(
      user.gamingStatistics
    );

    this.profileForm.patchValue({
      displayName: user.displayName,
      bio: user.bio || '',
      socialLinks: socialLinks,
      gamingPreferences: gamingPrefs,
      privacySettings: privacySettings,
    });

    this.gamingStatsForm.patchValue(gamingStats);
  }

  updateProfile() {
    if (this.profileForm.valid) {
      this.isLoading.set(true);

      const formValue = this.profileForm.value;
      const updateRequest: ProfileUpdateRequest = {
        displayName: formValue.displayName,
        bio: formValue.bio,
        socialLinks: JSON.stringify(formValue.socialLinks),
        gamingPreferences: JSON.stringify(formValue.gamingPreferences),
        privacySettings: JSON.stringify(formValue.privacySettings),
      };

      this.profileService.updateProfile(updateRequest).subscribe({
        next: (response) => {
          if (response.success) {
            this.currentUser.set(response.user);
            this.viewedUser.set(response.user);
            this.isEditing.set(false);
            this.showNotification('Profile updated successfully', 'success');
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error updating profile:', error);
          this.showNotification('Error updating profile', 'error');
          this.isLoading.set(false);
        },
      });
    }
  }

  updateGamingStatistics() {
    if (this.gamingStatsForm.valid) {
      this.isLoading.set(true);

      const gamingStats: GamingStatistics = this.gamingStatsForm.value;

      this.profileService.updateGamingStatistics(gamingStats).subscribe({
        next: (response) => {
          if (response.success) {
            // Update the current user's gaming statistics
            const updatedUser = { ...this.currentUser()! };
            updatedUser.gamingStatistics = response.gamingStatistics;
            this.currentUser.set(updatedUser);
            this.viewedUser.set(updatedUser);

            this.showNotification(
              'Gaming statistics updated successfully',
              'success'
            );
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error updating gaming statistics:', error);
          this.showNotification('Error updating gaming statistics', 'error');
          this.isLoading.set(false);
        },
      });
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validate file type and size
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (!allowedTypes.includes(file.type)) {
        this.showNotification(
          'Please select a valid image file (JPG, PNG, GIF)',
          'error'
        );
        return;
      }

      if (file.size > maxSize) {
        this.showNotification('File size must be less than 10MB', 'error');
        return;
      }

      this.selectedFile = file;

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.profilePicturePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  uploadProfilePicture() {
    if (this.selectedFile) {
      this.isLoading.set(true);

      this.profileService.uploadProfilePicture(this.selectedFile).subscribe({
        next: (response) => {
          if (response.success) {
            // Update the current user's profile picture
            const updatedUser = { ...this.currentUser()! };
            updatedUser.profilePictureUrl = response.profilePictureUrl;
            this.currentUser.set(updatedUser);
            this.viewedUser.set(updatedUser);

            this.showImageUpload.set(false);
            this.selectedFile = null;
            this.profilePicturePreview = null;
            this.showNotification(
              'Profile picture updated successfully',
              'success'
            );
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error uploading profile picture:', error);
          this.showNotification('Error uploading profile picture', 'error');
          this.isLoading.set(false);
        },
      });
    }
  }

  removeProfilePicture() {
    this.isLoading.set(true);

    this.profileService.removeProfilePicture().subscribe({
      next: (response) => {
        if (response.success) {
          // Remove the profile picture from current user
          const updatedUser = { ...this.currentUser()! };
          updatedUser.profilePictureUrl = undefined;
          this.currentUser.set(updatedUser);
          this.viewedUser.set(updatedUser);

          this.showNotification(
            'Profile picture removed successfully',
            'success'
          );
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error removing profile picture:', error);
        this.showNotification('Error removing profile picture', 'error');
        this.isLoading.set(false);
      },
    });
  }

  searchProfiles() {
    const query = this.searchQuery();
    if (query.trim()) {
      this.isLoading.set(true);

      this.profileService.searchProfiles(query, 0, 20).subscribe({
        next: (response) => {
          if (response.success) {
            this.searchResults = response.profiles;
            for (let p of this.searchResults) {
              if (!p.profilePictureUrl) {
                p.profilePictureUrl = API_BASE_URL + p.profilePictureUrl;
              }
            }
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error searching profiles:', error);
          this.showNotification('Error searching profiles', 'error');
          this.isLoading.set(false);
        },
      });
    }
  }

  loadProfileSuggestions() {
    this.profileService.getProfileSuggestions(10).subscribe({
      next: (response) => {
        if (response.success) {
          this.profileSuggestions.set(response.suggestions);
        }
      },
      error: (error) => {
        console.error('Error loading profile suggestions:', error);
      },
    });
  }

  viewProfile(userId: number) {
    this.router.navigate(['/profile', userId]);
  }

  toggleEditMode() {
    // Toggle edit mode; ensure other transient UI (image modal) is closed
    const next = !this.isEditing();
    // Leaving edit mode: guard unsaved changes
    if (!next && this.anyFormDirty()) {
      const confirmLeave = window.confirm(
        'You have unsaved changes. Discard them and exit edit mode?'
      );
      if (!confirmLeave) return; // abort toggle
      // Reset form values to current user to clear dirty state
      if (this.currentUser()) {
        this.populateProfileForm(this.currentUser()!);
      }
    }
    this.isEditing.set(next);
    if (next) {
      this.lastNonEditTab = this.activeTab();
      this.activeTab.set('profile');
    } else {
      if (this.lastNonEditTab && this.lastNonEditTab !== 'profile') {
        const target = this.lastNonEditTab;
        this.activeTab.set(target);
        this.showNotification(
          `Restored ${this.labelForTab(target)} tab`,
          'info'
        );
      }
    }
    this.showImageUpload.set(false);
  }

  cancelEdit() {
    this.isEditing.set(false);
    // Repopulate form with original data
    if (this.currentUser()) {
      this.populateProfileForm(this.currentUser()!);
    }
  }

  setActiveTab(tab: 'profile' | 'gaming' | 'privacy' | 'search') {
    if (this.activeTab() === tab) return;
    // Guard leaving edit mode with dirty form
    if (this.isEditing() && this.anyFormDirty()) {
      const proceed = window.confirm(
        'You have unsaved changes. Switch tab and discard them?'
      );
      if (!proceed) return;
      if (this.currentUser()) {
        this.populateProfileForm(this.currentUser()!);
      }
    }
    this.activeTab.set(tab);
    // Leaving edit context when switching section
    if (this.isEditing()) {
      this.isEditing.set(false);
    }
    // Close image upload modal on navigation
    if (this.showImageUpload()) {
      this.showImageUpload.set(false);
    }
    this.lastNonEditTab = tab;
    localStorage.setItem(this.TAB_STORE_KEY, tab);
  }

  // Unified handler for tab buttons (with ripple effect)
  onTabButtonClick(
    btn: { id: string; type: 'tab' | 'edit' },
    _event: MouseEvent
  ) {
    if (btn.type === 'edit') {
      this.toggleEditMode();
    } else if (btn.id !== 'edit') {
      // Leaving edit mode when switching to any regular tab
      if (this.isEditing()) {
        if (this.anyFormDirty()) {
          const proceed = window.confirm(
            'You have unsaved changes. Switch tab and discard them?'
          );
          if (!proceed) return;
          if (this.currentUser()) this.populateProfileForm(this.currentUser()!);
        }
        this.isEditing.set(false);
      }
      this.lastNonEditTab = btn.id as
        | 'profile'
        | 'gaming'
        | 'privacy'
        | 'search';
      this.setActiveTab(btn.id as 'profile' | 'gaming' | 'privacy' | 'search');
    }
  }

  isTabActive(id: string): boolean {
    if (id === 'edit') return this.isEditing();
    // While editing we only highlight edit button
    if (this.isEditing()) return false;
    return this.activeTab() === id;
  }

  private labelForTab(
    tab: 'profile' | 'gaming' | 'privacy' | 'search'
  ): string {
    switch (tab) {
      case 'profile':
        return 'Overview';
      case 'gaming':
        return 'Stats';
      case 'privacy':
        return 'Privacy';
      case 'search':
        return 'Discover';
    }
  }

  private showNotification(
    message: string,
    type: 'success' | 'error' | 'info' = 'info'
  ) {
    // Only show notifications in the browser (not during SSR)
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-20 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transform transition-all duration-500 ${
      type === 'success'
        ? 'bg-green-500 text-white'
        : type === 'error'
        ? 'bg-red-500 text-white'
        : 'bg-blue-500 text-white'
    }`;

    notification.innerHTML = `
      <div class="flex items-center gap-3">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          ${
            type === 'success'
              ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>'
              : type === 'error'
              ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>'
              : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>'
          }
        </svg>
        <span>${message}</span>
      </div>
    `;

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  // Helper methods for template
  getProfilePicture(): string {
    const user = this.viewedUser();
    let BASEURL = 'http://localhost:8080/api';
    return BASEURL + user?.profilePictureUrl || '/images/user4.jpg';
  }

  getGamingPreferences(): GamingPreferences {
    const user = this.viewedUser();
    return this.profileService.parseGamingPreferences(user?.gamingPreferences);
  }

  getSocialLinks(): SocialLinks {
    const user = this.viewedUser();
    // console.log('User social links:', user?.socialLinks);
    return this.profileService.parseSocialLinks(user?.socialLinks);
  }

  getGamingStatistics(): GamingStatistics {
    const user = this.viewedUser();
    return this.profileService.parseGamingStatistics(user?.gamingStatistics);
  }

  getPrivacySettings(): PrivacySettings {
    const user = this.viewedUser();
    return this.profileService.parsePrivacySettings(user?.privacySettings);
  }

  hasRoles(): boolean {
    const user = this.viewedUser();
    return !!(user?.roles && user.roles.length > 0);
  }

  formatRole(role: string): string {
    return role
      .replace('_', ' ')
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }

  hasSocialLinks(): boolean {
    const socialLinks = this.getSocialLinks();
    return !!(
      socialLinks.twitter ||
      socialLinks.twitch ||
      socialLinks.youtube ||
      socialLinks.instagram ||
      socialLinks.discord
    );
  }

  // Extract a short handle/identifier from a full social URL for display.
  // Examples:
  // https://twitter.com/SomeUser -> SomeUser
  // https://www.youtube.com/@ChannelName -> @ChannelName
  // https://discord.gg/inviteCode -> inviteCode
  extractHandle(url?: string): string {
    if (!url) return '';
    try {
      const u = new URL(url);
      // Special handling for platforms with @ in pathname already
      if (/youtube\.com/i.test(u.hostname)) {
        // Return last segment or channel handle
        const seg = u.pathname.split('/').filter(Boolean).pop();
        return seg || u.hostname.replace('www.', '');
      }
      if (/instagram\.com|twitter\.com|x\.com|twitch\.tv/i.test(u.hostname)) {
        const seg = u.pathname.split('/').filter(Boolean)[0];
        return seg || u.hostname.replace('www.', '');
      }
      if (/discord\.gg|discord\.com/i.test(u.hostname)) {
        const parts = u.pathname.split('/').filter(Boolean);
        return parts.pop() || 'discord';
      }
      // Fallback: host without www
      return u.hostname.replace('www.', '');
    } catch {
      return url;
    }
  }
}
