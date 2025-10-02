import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);

  private readonly storageKey = 'gm_language';
  private readonly supportedLanguages = ['en', 'ar'] as const;
  private readonly defaultLanguage: 'en' | 'ar' = 'en';

  private currentLanguageSubject = new BehaviorSubject<'en' | 'ar'>(
    this.defaultLanguage
  );
  currentLanguage$ = this.currentLanguageSubject.asObservable();

  constructor(private translate: TranslateService) {
    this.translate.addLangs([...this.supportedLanguages]);
    const saved = this.getSavedLanguage();
    const lang = this.isSupported(saved) ? saved : this.defaultLanguage;
    this.setLanguage(lang);
  }

  toggleLanguage(): void {
    const newLang = this.currentLanguageSubject.value === 'en' ? 'ar' : 'en';
    this.setLanguage(newLang);
  }

  setLanguage(lang: 'en' | 'ar'): void {
    if (!this.isSupported(lang)) return;
    this.translate.use(lang);
    this.currentLanguageSubject.next(lang);
    this.saveLanguage(lang);
    this.applyDirection(lang);
  }

  getCurrentLanguage(): 'en' | 'ar' {
    return this.currentLanguageSubject.value;
  }

  private isSupported(lang: string | null | undefined): lang is 'en' | 'ar' {
    return (
      !!lang && (this.supportedLanguages as readonly string[]).includes(lang)
    );
  }

  private getSavedLanguage(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    try {
      return localStorage.getItem(this.storageKey);
    } catch {
      return null;
    }
  }

  private saveLanguage(lang: 'en' | 'ar'): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      localStorage.setItem(this.storageKey, lang);
    } catch {}
  }

  private applyDirection(lang: 'en' | 'ar'): void {
    const html = this.document?.documentElement;
    if (!html) return;
    const isRtl = lang === 'ar';
    html.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    html.setAttribute('lang', lang);
  }
}
