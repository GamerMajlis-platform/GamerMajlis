import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil, switchMap, of } from 'rxjs';

import { EventsService } from '../../../../core/services/events.service';
import {
  Event,
  EventType,
  LocationType,
  CreateEventRequest,
  UpdateEventRequest,
} from '../../../../core/interfaces/events.models';

@Component({
  selector: 'app-event-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './event-form.component.html',
  styleUrl: './event-form.component.css',
})
export class EventFormComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private eventsService = inject(EventsService);

  // State
  eventForm!: FormGroup;
  existingEvent = signal<Event | null>(null);
  loading = signal<boolean>(false);
  submitting = signal<boolean>(false);

  // Form options
  eventTypes: EventType[] = [
    'TOURNAMENT',
    'COMMUNITY_GATHERING',
    'WORKSHOP',
    'MEETUP',
  ];
  locationTypes: LocationType[] = ['VIRTUAL', 'PHYSICAL', 'HYBRID'];
  gameCategories = [
    'FPS',
    'MOBA',
    'RPG',
    'Strategy',
    'Sports',
    'Racing',
    'Puzzle',
    'Action',
  ];
  platforms = [
    'Discord',
    'Zoom',
    'Microsoft Teams',
    'Google Meet',
    'Twitch',
    'YouTube',
    'Steam',
    'Other',
  ];

  // Computed properties
  isEditMode = computed(() => this.existingEvent() !== null);
  pageTitle = computed(() =>
    this.isEditMode() ? 'Edit Event' : 'Create New Event'
  );
  submitButtonText = computed(() =>
    this.isEditMode() ? 'Update Event' : 'Create Event'
  );

  showVirtualFields = computed(() => {
    const locationType = this.eventForm?.get('locationType')?.value;
    return locationType === 'online' || locationType === 'hybrid';
  });

  showPhysicalFields = computed(() => {
    const locationType = this.eventForm?.get('locationType')?.value;
    return locationType === 'physical' || locationType === 'hybrid';
  });

  // Method aliases for template compatibility
  showPhysicalLocation = this.showPhysicalFields;
  showOnlineLocation = this.showVirtualFields;
  isSubmitting = this.submitting;

  ngOnInit(): void {
    this.initializeForm();
    this.checkForEditMode();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.eventForm = this.fb.group({
      // Basic Information
      title: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(100),
        ],
      ],
      description: [
        '',
        [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(1000),
        ],
      ],
      type: ['tournament', Validators.required], // Event type
      locationType: ['online', Validators.required], // Location type

      // Date & Time
      startDate: ['', Validators.required],
      endDate: [''], // End date - optional

      // Location Details
      address: [''], // Physical address
      city: [''], // City
      country: [''], // Country
      platform: ['Discord'], // Online platform - set default value
      meetingLink: [''], // Meeting link - remove pattern for now

      // Registration Settings
      maxAttendees: ['', [Validators.min(1), Validators.max(10000)]],
      registrationDeadline: [''],
      requiresApproval: [false],

      // Game Information
      gameTitle: [''],
      gameMode: [''],
      skillLevel: [''],
      entryFee: ['', [Validators.min(0), Validators.max(999999)]],
      prizePool: [''],

      // Additional Information
      rules: [''],
      requirements: [''],
      contactInfo: [''],
    });

    // Watch for location type changes to update validators
    this.eventForm
      .get('locationType')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((locationType) => {
        this.updateLocationValidators(locationType);
      });

    // Initialize validators for default location type
    this.updateLocationValidators('online');
  }

  private checkForEditMode(): void {
    this.route.params
      .pipe(
        switchMap((params) => {
          const eventId = params['id'];
          if (eventId && eventId !== 'create') {
            this.loading.set(true);
            return this.eventsService.getEventById(+eventId);
          }
          return of(null);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          if (response) {
            this.existingEvent.set(response.event);
            this.populateForm(response.event);
          }
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading event for edit:', error);
          this.loading.set(false);
          this.router.navigate(['/events']);
        },
      });
  }

  private populateForm(event: Event): void {
    // Convert date strings to the format required by datetime-local input
    const startDate = new Date(event.startDateTime).toISOString().slice(0, 16);
    const endDate = event.endDateTime
      ? new Date(event.endDateTime).toISOString().slice(0, 16)
      : '';
    const registrationDeadline = event.registrationDeadline
      ? new Date(event.registrationDeadline).toISOString().slice(0, 16)
      : '';

    this.eventForm.patchValue({
      title: event.title,
      description: event.description,
      startDate,
      endDate,
      type: event.eventType,
      locationType: event.locationType,
      platform: event.virtualPlatform || '',
      meetingLink: event.virtualLink || '',
      address: event.physicalAddress || '',
      city: '', // Would need to extract from address if available
      country: '', // Would need to extract from address if available
      maxAttendees: event.maxAttendees || '',
      registrationDeadline,
      requiresApproval: event.requiresRegistration || false,
      gameTitle: event.gameTitle || '',
      gameMode: '', // Not in original Event interface
      skillLevel: '', // Not in original Event interface
      entryFee: event.entryFee || '',
      prizePool: '', // Not in original Event interface
      rules: '', // Not in original Event interface
      requirements: event.registrationRequirements || '',
      contactInfo: '', // Not in original Event interface
    });
  }

  private updateLocationValidators(locationType: string): void {
    const platformControl = this.eventForm.get('platform');
    const meetingLinkControl = this.eventForm.get('meetingLink');
    const addressControl = this.eventForm.get('address');
    const cityControl = this.eventForm.get('city');
    const countryControl = this.eventForm.get('country');

    // Reset validators
    platformControl?.clearValidators();
    meetingLinkControl?.clearValidators();
    addressControl?.clearValidators();
    cityControl?.clearValidators();
    countryControl?.clearValidators();

    // Add required validators based on location type
    if (locationType === 'online' || locationType === 'hybrid') {
      platformControl?.setValidators([Validators.required]);
    }

    if (locationType === 'physical' || locationType === 'hybrid') {
      addressControl?.setValidators([Validators.required]);
      cityControl?.setValidators([Validators.required]);
      countryControl?.setValidators([Validators.required]);
    }

    // Update validation
    platformControl?.updateValueAndValidity();
    meetingLinkControl?.updateValueAndValidity();
    addressControl?.updateValueAndValidity();
    cityControl?.updateValueAndValidity();
    countryControl?.updateValueAndValidity();
  }

  private updateRegistrationValidators(requiresRegistration: boolean): void {
    const registrationDeadlineControl = this.eventForm.get(
      'registrationDeadline'
    );

    if (requiresRegistration) {
      registrationDeadlineControl?.setValidators([Validators.required]);
    } else {
      registrationDeadlineControl?.clearValidators();
    }

    registrationDeadlineControl?.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.eventForm.invalid || this.submitting()) return;

    this.submitting.set(true);
    const formData = this.prepareFormData();

    // Debug: Log the form data being sent
    console.log('Prepared form data:', formData);
    console.log('Raw form value:', this.eventForm.value);

    const request$ = this.isEditMode()
      ? this.eventsService.updateEvent(
          this.existingEvent()!.id,
          formData as UpdateEventRequest
        )
      : this.eventsService.createEvent(formData as CreateEventRequest);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        console.log('Event saved successfully:', response);
        this.submitting.set(false);

        // Check if response has the expected structure
        if (response && response.success !== false) {
          // Navigate to events list instead of specific event since response structure is unclear
          this.router.navigate(['/events']);
        } else {
          // Handle the case where success is false
          console.error('Server returned error:', response.message);
          // Handle error (show toast, etc.)
        }
      },
      error: (error) => {
        console.error('Error saving event:', error);
        this.submitting.set(false);
        // Handle error (show toast, etc.)
      },
    });
  }

  private prepareFormData(): CreateEventRequest | UpdateEventRequest {
    const formValue = this.eventForm.value;

    // Convert datetime-local strings back to ISO format with proper validation
    const startDate = new Date(formValue.startDate);
    const data: any = {
      title: formValue.title,
      description: formValue.description,
      startDateTime: this.formatDateToISO(formValue.startDate),
      eventType: formValue.type,
      locationType: formValue.locationType,
      requiresRegistration: formValue.requiresApproval,
      isPublic: true, // Default value since not in form
      competitive: true, // Default value since not in form
    };

    // Add optional fields only if they have values
    if (formValue.endDate) {
      data.endDateTime = this.formatDateToISO(formValue.endDate);
    }
    if (formValue.meetingLink) data.virtualLink = formValue.meetingLink;
    if (formValue.platform) data.virtualPlatform = formValue.platform;
    if (formValue.address) data.physicalAddress = formValue.address;
    if (formValue.city && formValue.country) {
      data.physicalVenue = `${formValue.city}, ${formValue.country}`;
    }
    if (formValue.maxAttendees)
      data.maxAttendees = parseInt(formValue.maxAttendees);
    if (formValue.registrationDeadline) {
      data.registrationDeadline = this.formatDateToISO(
        formValue.registrationDeadline
      );
    }
    if (formValue.requirements)
      data.registrationRequirements = formValue.requirements;
    if (formValue.gameTitle) data.gameTitle = formValue.gameTitle;
    // gameCategory not in template, using default or derive from gameTitle
    if (formValue.entryFee) data.entryFee = parseFloat(formValue.entryFee);
    // ageRestriction not in template, using default

    return data;
  }

  // Helper method to format dates consistently
  private formatDateToISO(dateString: string): string {
    if (!dateString) return '';

    // Create date object from the datetime-local format
    const date = new Date(dateString);

    // Ensure the date is valid
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date format: ${dateString}`);
    }

    // Return ISO string without milliseconds and timezone as expected by server
    // Format: YYYY-MM-DDTHH:mm:ss
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }

  onCancel(): void {
    if (this.isEditMode()) {
      this.router.navigate(['/events', this.existingEvent()!.id]);
    } else {
      this.router.navigate(['/events']);
    }
  }

  // Helper methods for template
  getFieldError(fieldName: string): string {
    const field = this.eventForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['minlength']) return `${fieldName} is too short`;
      if (field.errors['maxlength']) return `${fieldName} is too long`;
      if (field.errors['min']) return `${fieldName} minimum value not met`;
      if (field.errors['max']) return `${fieldName} maximum value exceeded`;
      if (field.errors['pattern']) return `${fieldName} format is invalid`;
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.eventForm.get(fieldName);
    return !!(field?.errors && field.touched);
  }

  isFieldValid(fieldName: string): boolean {
    const field = this.eventForm.get(fieldName);
    return !!(field?.valid && field.touched);
  }

  // Set minimum date for datetime inputs
  getMinDateTime(): string {
    return new Date().toISOString().slice(0, 16);
  }

  // Set minimum registration deadline based on start date
  getMinRegistrationDeadline(): string {
    const startDate = this.eventForm.get('startDate')?.value;
    if (startDate) {
      // Registration deadline should be at least 1 hour before event start
      const minDeadline = new Date(startDate);
      minDeadline.setHours(minDeadline.getHours() - 1);
      return minDeadline.toISOString().slice(0, 16);
    }
    return this.getMinDateTime();
  }

  // Debug method to check form validity
  getFormErrors(): any {
    const errors: any = {};
    Object.keys(this.eventForm.controls).forEach((key) => {
      const control = this.eventForm.get(key);
      if (control && control.invalid) {
        errors[key] = control.errors;
      }
    });
    return errors;
  }

  // Debug method for template
  debugForm(): void {
    console.log('Form Valid:', this.eventForm.valid);
    console.log('Form Errors:', this.getFormErrors());
    console.log('Form Value:', this.eventForm.value);
  }

  // Navigation method
  goBack(): void {
    if (this.isEditMode()) {
      this.router.navigate(['/events', this.route.snapshot.paramMap.get('id')]);
    } else {
      this.router.navigate(['/events']);
    }
  }
}
