/**
 * Calendar Event Types and Definitions
 */

export type CalendarCategory = "activity" | "course" | "holiday" | "exam" | "custom";

export type CalendarStatus = "confirmed" | "tentative";

export interface CalendarEvent {
  id: string;
  semester: string; // e.g. "114-2", "115-1"
  title: string;
  category: CalendarCategory;
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  week?: number; // 1 ~ 18
  location?: string;
  courseId?: string; // Links to Courses sheet ID if available
  status: CalendarStatus; // "confirmed" | "tentative"
  createdBy?: string;
  updatedAt?: string;
}

export interface CreateCalendarEventDTO {
  semester: string;
  title: string;
  category: CalendarCategory;
  startDate: string;
  endDate?: string;
  week?: number;
  location?: string;
  courseId?: string;
  status?: CalendarStatus;
}

export interface UpdateCalendarEventDTO extends Partial<CreateCalendarEventDTO> {
  id: string;
}
