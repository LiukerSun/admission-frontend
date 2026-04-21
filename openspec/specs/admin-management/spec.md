# Capability: admin-management

## Overview

管理员后台功能，支持系统统计查看、用户管理与绑定管理。

## Functional Requirements

### Requirement: Admin can view system statistics
The system SHALL display system-wide statistics on the admin dashboard, including total users, active users, banned users, total bindings, and user distribution by role.

#### Scenario: Admin views dashboard
- **WHEN** an admin navigates to `/admin/dashboard`
- **THEN** the system fetches and displays system statistics from `/api/v1/admin/stats`

#### Scenario: Non-admin attempts to view admin dashboard
- **WHEN** a non-admin user navigates to `/admin/dashboard`
- **THEN** the system redirects the user to `/dashboard`

### Requirement: Admin can manage users
The system SHALL allow admins to view a paginated list of all users, filter by email, username, role, and status, and perform actions to disable, enable, or change a user's role.

#### Scenario: Admin views user list
- **WHEN** an admin navigates to `/admin/users`
- **THEN** the system displays a paginated table of all users with columns: ID, username, email, role, user_type, status, created_at

#### Scenario: Admin filters users
- **WHEN** an admin enters search terms or selects filters (email, username, role, status)
- **THEN** the system refreshes the user list to show only matching results

#### Scenario: Admin disables a user
- **WHEN** an admin clicks "禁用" on a user row
- **THEN** the system calls `POST /api/v1/admin/users/{id}/disable` and refreshes the list

#### Scenario: Admin enables a user
- **WHEN** an admin clicks "启用" on a banned user row
- **THEN** the system calls `POST /api/v1/admin/users/{id}/enable` and refreshes the list

#### Scenario: Admin changes user role
- **WHEN** an admin selects a new role for a user and confirms
- **THEN** the system calls `PUT /api/v1/admin/users/{id}/role` and refreshes the list

### Requirement: Admin can manage bindings
The system SHALL allow admins to view a paginated list of all parent-student bindings and解除 individual bindings.

#### Scenario: Admin views binding list
- **WHEN** an admin navigates to `/admin/bindings`
- **THEN** the system displays a paginated table of all bindings with columns: ID, parent email, student email, created_at

#### Scenario: Admin removes a binding
- **WHEN** an admin clicks "解除绑定" on a binding row
- **THEN** the system calls `DELETE /api/v1/admin/bindings/{id}` and refreshes the list
