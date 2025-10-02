import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { TournamentsService } from '../../core/services/Tournaments/tournaments.service';
import {
  CreateTournamentDto,
  UpdateTournamentDto,
  ITournaments,
} from '../../core/interfaces/Tournaments/itournaments';

@Component({
  selector: 'app-tournament-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslateModule],
  templateUrl: './tournament-form.component.html',
  styleUrls: ['./tournament-form.component.css'],
})
export class TournamentFormComponent implements OnInit, OnDestroy {
  tournamentForm!: FormGroup;
  loading = false;
  submitting = false;
  error: string | null = null;
  isEditMode = false;
  tournamentId: number | null = null;
  tournament: ITournaments | null = null;

  gameOptions = [
    { value: 'Valorant', label: 'Valorant' },
    { value: 'CS2', label: 'Counter-Strike 2' },
    { value: 'League of Legends', label: 'League of Legends' },
    { value: 'Dota 2', label: 'Dota 2' },
    { value: 'Fortnite', label: 'Fortnite' },
    { value: 'Apex Legends', label: 'Apex Legends' },
    { value: 'Overwatch 2', label: 'Overwatch 2' },
  ];

  tournamentTypes = [
    { value: 'ELIMINATION', label: 'Single Elimination' },
    { value: 'ROUND_ROBIN', label: 'Round Robin' },
    { value: 'SWISS', label: 'Swiss System' },
  ];

  statusOptions = [
    { value: 'DRAFT', label: 'Draft' },
    { value: 'REGISTRATION_OPEN', label: 'Registration Open' },
    { value: 'REGISTRATION_CLOSED', label: 'Registration Closed' },
  ];

