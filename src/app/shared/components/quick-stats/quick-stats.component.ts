import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

export interface QuickStatsData {
  totalGames?: number | null;
  winRate?: number | null; // percentage
  averageKDA?: number | null; // ratio
}

@Component({
  selector: 'gm-quick-stats',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div
      class="grid grid-cols-3 gap-3"
      role="group"
      aria-label="Quick gaming statistics"
    >
      <div
        class="px-3 py-2 rounded-xl bg-slate-700/40 text-[11px] flex flex-col gap-0.5 border border-slate-600"
        [attr.title]="'PROFILE_PAGE.FIELDS.TOTAL_GAMES' | translate"
        [attr.aria-label]="
          ('PROFILE_PAGE.FIELDS.TOTAL_GAMES' | translate) +
          ': ' +
          (stats?.totalGames ?? 0)
        "
      >
        <span class="flex items-center gap-1 text-cyan-300">
          <i class="fa-solid fa-gamepad"></i>
          {{ 'PROFILE_PAGE.FIELDS.TOTAL_GAMES' | translate }}
        </span>
        <span class="text-sm font-semibold" data-testid="totalGames">{{
          stats?.totalGames ?? 0
        }}</span>
      </div>
      <div
        class="px-3 py-2 rounded-xl bg-slate-700/40 text-[11px] flex flex-col gap-0.5 border border-slate-600"
        [attr.title]="'PROFILE_PAGE.FIELDS.WIN_RATE' | translate"
        [attr.aria-label]="
          ('PROFILE_PAGE.FIELDS.WIN_RATE' | translate) +
          ': ' +
          (stats?.winRate ?? 0) +
          '%'
        "
      >
        <span class="flex items-center gap-1 text-amber-300">
          <i class="fa-solid fa-trophy"></i>
          {{ 'PROFILE_PAGE.FIELDS.WIN_RATE' | translate }}
        </span>
        <span class="text-sm font-semibold" data-testid="winRate"
          >{{ stats?.winRate ?? 0 }}%</span
        >
      </div>
      <div
        class="px-3 py-2 rounded-xl bg-slate-700/40 text-[11px] flex flex-col gap-0.5 border border-slate-600"
        [attr.title]="'PROFILE_PAGE.FIELDS.AVERAGE_KDA' | translate"
        [attr.aria-label]="
          ('PROFILE_PAGE.FIELDS.AVERAGE_KDA' | translate) +
          ': ' +
          (stats?.averageKDA ?? 0) +
          ' KDA'
        "
      >
        <span class="flex items-center gap-1 text-fuchsia-300">
          <i class="fa-solid fa-chart-line"></i>
          {{ 'PROFILE_PAGE.FIELDS.AVERAGE_KDA' | translate }}
        </span>
        <span class="text-sm font-semibold" data-testid="averageKDA"
          >{{ stats?.averageKDA ?? 0 }} KDA</span
        >
      </div>
    </div>
  `,
})
export class QuickStatsComponent {
  @Input() stats: QuickStatsData | null = null;
}
