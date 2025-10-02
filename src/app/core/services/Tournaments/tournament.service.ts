import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import {
  Tournament,
  TournamentListItem,
  CreateTournamentRequest,
  UpdateTournamentRequest,
  TournamentParticipation,
  TournamentFilters,
} from '../../interfaces/Tournaments/tournament.interface';
// Note: Update this import path based on your project structure
// import { environment } from '../../../environments/environment';

// Temporary API URL - replace with actual environment configuration
const API_BASE_URL = 'http://localhost:8080';

@Injectable({
  providedIn: 'root',
})
export class TournamentService {
  private apiUrl = `${API_BASE_URL}/api/tournaments`;
  private tournamentsSubject = new BehaviorSubject<TournamentListItem[]>([]);
  public tournaments$ = this.tournamentsSubject.asObservable();

  constructor(private http: HttpClient) {}

  private auth(extra?: { params?: HttpParams }) {
    let headers: HttpHeaders | undefined;
    try {
      const token = localStorage.getItem('auth_token');
      if (token)
        headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    } catch {}
    return { ...(extra || {}), headers };
  }

  /**
   * Tournament Management APIs
   */

  // Create Tournament - API 74
  createTournament(
    tournament: CreateTournamentRequest
  ): Observable<Tournament> {
    return this.http
      .post<Tournament>(this.apiUrl, tournament, this.auth())
      .pipe(tap(() => this.refreshTournaments()));
  }

  // Get Tournament Details - API 75
  getTournamentById(id: number): Observable<Tournament> {
    return this.http
      .get<Tournament>(`${this.apiUrl}/${id}`, this.auth())
      .pipe(tap(() => this.incrementViewCount(id).subscribe()));
  }

  // Update Tournament - API 76
  updateTournament(
    id: number,
    updates: UpdateTournamentRequest
  ): Observable<Tournament> {
    return this.http
      .put<Tournament>(`${this.apiUrl}/${id}`, updates, this.auth())
      .pipe(tap(() => this.refreshTournaments()));
  }

