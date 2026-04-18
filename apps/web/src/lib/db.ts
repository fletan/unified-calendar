import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL ?? "");

const init = sql`
  CREATE TABLE IF NOT EXISTS cached_events (
    id           BIGSERIAL PRIMARY KEY,
    user_id      TEXT        NOT NULL,
    provider     TEXT        NOT NULL CHECK (provider IN ('google', 'microsoft')),
    payload      JSONB       NOT NULL,
    fetched_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    window_start DATE        NOT NULL,
    window_end   DATE        NOT NULL,
    UNIQUE (user_id, provider)
  );
  CREATE INDEX IF NOT EXISTS idx_cached_events_lookup
    ON cached_events (user_id, provider);
`;

init.catch(() => {
  // Schema bootstrap runs once on module load; errors are non-fatal at import time
});

export { sql };

export const USER_ID = "default";
