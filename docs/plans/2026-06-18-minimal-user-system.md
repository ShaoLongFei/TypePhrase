# Minimal User System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a minimal username/phone/password user system so learned/mastered state has a stable owner.

**Architecture:** The API owns authentication through username/phone/password and an httpOnly session cookie. Course content stays publicly readable, while user-specific state such as mastered elements requires a logged-in user. Membership/founder features are removed.

**Tech Stack:** NestJS, Drizzle ORM, PostgreSQL, Nuxt/Vue, Pinia, Vitest/Jest.

---

### Task 1: Backend Auth And Session

**Files:**

- Modify: `packages/schema/src/schema/user.ts`
- Create: `packages/schema/src/schema/session.ts`
- Modify: `packages/schema/src/schema/index.ts`
- Create/modify: `apps/api/src/auth/*`
- Modify: `apps/api/src/guards/auth.guard.ts`
- Modify: `apps/api/src/app/app.module.ts`
- Test: `apps/api/src/auth/tests/auth.service.spec.ts`

**Steps:**

1. Write failing service tests for register, duplicate phone rejection, login success, login failure, and session lookup.
2. Add schema fields for `users.username`, `users.phone`, `users.passwordHash`, and a `sessions` table.
3. Implement password hashing and verification with a project dependency already available or a minimal added dependency.
4. Implement `/auth/register`, `/auth/login`, `/auth/logout`, and `/auth/me`.
5. Use an httpOnly `typephrase_session` cookie and set `request.userId` in `AuthGuard`.

### Task 2: Mastered Elements

**Files:**

- Modify: `apps/api/src/mastered-element/*`
- Modify: `apps/api/src/course/course.service.ts`
- Modify: `apps/api/src/course-pack/course-pack.controller.ts`
- Test: `apps/api/src/mastered-element/tests/mastered-element.service.spec.ts`

**Steps:**

1. Write failing tests for adding, listing, removing, and enriching course statements with `isMastered`.
2. Re-enable `MasteredElementModule`.
3. Require auth for write/list/remove mastered endpoints.
4. Let course fetch accept an optional user and return `isMastered` per statement.

### Task 3: Remove Memberships

**Files:**

- Delete: `apps/api/src/membership/*`
- Delete: `packages/schema/src/schema/membership.ts`
- Modify: `packages/schema/src/schema/index.ts`
- Modify: `apps/api/src/guards/course-packs-access.guard.ts`
- Modify: `apps/client/components/MembershipBadge.vue`
- Test: affected API/client tests

**Steps:**

1. Remove membership imports, modules, services, guards, and UI.
2. Remove founder/member access logic; course packs remain publicly readable.
3. Add/adjust tests to prove public access does not depend on membership.

### Task 4: Client Login And Mastered UI

**Files:**

- Create/modify: `apps/client/api/auth.ts`
- Modify: `apps/client/store/user.ts`
- Modify: `apps/client/api/course.ts`
- Modify: relevant navbar/course UI components
- Test: relevant client tests

**Steps:**

1. Write failing tests for auth API/store behavior where practical.
2. Add register/login/logout/current-user calls using credentials-included requests.
3. Add a compact login/register UI.
4. Connect the mastered action/filter to the backend.

### Task 5: Database Migration And Deployment

**Files:**

- Add Drizzle migration files under `packages/db/drizzle/`
- Modify docs as needed.

**Steps:**

1. Generate or write migrations for `sessions`, users fields, and dropping `memberships`.
2. Build API/client locally.
3. Push commit.
4. Deploy on `lxc-dev`, run migrations, restart services, and verify through public URLs.
