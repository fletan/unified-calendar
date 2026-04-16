# Research Spike: Calendar Retrieval Strategy

## Goal

Determine the best approach to retrieve calendar events and details from Google and Microsoft
for a read-only unified calendar MVP.

## Key Question

Which approach provides the best balance of data quality, security, reliability, and setup
friction for this product scope?

## Candidate Approaches

| Option                 | Description                                                                 | Pros                                                                    | Cons                                                                                                                          | MVP Fit    |
| ---------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Official Provider APIs | Use Google Calendar API + Microsoft Graph Calendar APIs via delegated OAuth | Full event detail, robust filtering, clear auth model, vendor-supported | Requires two integrations and token lifecycle handling                                                                        | High       |
| Calendar Sharing Links | Use shared/public ICS or subscription links where available                 | Simpler ingestion for some calendars                                    | Often read-only but limited metadata, inconsistent availability, may require manual sharing setup, weaker permissions control | Medium-Low |
| Protocol-Level Access  | Use CalDAV/EWS style protocols                                              | Potentially broad interoperability                                      | High complexity, uneven provider support, deprecated/legacy concerns                                                          | Low        |
| Aggregator Platform    | Use a third-party unified calendar provider                                 | Faster initial integration path                                         | Vendor lock-in, added cost, external dependency risk, privacy/compliance review needed                                        | Medium     |

## Recommendation for This MVP

Use official provider APIs with delegated OAuth authentication.

Reasoning:

- It matches the existing requirement that only authentication scopes are requested for read-only access.
- It provides the richest and most reliable event details for unified rendering.
- It avoids fragile sharing-link assumptions and preserves future extensibility.

## Scope for the Spike

- Validate minimum read-only permissions for Google and Microsoft.
- Validate event fields required by the unified model:
  - event id, title/subject, start/end, timezone, all-day flag, organizer,
    attendees summary (if available), location, last updated timestamp,
    source calendar id/name.
- Validate pagination and time-range filtering behavior for both providers.
- Validate refresh behavior and token expiration handling.
- Validate error modes for revoked access and temporary provider outages.

## Out of Scope for the Spike

- Write operations (create/update/delete events).
- Bi-directional sync.
- Enterprise admin flows beyond standard user delegated authentication.

## Timebox

2 to 3 working days.

## Execution Plan

1. Build a minimal proof-of-concept for Google read-only event retrieval.
2. Build a minimal proof-of-concept for Microsoft read-only event retrieval.
3. Normalize both payloads into a single unified event shape.
4. Document edge-case behavior differences between providers.
5. Produce final decision note and implementation guardrails.

## Decision Criteria

- Completeness of required event details.
- Authentication complexity and user friction.
- Reliability under token refresh and provider errors.
- Ability to meet unified view performance target.
- Operational complexity and observability requirements.

## Deliverables

- Short decision record with chosen approach and rationale.
- Field mapping table (Google -> Unified, Microsoft -> Unified).
- List of required permissions for each provider.
- Risk list with mitigations.
- Recommended implementation sequence for the plan phase.

## Default Decision

Unless spike findings show a critical blocker, proceed with official provider APIs
as the implementation strategy.
