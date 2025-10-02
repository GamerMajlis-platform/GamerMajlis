import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { API_BASE_URL } from './api.config';
import {
  ApiResponse,
  CommentItem,
  PostItem,
  PagedResponse,
  ListQuery,
  SearchQuery,
} from '../interfaces/media-post.models';
import { Observable, catchError, throwError, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PostsService {
  private http = inject(HttpClient);
  private base = API_BASE_URL + '/posts';

  private authOptions(extra?: { params?: HttpParams }) {
    let headers: HttpHeaders | undefined;
    try {
      const token = localStorage.getItem('auth_token');
      if (token)
        headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    } catch {
      // ignore
    }
    return { ...(extra || {}), headers };
  }

  createPost(form: FormData): Observable<ApiResponse<PostItem>> {
    return this.http
      .post<ApiResponse<PostItem>>(this.base, form, this.authOptions())
      .pipe(catchError(this.handleError));
  }

  getPost(id: number): Observable<ApiResponse<PostItem>> {
    return this.http
      .get<ApiResponse<PostItem>>(`${this.base}/${id}`, this.authOptions())
      .pipe(catchError(this.handleError));
  }

  listPosts(q: ListQuery): Observable<PagedResponse<PostItem>> {
    let params = new HttpParams().set('page', q.page).set('size', q.size);
    if (q.gameCategory) params = params.set('gameCategory', q.gameCategory);
    if (q.type) params = params.set('type', q.type);
    if (q.visibility) params = params.set('visibility', q.visibility);
    if (q.myPosts != null) params = params.set('myPosts', q.myPosts);
    return this.http
      .get<PagedResponse<PostItem>>(this.base, this.authOptions({ params }))
      .pipe(catchError(this.handleError));
  }

  updatePost(
    id: number,
    form: FormData | Record<string, any>
  ): Observable<ApiResponse<PostItem>> {
    return this.http
      .put<ApiResponse<PostItem>>(
        `${this.base}/${id}`,
        form,
        this.authOptions()
      )
      .pipe(catchError(this.handleError));
  }

  deletePost(id: number): Observable<ApiResponse<unknown>> {
    return this.http
      .delete<ApiResponse<unknown>>(`${this.base}/${id}`, this.authOptions())
      .pipe(catchError(this.handleError));
  }

  toggleLike(id: number): Observable<ApiResponse<unknown>> {
    return this.http
      .post<ApiResponse<unknown>>(
        `${this.base}/${id}/like`,
        {},
        this.authOptions()
      )
      .pipe(catchError(this.handleError));
  }

  share(id: number): Observable<ApiResponse<unknown>> {
    return this.http
      .post<ApiResponse<unknown>>(
        `${this.base}/${id}/share`,
        {},
        this.authOptions()
      )
      .pipe(catchError(this.handleError));
  }

  addComment(
    postId: number,
    content: string
  ): Observable<ApiResponse<CommentItem>> {
    const form = new FormData();
    form.append('content', content);
    return this.http
      .post<ApiResponse<CommentItem>>(
        `${this.base}/${postId}/comments`,
        form,
        this.authOptions()
      )
      .pipe(catchError(this.handleError));
  }

  listComments(
    postId: number,
    page = 0,
    size = 20
  ): Observable<PagedResponse<CommentItem>> {
    let params = new HttpParams().set('page', page).set('size', size);
    return this.http
      .get<PagedResponse<CommentItem>>(
        `${this.base}/${postId}/comments`,
        this.authOptions({
          params,
        })
      )
      .pipe(catchError(this.handleError));
  }

  deleteComment(commentId: number): Observable<ApiResponse<unknown>> {
    return this.http
      .delete<ApiResponse<unknown>>(
        `${this.base}/comments/${commentId}`,
        this.authOptions()
      )
      .pipe(catchError(this.handleError));
  }

  searchPosts(q: SearchQuery): Observable<PagedResponse<PostItem>> {
    let params = new HttpParams()
      .set('query', q.query)
      .set('page', q.page)
      .set('size', q.size);
    if (q.gameCategory) params = params.set('gameCategory', q.gameCategory);
    return this.http
      .get<PagedResponse<PostItem>>(
        `${this.base}/search`,
        this.authOptions({
          params,
        })
      )
      .pipe(catchError(this.handleError));
  }

  trending(limit = 10): Observable<PagedResponse<PostItem>> {
    let params = new HttpParams().set('limit', limit);
    return this.http
      .get<PagedResponse<PostItem>>(
        `${this.base}/trending`,
        this.authOptions({
          params,
        })
      )
      .pipe(catchError(this.handleError));
  }

  private handleError(err: any) {
    // Could plug in a toast/telemetry service later
    console.error('PostsService error:', err);
    return throwError(() => err);
  }
}
