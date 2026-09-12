<p align="center">
<img src="client/public/favicon.svg" alt="Libro" height="120" />
</p>

___

<p align="center">
  <strong>Discover great reads, track your loans, and connect with fellow book lovers</strong>
</p>

<p align="center">
    <a href="./LICENSE">
        <img src="https://img.shields.io/badge/license-MIT-blue.svg" />
    </a>
</p>

## Backend Coding Standards & Conventions

This project strictly adheres to the following backend development standards to ensure maintainability, security, and performance.

### 1. Architecture
- **3-Tier Layered Architecture**: Use Controller -> Service -> Repository. Avoid over-engineering (e.g., Domain-Driven Design) when not strictly necessary. 
- Do not create separate services for Admin and User (e.g., `AdminUserService`). Instead, separate the logic by grouping methods logically within the same service (e.g., `UserService`).

### 2. API Design & Security
- **Admin APIs**: Always prefix with `/admin` (e.g., `/admin/users`, `/admin/books`) to cleanly separate backoffice from end-user APIs.
- **Public Identifiers**: Do not expose internal database IDs (Sequence IDs) to end-users to prevent IDOR and enumeration attacks. Use public-facing identifiers (like `handle`) for end-user APIs (e.g., `GET /books/{handle}`). Admin APIs may continue to use internal DB `id`s for database performance.

### 3. DTOs & Mapping
- **Minimize DTO Explosion**: Reuse DTOs across endpoints where it makes sense. Only create separate Admin and Public response DTOs (e.g., `BookResponse` vs `BookPublicResponse`) when sensitive fields (like internal DB `id` or `status`) must be hidden from end-users.
- **Inline Builder Pattern**: Do not use mapper libraries (like MapStruct) or static factory methods (e.g., `public static XResponse from(X x)`) in DTO records. Map entities to DTOs explicitly using the Inline Builder pattern directly inside the Service methods. This prevents boilerplate while keeping the mapping completely transparent at the call site.

### 4. Validation Strategy
- **Input Validation (Fail Fast)**: Use JSR-380 annotations (`@Valid`, `@NotBlank`, `@Email`, `@Pattern`, `@Size`) directly in DTO records and Controllers to block malformed requests at the edge.
- **Business Validation (Accumulate Errors)**: Centralize business validation logic (e.g., checking uniqueness against the DB) inside the Service layer. Do not "fail fast" on the first error. Instead, check all conditions, accumulate the errors into a `Map`, and throw a single `BusinessValidationException` so the client receives all violations at once (returns `409 Conflict`).

### 5. Exception Handling
- Do not throw generic exceptions like `RuntimeException` or `ResponseStatusException`.
- Throw dedicated custom exceptions (`ResourceNotFoundException`, `DuplicateResourceException`, `BadRequestException`) or built-in Spring Security exceptions (`BadCredentialsException`, `DisabledException`).
- All exceptions are intercepted by `GlobalExceptionHandler` to return consistent JSON error structures.

### 6. Data Deletion
- **No Hard Deletes**: Never call `repository.deleteById()`. 
- **Soft Deletes**: Always use a `status` Enum (e.g., `INACTIVE`, `ARCHIVED`, `BANNED`, `HIDDEN`) on the entity.
- End-user APIs must explicitly filter out non-active records (e.g., `.filter(b -> b.getStatus() == Status.ACTIVE)`). Admin APIs may retrieve all statuses.

### 7. Data Auditing
- **BaseEntity**: All entities MUST extend `BaseEntity`. This provides out-of-the-box JPA auditing with four standard fields: `createdAt`, `updatedAt`, `createdBy`, and `updatedBy`.
- **Automatic Population**: Do NOT set these fields manually. Spring Data JPA `@EnableJpaAuditing` and the configured `SecurityAuditorAware` bean will automatically extract the current user from the `SecurityContext` and timestamp the records during INSERT and UPDATE operations.

---

## Future Roadmap & Planned Modules

### 1. Reservation System (Hệ thống Đặt trước sách)
- **Eligibility**: Only allowed when a book has 0 available physical copies (`availableCopies == 0`).
- **Queue Mechanism**: First-In, First-Out (FIFO) queue per book title.
- **Constraints**:
  - Maximum concurrent active reservations per user (e.g., max 3 books).
  - A user cannot place a reservation if they are already borrowing or currently reserving a copy of the same book.
- **Hold Shelf & Auto-Assignment**:
  - When a loaned copy is returned, if there are pending reservations, the copy is marked `RESERVED` / `ON_HOLD` (not `AVAILABLE`) and assigned to the top user in the queue.
  - The user has a pickup window (e.g., 3 days) to collect the book.
  - If expired, status transitions to `EXPIRED` and the copy is automatically offered to the next user in the queue. If queue is empty, the copy reverts to `AVAILABLE`.

### 2. Fine & Penalty Management (Quản lý Phạt & Bồi thường) - [x] *Implemented*
- **Overdue Fines**: Automatically calculated upon return based on overdue days (`daysOverdue * dailyRate`) with a fine cap.
- **Lost / Damaged Handling**: Admin endpoints `POST /admin/loans/{id}/report-lost` and `POST /admin/loans/{id}/report-damaged` to update inventory and assess replacement fees.
- **Borrowing Restriction**: Automatically blocks members with `PENDING` fines from borrowing new books.
- **Payment Methods**:
  - Offline / In-person: Admin cash collection (`POST /admin/fines/{id}/pay-cash`) and waiver (`POST /admin/fines/{id}/waive`).
  - Online: Stripe Checkout hosted payment (`POST /fines/{codeOrId}/checkout-session`) and Webhook listener (`POST /webhooks/stripe`).

### 3. Dynamic System Settings (Cài đặt Hệ thống Động)
- **Purpose**: Allow Admins/Librarians to configure business parameters via the Admin UI without modifying code or restarting the server.
- **Data Structure**: Key-Value table (`system_settings`) with fields `key` (PK), `value`, `description`, and audit fields (`updatedAt`, `updatedBy`).
- **Core Configs**:
  - `LOAN_MAX_ACTIVE_BOOKS`: Maximum active loans per user (default: 5).
  - `LOAN_MAX_RENEWALS`: Maximum renewals allowed per loan (default: 2).
  - `LOAN_STANDARD_DAYS`: Standard loan duration in days (default: 14).
  - `LOAN_RENEWAL_DAYS`: Standard extension duration in days (default: 14).
  - `RESERVATION_MAX_ACTIVE`: Maximum concurrent active reservations per user (default: 3).
  - `RESERVATION_HOLD_DAYS`: Hold shelf pickup window in days (default: 3).
- **Performance Strategy**: Cached in memory (via Spring Cache / `ConcurrentHashMap`) with automatic cache invalidation on admin update + safe hardcoded fallback values if key is missing.

### 4. Membership Subscription (Thuê bao Hội viên định kỳ)
- **Business Model**: Monthly / Yearly subscription tiers (e.g., Free, Standard, VIP/Premium).
- **Integration**: Powered by Stripe Billing (Subscriptions, recurring invoices, and customer portal).
- **Tier Benefits**: Dynamic borrowing quotas, longer loan durations, renewal limits, and reservation priority linked to the active membership plan.
