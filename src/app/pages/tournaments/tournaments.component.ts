import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  AfterViewInit,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  trigger,
  state,
  style,
  transition,
  animate,
  stagger,
  query,
} from '@angular/animations';
import { Router, RouterModule } from '@angular/router';
import { TournamentService } from '../../core/services/Tournaments/tournament.service';
import { TournamentsService } from '../../core/services/Tournaments/tournaments.service';
import {
  Tournament,
  TournamentStatus,
  TournamentListItem,
} from '../../core/interfaces/Tournaments/tournament.interface';
import { ITournaments } from '../../core/interfaces/Tournaments/itournaments';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-tournaments',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, RouterModule],
  templateUrl: './tournaments.component.html',
  animations: [
    trigger('heroAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('1000ms ease-out', style({ opacity: 1 })),
      ]),
    ]),
    trigger('cardAnimation', [
      transition('* => *', [
        query(
          ':enter',
          [
            style({ opacity: 0, transform: 'translateY(20px)' }),
            stagger(100, [
              animate(
                '500ms ease-out',
                style({ opacity: 1, transform: 'translateY(0)' })
              ),
            ]),
          ],
          { optional: true }
        ),
      ]),
    ]),
    trigger('tabAnimation', [
      transition('* => *', [
        style({ transform: 'translateX(-10px)', opacity: 0 }),
        animate(
          '300ms ease-out',
          style({ transform: 'translateX(0)', opacity: 1 })
        ),
      ]),
    ]),
  ],
})
export class TournamentsComponent implements OnInit, AfterViewInit {
  @ViewChild('cursorLight') cursorLight!: ElementRef;
  @ViewChild('heroSection') heroSection!: ElementRef;

  activeTab: 'upcoming' | 'ongoing' | 'past' = 'upcoming';
  searchQuery: string = '';
  sortBy: 'date' | 'prize' | 'players' = 'date';

  // Pagination properties
  currentPage = 1;
  itemsPerPage = 8;
  totalPages = 1;

  // Modal/Dialog state
  selectedTournament: Tournament | null = null;
  showJoinModal = false;
  showResultsModal = false;
  joinLoading = false;

  tournaments: ITournaments[] = [];
  loading = false;

  allFilteredTournaments: ITournaments[] = [];
  filteredTournaments: ITournaments[] = [];

  currentUserId: number | null = null;
  showCreateModal = false;

  constructor(
    private router: Router,
    private tournamentService: TournamentService,
    private tournamentsService: TournamentsService,
    private authService: AuthService
  ) {
    this.currentUserId = this.authService.getCurrentUserId();
  }

  ngOnInit() {
    this.loadTournaments();
    this.setupNotifications();
  }

  loadTournaments() {
    this.loading = true;
    this.tournamentsService.getTournaments().subscribe({
      next: (tournaments) => {
        this.tournaments = tournaments;
        this.filterTournaments();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading tournaments:', error);
        this.loading = false;
      },
    });
  }

  ngAfterViewInit() {
    this.initCursorEffect();
  }

  private matchesStatus(tournamentStatus: string, activeTab: string): boolean {
    switch (activeTab) {
      case 'upcoming':
        return (
          tournamentStatus === 'DRAFT' ||
          tournamentStatus === 'REGISTRATION_OPEN' ||
          tournamentStatus === 'REGISTRATION_CLOSED'
        );
      case 'ongoing':
        return tournamentStatus === 'IN_PROGRESS';
      case 'past':
        return (
          tournamentStatus === 'COMPLETED' || tournamentStatus === 'CANCELLED'
        );
      default:
        return false;
    }
  }

  formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  // Transform TournamentListItem to match legacy component interface
  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (this.cursorLight && this.heroSection) {
      const rect = this.heroSection.nativeElement.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      this.cursorLight.nativeElement.style.left = `${x}px`;
      this.cursorLight.nativeElement.style.top = `${y}px`;
    }
  }

  initCursorEffect() {
    if (this.cursorLight) {
      this.cursorLight.nativeElement.style.opacity = '1';
    }
  }

  setActiveTab(tab: 'upcoming' | 'ongoing' | 'past') {
    this.activeTab = tab;
    this.currentPage = 1; // Reset to first page when switching tabs
    this.filterTournaments();
  }

  filterTournaments() {
    this.allFilteredTournaments = this.tournaments.filter((t) => {
      const matchesTab = this.matchesStatus(t.status, this.activeTab);
      const matchesSearch =
        !this.searchQuery ||
        t.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        t.gameTitle.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });

    this.sortTournaments();
    this.updatePagination();
  }

  sortTournaments() {
    switch (this.sortBy) {
      case 'date':
        this.allFilteredTournaments.sort(
          (a, b) =>
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );
        break;
      case 'prize':
        this.allFilteredTournaments.sort((a, b) => b.prizePool - a.prizePool);
        break;
      case 'players':
        this.allFilteredTournaments.sort(
          (a, b) => b.currentParticipants - a.currentParticipants
        );
        break;
    }
  }

  updatePagination() {
    this.totalPages = Math.ceil(
      this.allFilteredTournaments.length / this.itemsPerPage
    );
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.filteredTournaments = this.allFilteredTournaments.slice(
      startIndex,
      endIndex
    );
  }

  loadMoreTournaments() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      const startIndex = (this.currentPage - 1) * this.itemsPerPage;
      const endIndex = startIndex + this.itemsPerPage;
      const newTournaments = this.allFilteredTournaments.slice(
        startIndex,
        endIndex
      );

      // Animate the addition of new tournaments
      setTimeout(() => {
        this.filteredTournaments = [
          ...this.filteredTournaments,
          ...newTournaments,
        ];
      }, 100);

      // Show success notification
      this.showNotification('More tournaments loaded!', 'success');
    } else {
      this.showNotification('No more tournaments to load', 'info');
    }
  }

  joinTournament(tournamentId: number) {
    const tournament = this.tournaments.find((t) => t.id === tournamentId);
    if (!tournament) return;

    if (!this.currentUserId) {
      this.showNotification('Please login to join tournaments', 'error');
      this.router.navigate(['/login']);
      return;
    }

    // Check if tournament is full
    if (tournament.currentParticipants >= tournament.maxParticipants) {
      this.showNotification('Tournament is full!', 'error');
      return;
    }

    // Check if registration deadline passed
    if (new Date() > new Date(tournament.registrationDeadline)) {
      this.showNotification('Registration deadline has passed!', 'error');
      return;
    }

    // Show joining animation
    this.joinLoading = true;
    this.selectedTournament = tournament as any;

    // Use the new tournaments service to register
    this.tournamentsService
      .registerForTournament(tournament.id, this.currentUserId)
      .subscribe({
        next: (response) => {
          // Update player count
          tournament.currentParticipants++;

          this.joinLoading = false;
          this.showNotification(
            `Successfully joined ${tournament.name}!`,
            'success'
          );

          // Refresh the tournaments list
          this.loadTournaments();
        },
        error: (error) => {
          console.error('Error joining tournament:', error);
          this.joinLoading = false;
          this.showNotification(
            error.error?.message ||
              'Failed to join tournament. Please try again.',
            'error'
          );
        },
      });
  }

  watchLive(tournament: any) {
    if (!tournament.streamUrl) {
      // If no stream URL, show upcoming streams or redirect to streaming platform
      this.showNotification('Stream will be available soon!', 'info');

      // Optional: Open a modal with stream schedule
      this.showStreamSchedule(tournament);
      return;
    }

    // Track view analytics
    this.trackStreamView(tournament.id);

    // Open stream in new window or embed in modal
    const streamWindow = window.open(
      tournament.streamUrl,
      '_blank',
      'width=1200,height=700'
    );

    if (!streamWindow) {
      // If popup blocked, show alternative
      this.showStreamModal(tournament);
    }

    this.showNotification(
      `Opening ${tournament.name} live stream...`,
      'success'
    );
  }

  viewResults(tournament: any) {
    if (tournament.status !== 'past') {
      this.showNotification('Results not available yet', 'info');
      return;
    }

    // Create results data
    const results = {
      tournament: tournament,
      winner: tournament.winnerName || 'Team Alpha',
      runnerUp: 'Team Beta',
      topPlayers: [
        {
          rank: 1,
          name: tournament.winnerName || 'Team Alpha',
          prize: tournament.prizePool * 0.5,
        },
        { rank: 2, name: 'Team Beta', prize: tournament.prizePool * 0.3 },
        { rank: 3, name: 'Team Gamma', prize: tournament.prizePool * 0.15 },
        { rank: 4, name: 'Team Delta', prize: tournament.prizePool * 0.05 },
      ],
      statistics: {
        totalMatches: 127,
        totalKills: 3542,
        viewerPeak: '125.3K',
        duration: '3 days',
      },
    };

    // Store in session for results page
    sessionStorage.setItem('tournamentResults', JSON.stringify(results));

    // Show results modal or navigate to results page
    this.showResultsModal = true;
    this.selectedTournament = tournament;

    // Optional: Navigate to dedicated results page
    // this.router.navigate(['/tournament/results', tournament.id]);

    this.showNotification(`Loading results for ${tournament.name}`, 'success');
  }

  getProgressPercentage(tournament: any): number {
    return Math.min(
      (tournament.currentParticipants / tournament.maxPlayers) * 100,
      100
    );
  }

  formatPrize(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  formatDisplayDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  }

  getTimeRemaining(date: Date | string): string {
    const now = new Date();
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    const diff = targetDate.getTime() - now.getTime();

    if (diff < 0) return 'Started';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  // Additional helper methods for functionality

  private showStreamSchedule(tournament: any) {
    // Create stream schedule data
    const schedule = {
      tournamentName: tournament.name,
      streams: [
        {
          date: new Date(tournament.startDate),
          time: '10:00 AM',
          stage: 'Opening Ceremony',
        },
        {
          date: new Date(tournament.startDate),
          time: '11:00 AM',
          stage: 'Group Stage A',
        },
        {
          date: new Date(tournament.startDate),
          time: '2:00 PM',
          stage: 'Group Stage B',
        },
        {
          date: new Date(new Date(tournament.startDate).getTime() + 86400000),
          time: '10:00 AM',
          stage: 'Quarterfinals',
        },
        {
          date: new Date(new Date(tournament.startDate).getTime() + 172800000),
          time: '2:00 PM',
          stage: 'Finals',
        },
      ],
    };

    // Show in console or implement modal
    console.log('Stream Schedule:', schedule);

    // You can implement a modal here to show the schedule
    alert(
      `Stream Schedule for ${tournament.name}:\n\n${schedule.streams
        .map(
          (s) => `${this.formatDisplayDate(s.date)} at ${s.time} - ${s.stage}`
        )
        .join('\n')}`
    );
  }

  private showStreamModal(tournament: any) {
    // Alternative stream viewing method when popup is blocked
    if (tournament.streamUrl) {
      // Create an embedded player or redirect
      const embedUrl = tournament.streamUrl
        .replace('twitch.tv', 'player.twitch.tv/?channel=')
        .replace('youtube.com/watch?v=', 'youtube.com/embed/');

      // Open in same tab as fallback
      window.location.href = tournament.streamUrl;
    }
  }

  private trackStreamView(tournamentId: string) {
    // Analytics tracking
    const views = JSON.parse(localStorage.getItem('streamViews') || '{}');
    views[tournamentId] = (views[tournamentId] || 0) + 1;
    localStorage.setItem('streamViews', JSON.stringify(views));

    console.log(`Tracking view for tournament ${tournamentId}`);
  }

  private showNotification(
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info'
  ) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-20 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transform transition-all duration-500 ${
      type === 'success'
        ? 'bg-green-500 text-white'
        : type === 'error'
        ? 'bg-red-500 text-white'
        : type === 'warning'
        ? 'bg-yellow-500 text-white'
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
        <span class="font-medium">${message}</span>
      </div>
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
      notification.style.opacity = '1';
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      notification.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 500);
    }, 3000);
  }

  private setupNotifications() {
    // Check for upcoming tournaments and notify
    const upcomingTournaments = this.tournaments.filter(
      (t) => t.status === 'upcoming'
    );

    upcomingTournaments.forEach((tournament) => {
      const timeUntilStart =
        new Date(tournament.startDate).getTime() - new Date().getTime();
      const oneDayInMs = 24 * 60 * 60 * 1000;

      // Notify if tournament starts within 24 hours
      if (timeUntilStart > 0 && timeUntilStart < oneDayInMs) {
        const hours = Math.floor(timeUntilStart / (60 * 60 * 1000));
        this.scheduleNotification(
          `${tournament.name} starts in ${hours} hours!`,
          'warning'
        );
      }
    });
  }

  private scheduleNotification(
    message: string,
    type: 'success' | 'error' | 'info' | 'warning'
  ) {
    // Schedule notification after component loads
    setTimeout(() => {
      this.showNotification(message, type);
    }, 2000);
  }

  // Export tournament data
  exportTournamentData(tournament: any) {
    const data = {
      tournament: tournament,
      exportDate: new Date(),
      participants: tournament.currentParticipants,
      status: tournament.status,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tournament_${tournament.id}_data.json`;
    link.click();

    this.showNotification('Tournament data exported successfully!', 'success');
  }

  // Share tournament
  shareTournament(tournament: any) {
    const shareData = {
      title: tournament.name,
      text: `Check out this ${
        tournament.game
      } tournament with a ${this.formatPrize(
        tournament.prizePool
      )} prize pool!`,
      url: `${window.location.origin}/tournament/${tournament.id}`,
    };

    if (navigator.share) {
      navigator
        .share(shareData)
        .then(() =>
          this.showNotification('Tournament shared successfully!', 'success')
        )
        .catch((err) => console.error('Error sharing:', err));
    } else {
      // Fallback: Copy to clipboard
      const shareText = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
      navigator.clipboard
        .writeText(shareText)
        .then(() =>
          this.showNotification(
            'Tournament link copied to clipboard!',
            'success'
          )
        )
        .catch((err) => console.error('Error copying:', err));
    }
  }

  // Add to calendar
  addToCalendar(tournament: any) {
    const startDate = new Date(tournament.startDate)
      .toISOString()
      .replace(/-|:|\.\d\d\d/g, '');
    const endDate = tournament.endDate
      ? new Date(tournament.endDate).toISOString().replace(/-|:|\.\d\d\d/g, '')
      : new Date(new Date(tournament.startDate).getTime() + 3600000)
          .toISOString()
          .replace(/-|:|\.\d\d\d/g, '');

    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      tournament.name
    )}&dates=${startDate}/${endDate}&details=${encodeURIComponent(
      tournament.description ||
        `${tournament.game} Tournament - Prize Pool: ${this.formatPrize(
          tournament.prizePool
        )}`
    )}`;

    window.open(calendarUrl, '_blank');
    this.showNotification('Opening calendar...', 'success');
  }

  // Refresh tournaments list
  refreshTournaments() {
    this.loadTournaments();
    this.showNotification('Tournaments refreshed!', 'success');
  }

  // Navigate to create tournament
  openCreateTournamentForm() {
    this.router.navigate(['/tournaments/create']);
  }

  // View tournament details
  viewTournamentDetails(tournamentId: number) {
    // Increment view count
    this.tournamentsService.incrementViewCount(tournamentId).subscribe({
      next: () => {
        this.router.navigate(['/tournaments', tournamentId]);
      },
      error: () => {
        // Navigate even if view count increment fails
        this.router.navigate(['/tournaments', tournamentId]);
      },
    });
  }

  // Edit tournament
  editTournament(tournamentId: number) {
    this.router.navigate(['/tournaments/edit', tournamentId]);
  }

  // Delete tournament
  deleteTournament(tournamentId: number) {
    const tournament = this.tournaments.find((t) => t.id === tournamentId);
    if (!tournament) return;

    if (
      !confirm(
        `Are you sure you want to delete "${tournament.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    this.tournamentsService.deleteTournament(tournamentId).subscribe({
      next: () => {
        this.showNotification('Tournament deleted successfully', 'success');
        this.loadTournaments();
      },
      error: (error) => {
        console.error('Error deleting tournament:', error);
        this.showNotification(
          error.error?.message || 'Failed to delete tournament',
          'error'
        );
      },
    });
  }

  // Check if user can edit/delete tournament
  canManageTournament(tournament: ITournaments): boolean {
    if (!this.currentUserId) return false;
    return tournament.organizer.id === this.currentUserId;
  }

  // Get participants for a tournament
  viewParticipants(tournamentId: number) {
    this.tournamentsService.getTournamentParticipants(tournamentId).subscribe({
      next: (participants) => {
        console.log('Tournament participants:', participants);
        // You can show participants in a modal or navigate to a participants page
        this.showNotification(
          `Loaded ${participants.length} participants`,
          'success'
        );
      },
      error: (error) => {
        console.error('Error loading participants:', error);
        this.showNotification('Failed to load participants', 'error');
      },
    });
  }

  // Check in to tournament
  checkInToTournament(tournamentId: number) {
    if (!this.currentUserId) {
      this.showNotification('Please login to check in', 'error');
      return;
    }

    this.tournamentsService
      .checkInParticipant(tournamentId, this.currentUserId)
      .subscribe({
        next: () => {
          this.showNotification('Successfully checked in!', 'success');
          this.loadTournaments();
        },
        error: (error) => {
          console.error('Error checking in:', error);
          this.showNotification(
            error.error?.message || 'Failed to check in',
            'error'
          );
        },
      });
  }

  // Submit match result
  submitResult(tournamentId: number, won: boolean) {
    if (!this.currentUserId) {
      this.showNotification('Please login to submit results', 'error');
      return;
    }

    this.tournamentsService
      .submitMatchResult(tournamentId, this.currentUserId, won)
      .subscribe({
        next: () => {
          this.showNotification('Match result submitted!', 'success');
          this.loadTournaments();
        },
        error: (error) => {
          console.error('Error submitting result:', error);
          this.showNotification(
            error.error?.message || 'Failed to submit result',
            'error'
          );
        },
      });
  }
}
