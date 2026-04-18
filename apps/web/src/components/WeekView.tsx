"use client";

import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import type { UnifiedEvent } from "@unified-calendar/domain";

interface WeekViewProps {
  events: UnifiedEvent[];
}

export function WeekView({ events }: WeekViewProps) {
  const calendarEvents = events.map((e) => ({
    id: e.id,
    title: e.title,
    start: e.startIso,
    end: e.endIso,
    allDay: e.allDay,
    extendedProps: { sourceProvider: e.sourceProvider },
  }));

  return (
    <FullCalendar
      plugins={[timeGridPlugin]}
      initialView="timeGridWeek"
      events={calendarEvents}
      height="auto"
    />
  );
}
