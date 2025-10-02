import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { TournamentService } from '../../core/services/Tournaments/tournament.service';
import { AuthService } from '../../core/services/auth.service';
import {
  Tournament,
  TournamentParticipation,
} from '../../core/interfaces/Tournaments/tournament.interface';

@Component({
  selector: 'app-tournament-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './tournament-detail.component.html',
  styleUrls: ['./tournament-detail.component.css'],
})
export class TournamentDetailComponent implements OnInit, OnDestroy {
  tournament: Tournament | null = null;
  participants: TournamentParticipation[] = [];
  loading = false;
  error: string | null = null;
  tournamentId!: number;
  currentUserId: number | null = null;
  userParticipation: TournamentParticipation | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tournamentService: TournamentService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.tournamentId = +params['id'];
      if (this.tournamentId) {
        this.loadTournamentDetails();
        this.loadParticipants();
      }
    });

    // Get current user
    this.currentUserId = this.authService.getCurrentUserId();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTournamentDetails(): void {
    this.loading = true;
    this.error = null;

    this.tournamentService
      .getTournamentById(this.tournamentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tournament) => {
          this.tournament = tournament;
          this.loading = false;
          this.checkUserParticipation();
        },
        error: (error) => {
          this.error = 'Failed to load tournament details';
          this.loading = false;
          console.error('Error loading tournament:', error);
        },
      });
  }

  loadParticipants(): void {
    this.tournamentService
      .getTournamentParticipants(this.tournamentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (participants) => {
          this.participants = participants;
          this.checkUserParticipation();
        },
        error: (error) => {
          console.error('Error loading participants:', error);
        },
      });
  }

  checkUserParticipation(): void {
    if (this.currentUserId && this.participants.length > 0) {
      this.userParticipation =
        this.participants.find(
          (p) => p.participant.id === this.currentUserId
        ) || null;
    }
  }

  registerForTournament(): void {
    if (!this.currentUserId || !this.tournament) return;

    this.tournamentService
      .registerParticipant(this.tournamentId, this.currentUserId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (participation) => {
          this.userParticipation = participation;
          this.loadParticipants(); // Refresh participants list
          this.loadTournamentDetails(); // Update tournament current participants count
        },
        error: (error) => {
          console.error('Error registering for tournament:', error);
          // Handle error (show toast, etc.)
        },
      });
  }

  checkIn(): void {
    if (!this.currentUserId) return;

    this.tournamentService
      .checkInParticipant(this.tournamentId, this.currentUserId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadParticipants(); // Refresh to show checked in status
        },
        error: (error) => {
          console.error('Error checking in:', error);
        },
      });
  }

  canRegister(): boolean {
    if (!this.tournament || this.userParticipation) return false;
    return this.tournamentService.canRegisterForTournament(this.tournament);
  }

  canCheckIn(): boolean {
    return (
      this.userParticipation !== null &&
      !this.userParticipation.checkedIn &&
      this.tournament?.status === 'REGISTRATION_CLOSED'
    );
  }

  isOrganizer(): boolean {
    return this.tournament?.organizer.id === this.currentUserId;
  }

  isModerator(): boolean {
    if (!this.tournament?.moderators || !this.currentUserId) return false;
    return this.tournament.moderators.some(
      (mod) => mod.id === this.currentUserId
    );
  }

  getStatusColor(status: string): string {
    return this.tournamentService.getStatusColor(status);
  }

  formatPrizePool(amount: number, currency: string): string {
    return this.tournamentService.formatPrizePool(amount, currency);
  }

  getRegistrationProgress(): number {
    if (!this.tournament) return 0;
    return this.tournamentService.getRegistrationProgress(
      this.tournament.currentParticipants,
      this.tournament.maxParticipants
    );
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  editTournament(): void {
    this.router.navigate(['/tournaments', this.tournamentId, 'edit']);
  }

  deleteTournament(): void {
    if (confirm('Are you sure you want to delete this tournament?')) {
      this.tournamentService
        .deleteTournament(this.tournamentId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.router.navigate(['/tournaments']);
          },
          error: (error) => {
            console.error('Error deleting tournament:', error);
          },
        });
    }
  }

  getParticipantsByStatus(status: string): TournamentParticipation[] {
    return this.participants.filter((p) => p.status === status);
  }

  getTournamentTypeText(type: string): string {
    const types: { [key: string]: string } = {
      ELIMINATION: 'Single Elimination',
      ROUND_ROBIN: 'Round Robin',
      SWISS: 'Swiss System',
    };
    return types[type] || type;
  }

  getRemainingTime(): string {
    if (!this.tournament) return '';

    const now = new Date();
    const startDate = new Date(this.tournament.startDate);
    const diff = startDate.getTime() - now.getTime();

    if (diff <= 0) return 'Started';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }
}