  // Delete Tournament - API 77
  deleteTournament(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${id}`, this.auth())
      .pipe(tap(() => this.refreshTournaments()));
  }

  // Get All Tournaments - API 78
  getAllTournaments(
    filters?: TournamentFilters
  ): Observable<TournamentListItem[]> {
    let params = new HttpParams();

    if (filters) {
      if (filters.gameTitle)
        params = params.set('gameTitle', filters.gameTitle);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.organizerId)
        params = params.set('organizerId', filters.organizerId.toString());
      if (filters.search) params = params.set('search', filters.search);
      if (filters.minPrizePool)
        params = params.set('minPrizePool', filters.minPrizePool.toString());
      if (filters.maxPrizePool)
        params = params.set('maxPrizePool', filters.maxPrizePool.toString());
    }

    return this.http
      .get<TournamentListItem[]>(this.apiUrl, this.auth({ params }))
      .pipe(tap((tournaments) => this.tournamentsSubject.next(tournaments)));
  }

  // Get Tournaments by Organizer - API 79
  getTournamentsByOrganizer(
    organizerId: number
  ): Observable<TournamentListItem[]> {
    return this.http.get<TournamentListItem[]>(
      `${this.apiUrl}/organizer/${organizerId}`,
      this.auth()
    );
  }

  // Add Tournament Moderator - API 80
  addModerator(tournamentId: number, moderatorId: number): Observable<void> {
    const params = new HttpParams().set('moderatorId', moderatorId.toString());
    return this.http.post<void>(
      `${this.apiUrl}/${tournamentId}/moderators`,
      null,
      this.auth({ params })
    );
  }

  // Increment Tournament View Count - API 81
  incrementViewCount(tournamentId: number): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/${tournamentId}/view`,
      null,
      this.auth()
    );
  }

  /**
   * Tournament Participation APIs
   */

  // Register for Tournament - API 82
  registerParticipant(
    tournamentId: number,
    participantId: number
  ): Observable<TournamentParticipation> {
    const params = new HttpParams().set(
      'participantId',
      participantId.toString()
    );
    return this.http
      .post<TournamentParticipation>(
        `${this.apiUrl}/${tournamentId}/participants/register`,
        null,
        this.auth({ params })
      )
      .pipe(tap(() => this.refreshTournaments()));
  }

  // Check-in Participant - API 83
  checkInParticipant(
    tournamentId: number,
    participantId: number
  ): Observable<void> {
    const params = new HttpParams().set(
      'participantId',
      participantId.toString()
    );
    return this.http.post<void>(
      `${this.apiUrl}/${tournamentId}/participants/check-in`,
      null,
      this.auth({ params })
    );
  }

  // Disqualify Participant - API 84
  disqualifyParticipant(
    tournamentId: number,
    participantId: number,
    reason: string
  ): Observable<void> {
    const params = new HttpParams()
      .set('participantId', participantId.toString())
      .set('reason', reason);
    return this.http.post<void>(
      `${this.apiUrl}/${tournamentId}/participants/disqualify`,
      null,
      this.auth({ params })
    );
  }

  // Submit Match Result - API 85
  submitMatchResult(
    tournamentId: number,
    participantId: number,
    won: boolean
  ): Observable<void> {
    const params = new HttpParams()
      .set('participantId', participantId.toString())
      .set('won', won.toString());
    return this.http.post<void>(
      `${this.apiUrl}/${tournamentId}/participants/submit-result`,
      null,
      this.auth({ params })
    );
  }

  // Get Tournament Participants - API 86
  getTournamentParticipants(
    tournamentId: number
  ): Observable<TournamentParticipation[]> {
    return this.http.get<TournamentParticipation[]>(
      `${this.apiUrl}/${tournamentId}/participants`,
      this.auth()
    );
  }

  // Get Specific Participation Details - API 87
  getParticipationDetails(
    tournamentId: number,
    participantId: number
  ): Observable<TournamentParticipation> {
    return this.http.get<TournamentParticipation>(
      `${this.apiUrl}/${tournamentId}/participants/${participantId}`,
      this.auth()
    );
  }

  /**
   * Utility Methods
   */
  private refreshTournaments(): void {
    this.getAllTournaments().subscribe();
  }

  // Get tournaments by status
  getTournamentsByStatus(status: string): Observable<TournamentListItem[]> {
    return this.tournaments$.pipe(
      map((tournaments) => tournaments.filter((t) => t.status === status))
    );
  }

  // Search tournaments
  searchTournaments(query: string): Observable<TournamentListItem[]> {
    return this.getAllTournaments({ search: query });
  }

  // Get user's tournaments (as organizer)
  getMyTournaments(userId: number): Observable<TournamentListItem[]> {
    return this.getTournamentsByOrganizer(userId);
  }

  // Check if user can register for tournament
  canRegisterForTournament(tournament: Tournament): boolean {
    const now = new Date();
    const registrationDeadline = new Date(tournament.registrationDeadline);

    return (
      tournament.status === 'REGISTRATION_OPEN' &&
      tournament.currentParticipants < tournament.maxParticipants &&
      now < registrationDeadline
    );
  }

  // Get tournament status color
  getStatusColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      DRAFT: 'gray',
      REGISTRATION_OPEN: 'green',
      REGISTRATION_CLOSED: 'yellow',
      IN_PROGRESS: 'blue',
      COMPLETED: 'purple',
      CANCELLED: 'red',
    };
    return statusColors[status] || 'gray';
  }

  // Format prize pool with currency
  formatPrizePool(amount: number, currency: string): string {
    // Provide default currency if not specified
    const currencyCode = currency && currency.trim() !== '' ? currency : 'USD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  }

  // Calculate registration progress
  getRegistrationProgress(current: number, max: number): number {
    return Math.round((current / max) * 100);
  }
}
