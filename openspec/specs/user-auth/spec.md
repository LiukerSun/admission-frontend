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
- **THEN** the system displays the user's email, role, user_type, and account creation time
