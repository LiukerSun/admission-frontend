## ADDED Requirements

### Requirement: Logo click navigates to landing page
The system SHALL navigate the user to the landing page when the dashboard logo is clicked.

#### Scenario: Clicking dashboard logo
- **WHEN** user clicks the logo in the dashboard layout
- **THEN** the browser navigates to the landing page (`/`)

## ADDED Requirements

### Requirement: Top navigation exposes only core workspaces
The system SHALL keep the desktop top navigation to the core workspaces "控制台" and "数据分析".

#### Scenario: User views desktop top navigation
- **WHEN** user views the dashboard layout on a desktop screen
- **THEN** the top navigation contains "控制台" and "数据分析"
- **AND** the top navigation does NOT contain account-management destinations such as "会员中心", "我的订单", or "绑定管理"

### Requirement: User menu exposes account center and admin entry
The system SHALL display a single "账户中心" entry in the user account dropdown, and SHALL conditionally display a direct "系统管理" entry for users with administrator permission.

#### Scenario: Admin opens user account menu
- **WHEN** an admin user views the dashboard layout
- **WHEN** they open the user account menu
- **THEN** the menu contains "账户中心", "系统管理", and "退出登录"

#### Scenario: Non-admin opens user account menu
- **WHEN** a non-admin user views the dashboard layout
- **WHEN** they open the user account menu
- **THEN** the menu contains "账户中心" and "退出登录"
- **AND** the user account menu does NOT contain the "系统管理" menu

### Requirement: Admin routes expose system management navigation
The system SHALL show system management destinations in the top navigation when the user is inside `/admin/*`.

#### Scenario: Admin views system management
- **WHEN** an administrator navigates to `/admin/dashboard`
- **THEN** the top navigation contains "统计看板", "用户管理", "绑定管理", and "支付订单"
- **AND** the current admin page is highlighted

### Requirement: Legacy account routes redirect to account center tabs
The system SHALL redirect legacy account-management routes into the account center query-tab experience.

#### Scenario: User opens legacy account routes
- **WHEN** user navigates to `/membership` or `/orders`
- **THEN** the browser redirects to `/profile?tab=membership-orders`
- **WHEN** user navigates to `/bindings`
- **THEN** the browser redirects to `/profile?tab=family-bindings`

### Requirement: Small screens use a collapsed navigation button
The system SHALL expose dashboard navigation through a collapsed menu button on small screens.

#### Scenario: User opens navigation on a small screen
- **WHEN** user clicks the navigation menu button in the dashboard layout on a small screen
- **THEN** a collapsed navigation menu opens with "控制台" and "数据分析"
