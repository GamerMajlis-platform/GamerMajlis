import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SignUpService {
  _HttpClient = inject(HttpClient);

  signUp(data: any):Observable<any> {
    return this._HttpClient.post('http://localhost:8080/api/auth/signup', data);
  }
}
