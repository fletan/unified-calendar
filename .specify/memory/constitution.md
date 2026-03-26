<!--
Sync Impact Report
- Version change: 1.0.0 -> 1.1.0
- Modified principles:
	- II. Testable Increments (NON-NEGOTIABLE) -> II. Testable Increments and Coverage Gate (NON-NEGOTIABLE)
- Added sections:
	- None
- Removed sections:
	- None
- Templates requiring updates:
	- ✅ updated: .specify/templates/plan-template.md
	- ✅ updated: .specify/templates/spec-template.md
	- ✅ updated: .specify/templates/tasks-template.md
	- ⚠ pending: .specify/templates/commands/*.md (directory not present; no files to update)
- Runtime guidance review:
	- ✅ checked: .github/agents/*.agent.md (no constitution-specific stale references found)
	- ⚠ pending: README.md (file not present)
	- ⚠ pending: docs/quickstart.md (file not present)
- Follow-up TODOs:
	- None
-->

# Unified Calendar Constitution

## Core Principles

### I. Spec-Driven Delivery

Every feature change MUST be backed by an approved specification in `spec.md` before
implementation begins. The spec MUST define prioritized user stories, measurable success
criteria, and explicit acceptance scenarios. Work that is not traceable to a requirement or
story MUST NOT be merged.

Rationale: specification-first delivery keeps scope intentional and prevents implicit or
unreviewed behavior changes.

### II. Testable Increments and Coverage Gate (NON-NEGOTIABLE)

Each user story MUST be independently implementable and independently verifiable. For
every story, tests MUST be created for the expected behavior and MUST fail before
implementation when tests are part of scope. A change MUST NOT be considered complete
unless story-level acceptance scenarios and regression checks pass.
Unit test coverage MUST be 100% for all production code paths, including frontend,
backend, and shared modules. Any pull request below 100% unit coverage MUST NOT be
merged.

Rationale: independent, testable increments preserve delivery velocity and reduce regression
risk.

### III. Security and Privacy by Default

Features handling credentials, personal data, or external integrations MUST document threat
considerations and data handling constraints in plan artifacts. Sensitive data MUST be
minimized, access-controlled, and excluded from logs by default. Security-impacting changes
MUST include explicit validation steps before release.

Rationale: the calendar domain routinely processes identity and schedule data; secure defaults
are mandatory, not optional hardening.

### IV. Observability and Operability

Production-relevant workflows MUST emit structured diagnostics that support incident
triage. Changes affecting integrations, synchronization logic, or background jobs MUST define
monitoring signals and failure handling behavior. New critical flows MUST include at least one
integration or contract-level verification path.

Rationale: synchronization systems fail at boundaries; observability and operability are the
only reliable safeguards for real-world reliability.

### V. Simplicity and Compatibility Discipline

Designs MUST prefer the simplest solution that satisfies current requirements. Breaking
changes to contracts, schemas, or public interfaces MUST be explicitly identified, justified,
and accompanied by a migration plan. Unnecessary abstractions and speculative extensions
MUST be rejected during review.

Rationale: simplicity reduces defect surface area while explicit compatibility discipline
protects downstream users.

## Operational Constraints

- Planning artifacts MUST state language/runtime version, primary dependencies, test
  strategy, and performance constraints before implementation.
- Any change that introduces new external services, credentials, or data stores MUST
  document operational ownership and rollback strategy.
- Pull requests MUST include traceability links to relevant `spec.md`, `plan.md`, and
  `tasks.md` artifacts.

## Delivery Workflow and Quality Gates

1. Specification approved before implementation.
2. Plan passes Constitution Check before research/design and again after design.
3. Tasks map work to user stories and identify parallel-safe execution.
4. Implementation proceeds incrementally by story priority (MVP first).
5. Before merge, reviewers MUST confirm constitution compliance, test evidence,
   compatibility impact, and operational readiness.
6. CI and local verification MUST show 100% unit test coverage, including frontend code,
   before merge.

## Governance

This constitution is authoritative for product and engineering workflow decisions in this
repository. In case of conflict, this document supersedes ad hoc practices.

Amendment process:

1. Propose changes in a pull request that includes rationale, affected principles/sections,
   and migration impact.
2. Obtain approval from at least one repository maintainer.
3. Update dependent templates and guidance files in the same change when applicable.

Versioning policy:

- MAJOR: incompatible governance or principle removals/redefinitions.
- MINOR: new principle/section or materially expanded guidance.
- PATCH: clarifications, wording improvements, and non-semantic edits.

Compliance review expectations:

- Every PR review MUST include an explicit constitution compliance check.
- Violations MUST be resolved before merge or recorded as a temporary exception with
  owner, expiry date, and follow-up issue.

**Version**: 1.1.0 | **Ratified**: 2026-03-26 | **Last Amended**: 2026-03-26
