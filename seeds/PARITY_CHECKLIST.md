# Seeder Parity Checklist

Comparison target: Laravel seeders in unione_backend/database/seeders.

## Completed parity items

- Seeder ordering matches Laravel DatabaseSeeder call order.
- Roles, university, admin user, and university admin logic mirrored.
- Faculty and department catalog mirrored with same codes/scopes/mandatory flags.
- Course insertion, department ownership links, shared links, and prerequisite matrix mirrored.
- Professor generation mirrored with dean/department-head role assignments.
- University vice presidents seeding mirrored by staff number selection.
- Employee generation mirrored with department-head assignment from first employee.
- Faculty admin and department admin scope assignment mirrored.
- Student volume, distribution, statuses, and profile generation mirrored.
- Academic terms mirrored including active term.
- Section generation mirrored with owner-department pool and faculty-level fallback.
- Enrollment generation mirrored including retrospective past-term statuses.
- Grade generation mirrored using completed/failed enrollments and grade scale.
- Announcement generation mirrored across university/faculty/department/section scopes.

## Runner and execution parity

- Added ordered runner script: src/scripts/run-seeders.js.
- Added npm script: seed:run.
- No migrations or seeders were executed by this agent.

## Remaining differences (intentional or practical)

- Randomized values are deterministic-leaning in some places but keep same data shape and scale.
- Carbon/Model-layer behavior in Laravel is represented directly through Knex inserts/updates.
- Seeder files include idempotency safeguards in places where practical for Node reruns.