  currencyOptions = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' },
    { value: 'EGP', label: 'EGP (ج.م)' },
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private tournamentService: TournamentsService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      if (params['id']) {
        this.isEditMode = true;
        this.tournamentId = +params['id'];
        this.loadTournament();
      }
    });

    // Set default dates
    if (!this.isEditMode) {
      this.setDefaultDates();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.tournamentForm = this.fb.group({
      name: [
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
      gameTitle: ['', Validators.required],
      gameMode: ['Competitive', Validators.required],
      tournamentType: ['ELIMINATION', Validators.required],
      maxParticipants: [
        16,
        [Validators.required, Validators.min(4), Validators.max(1024)],
      ],
      entryFee: [0, [Validators.required, Validators.min(0)]],
      prizePool: [0, [Validators.required, Validators.min(0)]],
      currency: ['USD', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      registrationDeadline: ['', Validators.required],
      rules: [
        'Standard competitive rules apply. No cheating, hacking, or unsportsmanlike conduct allowed.',
        [Validators.required, Validators.minLength(20)],
      ],
      status: ['DRAFT', Validators.required],
      isPublic: [true],
      requiresApproval: [false],
    });

    // Add custom validators
    this.tournamentForm.setValidators(this.dateValidator.bind(this));
  }

  private dateValidator(control: any): { [key: string]: any } | null {
    if (!control || !control.get) return null;
    const form = control as FormGroup;
    const startDate = new Date(form.get('startDate')?.value);
    const endDate = new Date(form.get('endDate')?.value);
    const registrationDeadline = new Date(
      form.get('registrationDeadline')?.value
    );
    const now = new Date();

    const errors: { [key: string]: any } = {};

    if (startDate <= now) {
      errors['startDatePast'] = true;
    }

    if (endDate <= startDate) {
      errors['endDateBeforeStart'] = true;
    }

    if (registrationDeadline >= startDate) {
      errors['registrationAfterStart'] = true;
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  private setDefaultDates(): void {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const weekAfter = new Date(nextWeek);
    weekAfter.setHours(weekAfter.getHours() + 8);

    this.tournamentForm.patchValue({
      registrationDeadline: this.formatDateForInput(nextWeek),
      startDate: this.formatDateForInput(nextWeek),
      endDate: this.formatDateForInput(weekAfter),
    });
  }

  private formatDateForInput(date: Date): string {
    return date.toISOString().slice(0, 16);
  }

  private loadTournament(): void {
    if (!this.tournamentId) return;

    this.loading = true;
    this.tournamentService
      .getTournamentById(this.tournamentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tournament: ITournaments) => {
          this.tournament = tournament;
          this.populateForm(tournament);
          this.loading = false;
        },
        error: (error: any) => {
          this.error = 'Failed to load tournament';
          this.loading = false;
          console.error('Error loading tournament:', error);
        },
      });
  }

  private populateForm(tournament: ITournaments): void {
    this.tournamentForm.patchValue({
      name: tournament.name,
      description: tournament.description,
      gameTitle: tournament.gameTitle,
      gameMode: tournament.gameMode,
      tournamentType: tournament.tournamentType,
      maxParticipants: tournament.maxParticipants,
      entryFee: tournament.entryFee,
      prizePool: tournament.prizePool,
      currency: tournament.currency,
      startDate: this.formatDateTimeForInput(tournament.startDate),
      endDate: this.formatDateTimeForInput(tournament.endDate),
      registrationDeadline: this.formatDateTimeForInput(
        tournament.registrationDeadline
      ),
      rules: tournament.rules,
      status: tournament.status,
      isPublic: tournament.isPublic,
      requiresApproval: tournament.requiresApproval,
    });
  }

  private formatDateTimeForInput(dateString: string): string {
    return new Date(dateString).toISOString().slice(0, 16);
  }

  onSubmit(): void {
    if (this.tournamentForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.submitting = true;
    this.error = null;

    const formData = this.tournamentForm.value;

    if (this.isEditMode && this.tournamentId) {
      this.updateTournament(formData);
    } else {
      this.createTournament(formData);
    }
  }

  private createTournament(formData: CreateTournamentDto): void {
    this.tournamentService
      .createTournament(formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tournament: ITournaments) => {
          this.submitting = false;
          this.router.navigate(['/tournaments', tournament.id]);
        },
        error: (error: any) => {
          this.error = 'Failed to create tournament';
          this.submitting = false;
          console.error('Error creating tournament:', error);
        },
      });
  }

  private updateTournament(formData: UpdateTournamentDto): void {
    if (!this.tournamentId) return;

    this.tournamentService
      .updateTournament(this.tournamentId, formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tournament: ITournaments) => {
          this.submitting = false;
          this.router.navigate(['/tournaments', tournament.id]);
        },
        error: (error: any) => {
          this.error = 'Failed to update tournament';
          this.submitting = false;
          console.error('Error updating tournament:', error);
        },
      });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.tournamentForm.controls).forEach((key) => {
      const control = this.tournamentForm.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.tournamentForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.tournamentForm.get(fieldName);
    if (!field || !field.errors) return '';

    const errors = field.errors;

    if (errors['required']) return `${fieldName} is required`;
    if (errors['minlength'])
      return `${fieldName} must be at least ${errors['minlength'].requiredLength} characters`;
    if (errors['maxlength'])
      return `${fieldName} must not exceed ${errors['maxlength'].requiredLength} characters`;
    if (errors['min'])
      return `${fieldName} must be at least ${errors['min'].min}`;
    if (errors['max'])
      return `${fieldName} must not exceed ${errors['max'].max}`;

    return '';
  }

  getFormError(): string {
    const formErrors = this.tournamentForm.errors;
    if (!formErrors) return '';

    if (formErrors['startDatePast']) return 'Start date must be in the future';
    if (formErrors['endDateBeforeStart'])
      return 'End date must be after start date';
    if (formErrors['registrationAfterStart'])
      return 'Registration deadline must be before start date';

    return '';
  }

  cancel(): void {
    if (this.isEditMode && this.tournamentId) {
      this.router.navigate(['/tournaments', this.tournamentId]);
    } else {
      this.router.navigate(['/tournaments']);
    }
  }

  onMaxParticipantsChange(): void {
    const maxParticipants = this.tournamentForm.get('maxParticipants')?.value;
    if (maxParticipants) {
      // Suggest common tournament bracket sizes
      const suggestions = [4, 8, 16, 32, 64, 128, 256, 512];
      const closest =
        suggestions.find((size) => size >= maxParticipants) || maxParticipants;

      if (closest !== maxParticipants) {
        // You could show a suggestion here
      }
    }
  }
}
