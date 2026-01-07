# Requirements Document

## Introduction

The facility task management system needs to be updated to properly align with the actual database schema of the facility_task table. The current API routes contain mismatched field names and missing query components that cause runtime errors and data inconsistencies.

## Glossary

- **Facility_Task_System**: The task management module for hotel facility maintenance
- **Database_Schema**: The actual structure of the facility_task table in MySQL
- **API_Route**: The Next.js API endpoints that handle task CRUD operations
- **Field_Mapping**: The correspondence between database column names and API field names

## Requirements

### Requirement 1

**User Story:** As a developer, I want the API routes to use the correct database field names, so that task operations work without errors.

#### Acceptance Criteria

1. WHEN the API queries the facility_task table THEN the system SHALL use the actual column names from the database schema
2. WHEN fetching task data THEN the system SHALL map database fields correctly to API response fields
3. WHEN updating task data THEN the system SHALL use the correct column names in UPDATE queries
4. WHEN creating task data THEN the system SHALL use the correct column names in INSERT queries
5. WHEN the API returns task data THEN the system SHALL include all available fields from the database schema

### Requirement 2

**User Story:** As a developer, I want to remove undefined variables from the code, so that the application compiles and runs without errors.

#### Acceptance Criteria

1. WHEN the GET route returns task data THEN the system SHALL NOT reference undefined variables like checklistRows and commentRows
2. WHEN the code is compiled THEN the system SHALL NOT produce TypeScript errors for undefined variables
3. WHEN the API response is constructed THEN the system SHALL only include defined and available data
4. WHEN unused variables exist THEN the system SHALL remove them to maintain clean code
5. WHEN the API handles requests THEN the system SHALL properly use all declared parameters

### Requirement 3

**User Story:** As a developer, I want the TypeScript interfaces to match the actual database schema, so that type safety is maintained.

#### Acceptance Criteria

1. WHEN defining TypeScript interfaces THEN the system