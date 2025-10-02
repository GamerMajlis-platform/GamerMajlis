import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { TournamentService } from '../../core/services/Tournaments/tournament.service';
import {
  TournamentListItem,
  TournamentFilters,
} from '../../core/interfaces/Tournaments/tournament.interface';

@Component({
  selector: 'app-tournament-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule],
  templateUrl: './tournament-list.component.html',
  styleUrls: ['./tournament-list.component.css'],
})
export class TournamentListComponent implements OnInit, OnDestroy {
  tournaments: TournamentListItem[] = [];
  filteredTournaments: TournamentListItem[] = [];
  loading = false;
  error: string | null = null;

  // Filter properties
  searchQuery = '';
  selectedStatus = '';
  selectedGame = '';
  minPrizePool = 0;
  maxPrizePool = 10000;

  // Available filter options
  statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'REGISTRATION_OPEN', label: 'Registration Open' },
    { value: 'REGISTRATION_CLOSED', label: 'Registration Closed' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
  ];

  gameOptions = [
    { value: '', label: 'All Games' },
    { value: 'Valorant', label: 'Valorant' },
    { value: 'CS2', label: 'Counter-Strike 2' },
    { value: 'League of Legends', label: 'League of Legends' },
    { value: 'Dota 2', label: 'Dota 2' },
    { value: 'Fortnite', label: 'Fortnite' },
  ];

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(private tournamentService: TournamentService) {
    // Setup search debouncing
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((query) => {
        this.searchQuery = query;
        this.applyFilters();
      });
  }

  ngOnInit(): void {
    this.loadTournaments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTournaments(): void {
    this.loading = true;
    this.error = null;

    this.tournamentService
      .getAllTournaments()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tournaments) => {
          this.tournaments = tournaments;
          this.filteredTournaments = tournaments;
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Failed to load tournaments';
          this.loading = false;
          console.error('Error loading tournaments:', error);
        },
      });
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchSubject.next(target.value);
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.tournaments];

    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (tournament) =>
          tournament.name.toLowerCase().includes(query) ||
          tournament.gameTitle.toLowerCase().includes(query) ||
          tournament.organizer.displayName.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (this.selectedStatus) {
      filtered = filtered.filter(
        (tournament) => tournament.status === this.selectedStatus
      );
    }

    // Apply game filter
    if (this.selectedGame) {
      filtered = filtered.filter(
        (tournament) => tournament.gameTitle === this.selectedGame
      );
    }

    // Apply prize pool filter
    filtered = filtered.filter(
      (tournament) =>
        tournament.prizePool >= this.minPrizePool &&
        tournament.prizePool <= this.maxPrizePool
    );

    this.filteredTournaments = filtered;
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedStatus = '';
    this.selectedGame = '';
    this.minPrizePool = 0;
    this.maxPrizePool = 10000;
    this.filteredTournaments = [...this.tournaments];
  }

  getStatusColor(status: string): string {
    return this.tournamentService.getStatusColor(status);
  }

  getStatusText(status: string): string {
    const statusTexts: { [key: string]: string } = {
      DRAFT: 'Draft',
      REGISTRATION_OPEN: 'Open',
      REGISTRATION_CLOSED: 'Closed',
      IN_PROGRESS: 'Live',
      COMPLETED: 'Finished',
      CANCELLED: 'Cancelled',
    };
    return statusTexts[status] || status;
  }

  formatPrizePool(amount: number, currency: string): string {
    return this.tournamentService.formatPrizePool(amount, currency || 'USD');
  }

  getRegistrationProgress(current: number, max: number): number {
    return this.tournamentService.getRegistrationProgress(current, max);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  canRegister(tournament: TournamentListItem): boolean {
    const now = new Date();
    const startDate = new Date(tournament.startDate);

    return (
      tournament.status === 'REGISTRATION_OPEN' &&
      tournament.currentParticipants < tournament.maxParticipants &&
      now < startDate
    );
  }

  refresh(): void {
    this.loadTournaments();
  }

  trackByTournamentId(index: number, tournament: TournamentListItem): number {
    return tournament.id;
  }
}
