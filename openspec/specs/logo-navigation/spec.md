## ADDED Requirements

### Requirement: Logo click navigates to landing page
The system SHALL navigate the user to the landing page when the dashboard logo is clicked.

#### Scenario: Clicking dashboard logo
- **WHEN** user clicks the logo in the dashboard layout
- **THEN** the browser navigates to the landing page (`/`)

## ADDED Requirements

### Requirement: Sidebar shows admin menu for admin users
The system SHALL conditionally display a "系统管理" menu section in the sidebar for users with role "admin".

#### Scenario: Admin views sidebar
- **WHEN** an admin user views the dashboard layout
- **THEN** the sidebar contains a "系统管理" menu with items: 统计看板, 用户管理, 绑定管理

#### Scenario: Non-admin views sidebar
- **WHEN** a non-admin user views the dashboard layout
- **THEN** the sidebar does NOT contain the "系统管理" menu
