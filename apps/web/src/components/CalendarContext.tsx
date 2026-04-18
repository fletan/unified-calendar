"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { CalendarSource, Provider } from "@unified-calendar/domain";

interface CalendarContextValue {
  calendarSources: CalendarSource[];
  toggleVisibility: (provider: Provider, calendarId: string) => void;
}

const CalendarContext = createContext<CalendarContextValue | null>(null);

interface CalendarContextProviderProps {
  initialSources: CalendarSource[];
  children: ReactNode;
}

export function CalendarContextProvider({
  initialSources,
  children,
}: CalendarContextProviderProps) {
  const [calendarSources, setCalendarSources] = useState<CalendarSource[]>(
    initialSources.map((s) => ({ ...s, visible: true })),
  );

  const toggleVisibility = useCallback(
    (provider: Provider, calendarId: string) => {
      setCalendarSources((prev) =>
        prev.map((s) =>
          s.provider === provider && s.calendarId === calendarId
            ? { ...s, visible: !s.visible }
            : s,
        ),
      );
    },
    [],
  );

  return (
    <CalendarContext value={{ calendarSources, toggleVisibility }}>
      {children}
    </CalendarContext>
  );
}

export function useCalendarContext(): CalendarContextValue {
  const ctx = useContext(CalendarContext);
  if (!ctx) {
    throw new Error("useCalendarContext must be used inside CalendarContextProvider");
  }
  return ctx;
}
