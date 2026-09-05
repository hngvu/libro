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
