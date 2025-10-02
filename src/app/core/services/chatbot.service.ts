import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, interval, switchMap, takeWhile, map } from 'rxjs';
import { API_BASE_URL } from './api.config';

export interface ChatbotMessageRequest {
  message: string;
}

export interface ChatbotMessageResponse {
  id: string;
}

export interface ChatbotAnswerResponse {
  result: string;
  status: 'done' | 'processing' | 'error';
}

export interface ParsedChatbotResponse {
  answer: string;
}

@Injectable({
  providedIn: 'root',
})
export class ChatbotService {
  _HttpClient = inject(HttpClient);

  sendMessage(message: string): Observable<ChatbotMessageResponse> {
    const data: ChatbotMessageRequest = { message };
    return this._HttpClient.post<ChatbotMessageResponse>(
      `${API_BASE_URL}/ai/message`,
      data
    );
  }

  getAnswer(id: string): Observable<ChatbotAnswerResponse> {
    return this._HttpClient.get<ChatbotAnswerResponse>(
      `${API_BASE_URL}/ai/answer/${id}`
    );
  }

  // Combined method that sends message and polls for response
  sendMessageAndGetResponse(message: string): Observable<string> {
    return this.sendMessage(message).pipe(
      switchMap((response) =>
        interval(1000).pipe(
          // Poll every 1 second
          switchMap(() => this.getAnswer(response.id)),
          takeWhile((answer) => answer.status !== 'done', true), // Continue until done
          map((answer) => {
            if (answer.status === 'done') {
              try {
                const parsed: ParsedChatbotResponse = JSON.parse(answer.result);
                return parsed.answer;
              } catch (error) {
                console.error('Error parsing chatbot response:', error);
                return 'Sorry, I encountered an error processing your message.';
              }
            }
            return ''; // Return empty while processing
          })
        )
      )
    );
  }
}
