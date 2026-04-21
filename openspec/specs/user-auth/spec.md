# Capability: user-auth

## Overview

用户认证与注册功能，支持邮箱密码登录、Token 刷新、以及基于用户类型的注册。

## Functional Requirements

### Requirement: User can register with email and password
The system SHALL allow new users to register with a unique email, a password, and a user type.

#### Scenario: Successful registration as parent
- **WHEN** a user provides a unique email, a valid password, selects "parent" as user type, and submits the registration form
- **THEN** the system creates the account with user_type "parent" and redirects the user to the dashboard

#### Scenario: Successful registration as student
- **WHEN** a user provides a unique email, a valid password, selects "student" as user type, and submits the registration form
- **THEN** the system creates the account with user_type "student" and redirects the user to the dashboard

#### Scenario: Missing user type
- **WHEN** a user submits the registration form without selecting a user type
- **THEN** the system displays a validation error requiring user type selection

### Requirement: User can view their profile
The system SHALL display the current user's profile information.

#### Scenario: Viewing profile as authenticated user
- **WHEN** an authenticated user navigates to the profile page
- **THEN** the system displays the user's email, username, role, user_type, status, and account creation time

### Requirement: Admin routes are protected by role
The system SHALL restrict access to admin routes to users whose role is "admin".

#### Scenario: Admin accesses admin route
- **WHEN** an authenticated admin navigates to an admin route (e.g., `/admin/dashboard`)
- **THEN** the system allows access and renders the admin page

#### Scenario: Non-admin accesses admin route
- **WHEN** an authenticated non-admin user navigates to an admin route
- **THEN** the system redirects the user to `/dashboard`

#### Scenario: Unauthenticated user accesses admin route
- **WHEN** an unauthenticated user navigates to an admin route
- **THEN** the system redirects the user to `/login`
