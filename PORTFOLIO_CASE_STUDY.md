# ShiftFlow — Product case study

## Challenge

A live production operation coordinates people across production, creative, support, and general operations. Spreadsheets are easy to start with but harder to keep consistent as scheduling grows: double-bookings, late leave requests, and uneven workloads cost time.

## Objective

Build a credible prototype of an internal workforce system from a product brief, not a design-only showcase. Prioritize quick time-to-demo and maintain clear guardrails on automated decisions.

## Implementation

1. Mapped users' core workflows: review coverage, manage staff, manage shifts, review leave, analyze workload.
2. Defined typed entities and deterministic seed data.
3. Built a pure scheduling engine that validates conflicts, availability, leave, weekly limits and 11-hour rest.
4. Implemented explainable staffing recommendations, ranking by role match and workload. Applied batch recommendations sequentially.
5. Built a responsive React/Tailwind dashboard and interactive forms for every workflow.
6. Added browser persistence, JSON import/export, CSV exports and charts.
7. Tested business rules with a dependency-light Node test suite and wrote a GitHub CI workflow.

## Validation strategy

- Pure functions are tested without needing a browser or AI model.
- State transitions are protected by the same `validateShift` policy called for manual and automatic assignments.
- Leave approvals require a clear schedule before confirmation.
- Human reviewers see recommended people, match quality and reasons before committing batch assignments.
- Validation must run again if this engine is ported into a multiuser backend; client-side checks alone are insufficient for real deployments.

## Impact / results

The sample workspace contains 10 team members, multi-department shifts and 4 intentional staffing gaps. The batch planner finds valid recommendations for all 4 gaps without violating the modeled rules. This is a demonstration result in fictional data, **not a claim about workplace productivity or live customers**.

## Honest scope

This is a client-only functional prototype using localStorage. No database, authentication, real staff synchronization, true HR/payroll compliance, or generative AI API is included. The smart planner is a deterministic algorithm; AI-assisted development techniques can be discussed separately from its runtime architecture.

## Interview talking points

- Explain *how you moved from a brief to a working product* without a rigid technical specification.
- Show *how you validated generated code* with deterministic tests, manual code inspection and input guardrails.
- Discuss an architectural upgrade path: a REST API, PostgreSQL, auth/RBAC, transactional writes, and human-approved AI natural-language operations.
- Show that you know where a quick prototype stops being production-safe.
