"use client";

import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import type { UnifiedEvent } from "@unified-calendar/domain";
import { useCalendarContext } from "./CalendarContext";

interface WeekViewProps {
  events: UnifiedEvent[];
}

export function WeekView({ events }: WeekViewProps) {
  const { calendarSources } = useCalendarContext();

  const visibleEvents = events.filter((e) =>
    calendarSources.some(
      (s) =>
        s.provider === e.sourceProvider &&
        s.calendarId === e.sourceCalendarId &&
        s.visible,
    ),
  );

  const calendarEvents = visibleEvents.map((e) => ({
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
