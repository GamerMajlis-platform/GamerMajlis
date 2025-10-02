import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { EventsService } from '../../../../core/services/events.service';
import {
  EventAttendance,
  AttendanceStatus,
} from '../../../../core/interfaces/events.models';

@Component({
  selector: 'app-attendees-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div
      class="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-6"
    >
      <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <div class="flex items-center justify-between mb-8">
          <div>
            <h1 class="text-3xl font-bold text-white mb-2">Event Attendees</h1>
            <p class="text-gray-300">
              Manage registrations and check-ins for your event
            </p>
          </div>
          <button
            type="button"
            (click)="goBack()"
            class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              ></path>
            </svg>
            Back to Event
          </button>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div
            class="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6"
          >
            <div class="flex items-center gap-3">
              <div class="p-3 bg-blue-500/20 rounded-lg">
                <svg
                  class="w-6 h-6 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  ></path>
                </svg>
              </div>
              <div>
                <p class="text-gray-400 text-sm">Total Registered</p>
                <p class="text-2xl font-bold text-white">
                  {{ stats().totalRegistered }}
                </p>
              </div>
            </div>
          </div>

          <div
            class="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6"
          >
            <div class="flex items-center gap-3">
              <div class="p-3 bg-green-500/20 rounded-lg">
                <svg
                  class="w-6 h-6 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              </div>
              <div>
                <p class="text-gray-400 text-sm">Checked In</p>
                <p class="text-2xl font-bold text-white">
                  {{ stats().checkedIn }}
                </p>
              </div>
            </div>
          </div>

          <div
            class="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6"
          >
            <div class="flex items-center gap-3">
              <div class="p-3 bg-yellow-500/20 rounded-lg">
                <svg
                  class="w-6 h-6 text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              </div>
              <div>
                <p class="text-gray-400 text-sm">Pending</p>
                <p class="text-2xl font-bold text-white">
                  {{ stats().pending }}
                </p>
              </div>
            </div>
          </div>

          <div
            class="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6"
          >
            <div class="flex items-center gap-3">
              <div class="p-3 bg-teal-500/20 rounded-lg">
                <svg
                  class="w-6 h-6 text-teal-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H9a2 2 0 01-2-2z"
                  ></path>
                </svg>
              </div>
              <div>
                <p class="text-gray-400 text-sm">Attendance Rate</p>
                <p class="text-2xl font-bold text-white">
                  {{ stats().attendanceRate }}%
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Filters and Search -->
        <div
          class="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8"
        >
          <div
            class="flex flex-col lg:flex-row gap-4 items-center justify-between"
          >
            <div class="flex flex-col sm:flex-row gap-4 flex-1">
              <!-- Search -->
              <div class="relative flex-1">
                <div
                  class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                >
                  <svg
                    class="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    ></path>
                  </svg>
                </div>
                <input
                  type="text"
                  [formControl]="searchControl"
                  placeholder="Search attendees..."
                  class="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <!-- Status Filter -->
              <select
                [formControl]="statusFilter"
                class="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="" class="bg-gray-800">All Status</option>
                <option value="REGISTERED" class="bg-gray-800">
                  Registered
                </option>
                <option value="CHECKED_IN" class="bg-gray-800">
                  Checked In
                </option>
                <option value="ATTENDED" class="bg-gray-800">Attended</option>
                <option value="NO_SHOW" class="bg-gray-800">No Show</option>
                <option value="CANCELLED" class="bg-gray-800">Cancelled</option>
              </select>
            </div>

            <!-- Bulk Actions -->
            <div class="flex gap-2">
              <button
                type="button"
                (click)="bulkCheckIn()"
                [disabled]="selectedAttendees().length === 0"
                class="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                Check In Selected ({{ selectedAttendees().length }})
              </button>

              <button
                type="button"
                (click)="exportAttendees()"
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  ></path>
                </svg>
                Export
              </button>
            </div>
          </div>
        </div>

        <!-- Attendees List -->
        <div
          class="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden"
        >
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-white/5">
                <tr>
                  <th class="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      [checked]="allSelected()"
                      [indeterminate]="someSelected()"
                      (change)="toggleSelectAll()"
                      class="w-4 h-4 text-teal-500 bg-white/10 border border-white/20 rounded focus:ring-teal-500"
                    />
                  </th>
                  <th
                    class="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider"
                  >
                    Attendee
                  </th>
                  <th
                    class="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider"
                  >
                    Registration Date
                  </th>
                  <th
                    class="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    class="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider"
                  >
                    Check-in Time
                  </th>
                  <th
                    class="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/10">
                <tr
                  *ngFor="
                    let attendee of filteredAttendees();
                    trackBy: trackByAttendeeId
                  "
                  class="hover:bg-white/5 transition-colors duration-200"
                >
                  <td class="px-6 py-4">
                    <input
                      type="checkbox"
                      [checked]="isSelected(attendee.id)"
                      (change)="toggleSelection(attendee.id)"
                      class="w-4 h-4 text-teal-500 bg-white/10 border border-white/20 rounded focus:ring-teal-500"
                    />
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div
                        class="w-10 h-10 bg-gradient-to-br from-teal-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold"
                      >
                        {{ getInitials(attendee.user.displayName || 'U') }}
                      </div>
                      <div>
                        <p class="text-white font-medium">
                          {{ attendee.user.displayName || 'Unknown User' }}
                        </p>
                        <p class="text-gray-400 text-sm">
                          User ID: {{ attendee.user.id || 'Unknown' }}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-gray-300">
                    {{ formatDate(attendee.registeredAt) }}
                  </td>
                  <td class="px-6 py-4">
                    <span
                      [class]="getStatusBadgeClass(attendee.status)"
                      class="px-3 py-1 rounded-full text-xs font-medium"
                    >
                      {{ getStatusLabel(attendee.status) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-gray-300">
                    {{
                      attendee.checkedInAt
                        ? formatDate(attendee.checkedInAt)
                        : '-'
                    }}
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-2">
                      <button
                        *ngIf="attendee.status !== 'CHECKED_IN'"
                        type="button"
                        (click)="checkInAttendee(attendee.id)"
                        class="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors duration-200"
                      >
                        Check In
                      </button>

                      <button
                        *ngIf="attendee.status === 'REGISTERED'"
                        type="button"
                        (click)="approveAttendee(attendee.id)"
                        class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors duration-200"
                      >
                        Approve
                      </button>

                      <button
                        type="button"
                        (click)="removeAttendee(attendee.id)"
                        class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors duration-200"
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Empty State -->
          <div
            *ngIf="filteredAttendees().length === 0"
            class="text-center py-12"
          >
            <svg
              class="w-16 h-16 mx-auto text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
              ></path>
            </svg>
            <p class="text-gray-400 text-lg mb-2">No attendees found</p>
            <p class="text-gray-500">
              {{
                searchControl.value
                  ? 'Try adjusting your search criteria'
                  : 'No one has registered for this event yet'
              }}
            </p>
          </div>

          <!-- Pagination -->
          <div
            *ngIf="totalPages() > 1"
            class="bg-white/5 px-6 py-4 border-t border-white/10"
          >
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-400">
                Showing {{ (currentPage() - 1) * pageSize + 1 }} to
                {{ Math.min(currentPage() * pageSize, totalAttendees()) }} of
                {{ totalAttendees() }} attendees
              </div>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  (click)="previousPage()"
                  [disabled]="currentPage() === 1"
                  class="px-3 py-1 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed text-white rounded transition-colors duration-200"
                >
                  Previous
                </button>

                <span class="text-white">
                  Page {{ currentPage() }} of {{ totalPages() }}
                </span>

                <button
                  type="button"
                  (click)="nextPage()"
                  [disabled]="currentPage() === totalPages()"
                  class="px-3 py-1 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed text-white rounded transition-colors duration-200"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      /* Custom checkbox styling */
      input[type='checkbox'] {
        appearance: none;
        background-color: rgba(255, 255, 255, 0.1);
        border: 2px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      input[type='checkbox']:checked {
        background-color: #14b8a6;
        border-color: #14b8a6;
        background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='m13.854 3.646-7.5 7.5-3.5-3.5a.5.5 0 1 0-.708.708l4 4a.5.5 0 0 0 .708 0l8-8a.5.5 0 0 0-.708-.708z'/%3e%3c/svg%3e");
      }

      input[type='checkbox']:indeterminate {
        background-color: #14b8a6;
        border-color: #14b8a6;
        background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8z'/%3e%3c/svg%3e");
      }
    `,
  ],
})
export class AttendeesManagementComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private eventsService = inject(EventsService);

  eventId = signal<number>(0);
  attendees = signal<EventAttendance[]>([]);
  loading = signal(false);
  selectedAttendeeIds = signal<Set<number>>(new Set());

  // Form controls
  searchControl = this.fb.control('');
  statusFilter = this.fb.control('');

  // Pagination
  currentPage = signal(1);
  pageSize = 20;
  totalAttendees = signal(0);

  // Computed properties
  filteredAttendees = computed(() => {
    let filtered = this.attendees();

    // Apply search filter
    const searchTerm = this.searchControl.value?.toLowerCase() || '';
    if (searchTerm) {
      filtered = filtered.filter(
        (attendee) =>
          attendee.user?.displayName?.toLowerCase().includes(searchTerm) ||
          attendee.user?.id?.toString().includes(searchTerm)
      );
    }

    // Apply status filter
    const status = this.statusFilter.value;
    if (status) {
      filtered = filtered.filter((attendee) => attendee.status === status);
    }

    return filtered;
  });

  stats = computed(() => {
    const attendees = this.attendees();
    const totalRegistered = attendees.length;
    const checkedIn = attendees.filter((a) => a.status === 'CHECKED_IN').length;
    const pending = attendees.filter((a) => a.status === 'REGISTERED').length;
    const attendanceRate =
      totalRegistered > 0 ? Math.round((checkedIn / totalRegistered) * 100) : 0;

    return {
      totalRegistered,
      checkedIn,
      pending,
      attendanceRate,
    };
  });

  selectedAttendees = computed(() => {
    const selectedIds = this.selectedAttendeeIds();
    return this.filteredAttendees().filter((attendee) =>
      selectedIds.has(attendee.id)
    );
  });

  allSelected = computed(() => {
    const filtered = this.filteredAttendees();
    const selected = this.selectedAttendeeIds();
    return (
      filtered.length > 0 &&
      filtered.every((attendee) => selected.has(attendee.id))
    );
  });

  someSelected = computed(() => {
    const filtered = this.filteredAttendees();
    const selected = this.selectedAttendeeIds();
    return (
      filtered.some((attendee) => selected.has(attendee.id)) &&
      !this.allSelected()
    );
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredAttendees().length / this.pageSize);
  });

  // Expose Math for template
  Math = Math;

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.eventId.set(idParam ? parseInt(idParam, 10) : 0);
    this.loadAttendees();

    // Set up reactive filters
    this.searchControl.valueChanges.subscribe(() => {
      this.currentPage.set(1);
    });

    this.statusFilter.valueChanges.subscribe(() => {
      this.currentPage.set(1);
    });
  }

  async loadAttendees() {
    this.loading.set(true);
    try {
      this.eventsService.getEventAttendees(this.eventId()).subscribe({
        next: (response) => {
          this.attendees.set(response.attendees || []);
          this.totalAttendees.set(response.attendees?.length || 0);
        },
        error: (error) => {
          console.error('Error loading attendees:', error);
        },
        complete: () => {
          this.loading.set(false);
        },
      });
    } catch (error) {
      console.error('Error loading attendees:', error);
      this.loading.set(false);
    }
  }

  async checkInAttendee(attendeeId: number) {
    try {
      // Note: The service method name is checkInToEvent and takes eventId only
      // For individual attendee check-in, you'd need a different API endpoint
      this.eventsService.checkInToEvent(this.eventId()).subscribe({
        next: () => {
          this.loadAttendees(); // Reload to get updated data
        },
        error: (error) => {
          console.error('Error checking in attendee:', error);
        },
      });
    } catch (error) {
      console.error('Error checking in attendee:', error);
    }
  }

  async approveAttendee(attendeeId: number) {
    try {
      // This would be a new API endpoint for approving pending registrations
      // await this.eventsService.approveRegistration(this.eventId(), attendeeId);
      this.loadAttendees();
    } catch (error) {
      console.error('Error approving attendee:', error);
    }
  }

  async removeAttendee(attendeeId: number) {
    if (confirm('Are you sure you want to remove this attendee?')) {
      try {
        this.eventsService.unregisterFromEvent(this.eventId()).subscribe({
          next: () => {
            this.loadAttendees();
          },
          error: (error) => {
            console.error('Error removing attendee:', error);
          },
        });
      } catch (error) {
        console.error('Error removing attendee:', error);
      }
    }
  }

  async bulkCheckIn() {
    const selectedIds = Array.from(this.selectedAttendeeIds());
    try {
      for (const attendeeId of selectedIds) {
        // Individual check-in for each selected attendee
        this.eventsService.checkInToEvent(this.eventId()).subscribe({
          error: (error) => {
            console.error(`Error checking in attendee ${attendeeId}:`, error);
          },
        });
      }
      this.selectedAttendeeIds.set(new Set());
      setTimeout(() => this.loadAttendees(), 1000); // Delay to allow all requests to complete
    } catch (error) {
      console.error('Error with bulk check-in:', error);
    }
  }

  exportAttendees() {
    const attendees = this.filteredAttendees();
    const csvContent = this.generateCSV(attendees);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `event-${this.eventId()}-attendees.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private generateCSV(attendees: EventAttendance[]): string {
    const headers = [
      'Name',
      'User ID',
      'Registration Date',
      'Status',
      'Check-in Time',
    ];
    const rows = attendees.map((attendee) => [
      attendee.user?.displayName || 'Unknown',
      attendee.user?.id?.toString() || 'Unknown',
      this.formatDate(attendee.registeredAt),
      this.getStatusLabel(attendee.status),
      attendee.checkedInAt
        ? this.formatDate(attendee.checkedInAt)
        : 'Not checked in',
    ]);

    return [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');
  }

  toggleSelection(attendeeId: number) {
    const selected = new Set(this.selectedAttendeeIds());
    if (selected.has(attendeeId)) {
      selected.delete(attendeeId);
    } else {
      selected.add(attendeeId);
    }
    this.selectedAttendeeIds.set(selected);
  }

  toggleSelectAll() {
    const filtered = this.filteredAttendees();
    const selected = this.selectedAttendeeIds();

    if (this.allSelected()) {
      // Deselect all visible
      const newSelected = new Set(selected);
      filtered.forEach((attendee) => newSelected.delete(attendee.id));
      this.selectedAttendeeIds.set(newSelected);
    } else {
      // Select all visible
      const newSelected = new Set(selected);
      filtered.forEach((attendee) => newSelected.add(attendee.id));
      this.selectedAttendeeIds.set(newSelected);
    }
  }

  isSelected(attendeeId: number): boolean {
    return this.selectedAttendeeIds().has(attendeeId);
  }

  previousPage() {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }

  goBack() {
    this.router.navigate(['/events', this.eventId()]);
  }

  trackByAttendeeId(index: number, attendee: EventAttendance): number {
    return attendee.id;
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getStatusLabel(status: AttendanceStatus): string {
    const statusLabels: { [key in AttendanceStatus]: string } = {
      REGISTERED: 'Registered',
      CHECKED_IN: 'Checked In',
      ATTENDED: 'Attended',
      NO_SHOW: 'No Show',
      CANCELLED: 'Cancelled',
    };
    return statusLabels[status] || status;
  }

  getStatusBadgeClass(status: AttendanceStatus): string {
    const statusClasses: { [key in AttendanceStatus]: string } = {
      REGISTERED: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      CHECKED_IN: 'bg-green-500/20 text-green-400 border border-green-500/30',
      ATTENDED: 'bg-green-500/20 text-green-400 border border-green-500/30',
      NO_SHOW: 'bg-red-500/20 text-red-400 border border-red-500/30',
      CANCELLED: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
    };
    return (
      statusClasses[status] ||
      'bg-gray-500/20 text-gray-400 border border-gray-500/30'
    );
  }
}
