import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { API_BASE_URL } from './api.config';
import {
  ApiResponse,
  MediaItem,
  PagedResponse,
  SearchQuery,
  ListQuery,
} from '../interfaces/media-post.models';
import { Observable, catchError, throwError, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MediaService {
  private http = inject(HttpClient);
  // Ensure trailing slash between base and resource (previously produced 'apimedia')
  private base = API_BASE_URL + '/media';

  private authOptions(extra?: { params?: HttpParams }) {
    let headers: HttpHeaders | undefined;
    try {
      const token = localStorage.getItem('auth_token');
      if (token)
        headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    } catch {
      // ignore (SSR or storage unavailable)
    }
    return { ...(extra || {}), headers };
  }

  uploadMedia(form: FormData): Observable<ApiResponse<MediaItem>> {
    return this.http
      .post<ApiResponse<MediaItem>>(
        this.base + '/upload',
        form,
        this.authOptions()
      )
      .pipe(catchError(this.handleError));
  }

  getMedia(id: number): Observable<ApiResponse<MediaItem>> {
    return this.http
      .get<ApiResponse<MediaItem>>(`${this.base}/${id}`, this.authOptions())
      .pipe(catchError(this.handleError));
  }

  listMedia(q: ListQuery): Observable<PagedResponse<MediaItem>> {
    let params = new HttpParams().set('page', q.page).set('size', q.size);
    if (q.category) params = params.set('category', q.category);
    if (q.type) params = params.set('type', q.type);
    if (q.visibility) params = params.set('visibility', q.visibility);
    if (q.myMedia != null) params = params.set('myMedia', q.myMedia);
    return this.http
      .get<PagedResponse<MediaItem>>(this.base, this.authOptions({ params }))
      .pipe(catchError(this.handleError));
  }

  updateMedia(
    id: number,
    form: FormData | Record<string, any>
  ): Observable<ApiResponse<MediaItem>> {
    return this.http
      .put<ApiResponse<MediaItem>>(
        `${this.base}/${id}`,
        form,
        this.authOptions()
      )
      .pipe(catchError(this.handleError));
  }

  deleteMedia(id: number): Observable<ApiResponse<unknown>> {
    return this.http
      .delete<ApiResponse<unknown>>(`${this.base}/${id}`, this.authOptions())
      .pipe(catchError(this.handleError));
  }

  incrementView(id: number): Observable<ApiResponse<unknown>> {
    return this.http
      .post<ApiResponse<unknown>>(
        `${this.base}/${id}/view`,
        {},
        this.authOptions()
      )
      .pipe(catchError(this.handleError));
  }

  searchMedia(q: SearchQuery): Observable<PagedResponse<MediaItem>> {
    let params = new HttpParams()
      .set('query', q.query)
      .set('page', q.page)
      .set('size', q.size);
    if (q.type) params = params.set('type', q.type);
    return this.http
      .get<PagedResponse<MediaItem>>(
        this.base + '/search',
        this.authOptions({
          params,
        })
      )
      .pipe(catchError(this.handleError));
  }

  trending(limit = 10, days = 7): Observable<PagedResponse<MediaItem>> {
    let params = new HttpParams().set('limit', limit).set('days', days);
    return this.http
      .get<PagedResponse<MediaItem>>(
        this.base + '/trending',
        this.authOptions({
          params,
        })
      )
      .pipe(catchError(this.handleError));
  }

  private handleError(err: any) {
    console.error('MediaService error:', err);
    return throwError(() => err);
  }
}
