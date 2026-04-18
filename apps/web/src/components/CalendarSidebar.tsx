"use client";

import { useCalendarContext } from "./CalendarContext";

export function CalendarSidebar() {
  const { calendarSources, toggleVisibility } = useCalendarContext();

  return (
    <aside aria-label="Calendar sources">
      <ul>
        {calendarSources.map(({ provider, calendarId, name, visible }) => (
          <li key={`${provider}-${calendarId}`}>
            <label>
              <input
                type="checkbox"
                checked={visible}
                onChange={() => toggleVisibility(provider, calendarId)}
                aria-label={name}
              />
              {name}
            </label>
          </li>
        ))}
      </ul>
    </aside>
  );
}
