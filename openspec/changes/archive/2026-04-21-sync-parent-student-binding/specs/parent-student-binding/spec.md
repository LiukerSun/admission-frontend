## ADDED Requirements

### Requirement: Parent can bind a student by email
The system SHALL allow a logged-in parent to bind a student using the student's registered email address.

#### Scenario: Successful binding
- **WHEN** a parent enters a valid student email and submits the bind form
- **THEN** the system creates the binding and displays a success message

#### Scenario: Student not found
- **WHEN** a parent enters an email that does not belong to a registered student
- **THEN** the system displays an error message "未找到该学生账号"

#### Scenario: Student already bound
- **WHEN** a parent tries to bind a student who is already bound to another parent
- **THEN** the system displays an error message "该学生已被其他家长绑定"

#### Scenario: Non-parent attempts to bind
- **WHEN** a user with user_type "student" attempts to access the bind form
- **THEN** the system hides the bind form and does not allow submission

### Requirement: User can view their bindings
The system SHALL allow any authenticated user to view their binding relationships.

#### Scenario: Parent views bound students
- **WHEN** a parent navigates to the binding management page
- **THEN** the system displays a list of students bound to this parent, showing student email and binding creation time

#### Scenario: Student views bound parent
- **WHEN** a student navigates to the binding management page
- **THEN** the system displays the parent bound to this student, showing parent email and binding creation time

#### Scenario: No bindings exist
- **WHEN** a user navigates to the binding management page and has no bindings
- **THEN** the system displays an empty state message
