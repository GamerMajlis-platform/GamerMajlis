import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_BASE_URL } from '../api.config';
import { Observable } from 'rxjs';
import {
  ITournaments,
  CreateTournamentDto,
  UpdateTournamentDto,
  TournamentParticipant,
  ParticipationDetails,
} from '../../interfaces/Tournaments/itournaments';

@Injectable({
  providedIn: 'root',
})
export class TournamentsService {
  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();
  }

  // Tournament CRUD Operations
  getTournaments(): Observable<ITournaments[]> {
    return this.http.get<ITournaments[]>(`${API_BASE_URL}/tournaments`, {
      headers: this.getAuthHeaders(),
    });
  }

  getTournamentById(id: number): Observable<ITournaments> {
    return this.http.get<ITournaments>(`${API_BASE_URL}/tournaments/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  createTournament(tournament: CreateTournamentDto): Observable<ITournaments> {
    return this.http.post<ITournaments>(
      `${API_BASE_URL}/tournaments`,
      tournament,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  updateTournament(
    id: number,
    tournament: UpdateTournamentDto
  ): Observable<ITournaments> {
    return this.http.put<ITournaments>(
      `${API_BASE_URL}/tournaments/${id}`,
      tournament,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  deleteTournament(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/tournaments/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  getTournamentsByOrganizer(organizerId: number): Observable<ITournaments[]> {
    return this.http.get<ITournaments[]>(
      `${API_BASE_URL}/tournaments/organizer/${organizerId}`,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  addModerator(tournamentId: number, moderatorId: number): Observable<void> {
    const params = new HttpParams().set('moderatorId', moderatorId.toString());
    return this.http.post<void>(
      `${API_BASE_URL}/tournaments/${tournamentId}/moderators`,
      null,
      {
        headers: this.getAuthHeaders(),
        params,
      }
    );
  }

  incrementViewCount(tournamentId: number): Observable<void> {
    return this.http.post<void>(
      `${API_BASE_URL}/tournaments/${tournamentId}/view`,
      null,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  // Participation APIs
  registerForTournament(
    tournamentId: number,
    participantId: number
  ): Observable<ParticipationDetails> {
    const params = new HttpParams().set(
      'participantId',
      participantId.toString()
    );
    return this.http.post<ParticipationDetails>(
      `${API_BASE_URL}/tournaments/${tournamentId}/participants/register`,
      null,
      {
        headers: this.getAuthHeaders(),
        params,
      }
    );
  }

  checkInParticipant(
    tournamentId: number,
    participantId: number
  ): Observable<void> {
    const params = new HttpParams().set(
      'participantId',
      participantId.toString()
    );
    return this.http.post<void>(
      `${API_BASE_URL}/tournaments/${tournamentId}/participants/check-in`,
      null,
      {
        headers: this.getAuthHeaders(),
        params,
      }
    );
  }

  disqualifyParticipant(
    tournamentId: number,
    participantId: number,
    reason: string
  ): Observable<void> {
    const params = new HttpParams()
      .set('participantId', participantId.toString())
      .set('reason', reason);
    return this.http.post<void>(
      `${API_BASE_URL}/tournaments/${tournamentId}/participants/disqualify`,
      null,
      {
        headers: this.getAuthHeaders(),
        params,
      }
    );
  }

  submitMatchResult(
    tournamentId: number,
    participantId: number,
    won: boolean
  ): Observable<void> {
    const params = new HttpParams()
      .set('participantId', participantId.toString())
      .set('won', won.toString());
    return this.http.post<void>(
      `${API_BASE_URL}/tournaments/${tournamentId}/participants/submit-result`,
      null,
      {
        headers: this.getAuthHeaders(),
        params,
      }
    );
  }

  getTournamentParticipants(
    tournamentId: number
  ): Observable<TournamentParticipant[]> {
    return this.http.get<TournamentParticipant[]>(
      `${API_BASE_URL}/tournaments/${tournamentId}/participants`,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  getParticipationDetails(
    tournamentId: number,
    participantId: number
  ): Observable<ParticipationDetails> {
    return this.http.get<ParticipationDetails>(
      `${API_BASE_URL}/tournaments/${tournamentId}/participants/${participantId}`,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }
}
