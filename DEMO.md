# RBAC Demo — Role-Based Access Control Showcase

A demo built with **NestJS + Prisma + CASL** (backend) and **React + MUI** (frontend) that demonstrates access control

---

## Tech Stack

| Layer         | Technology                              |
| ------------- | --------------------------------------- |
| Backend API   | NestJS (TypeScript)                     |
| Authorization | CASL (`@casl/ability` + `@casl/prisma`) |
| Database      | PostgreSQL via Prisma ORM               |
| Frontend      | React + Vite + MUI (Material UI)        |
| Auth          | JWT (JSON Web Tokens)                   |

---

## Test Accounts

All accounts share the same password: **`password123`**

| Role                        | Name           | Email                        |
| --------------------------- | -------------- | ---------------------------- |
| CTO                         | Alice Johnson  | `alice.johnson@company.com`  |
| TM — Engineering            | Bob Smith      | `bob.smith@company.com`      |
| TM — Sales                  | Carol Williams | `carol.williams@company.com` |
| TM — HR                     | David Brown    | `david.brown@company.com`    |
| RM — Backend                | Emma Davis     | `emma.davis@company.com`     |
| RM — Frontend               | Frank Miller   | `frank.miller@company.com`   |
| RM — Sales                  | Grace Wilson   | `grace.wilson@company.com`   |
| RM — HR                     | Henry Moore    | `henry.moore@company.com`    |
| Employee (Backend)          | Ivy Taylor     | `ivy.taylor@company.com`     |
| Employee (Backend)          | Jack Anderson  | `jack.anderson@company.com`  |
| Employee (Frontend)         | Kelly Thomas   | `kelly.thomas@company.com`   |
| Employee (Frontend + Sales) | Leo Jackson    | `leo.jackson@company.com`    |
| Employee (Sales + HR)       | Maria White    | `maria.white@company.com`    |
| Employee (Sales)            | Nathan Harris  | `nathan.harris@company.com`  |
| Employee (HR)               | Olivia Martin  | `olivia.martin@company.com`  |
| Employee (HR)               | Paul Garcia    | `paul.garcia@company.com`    |

---

## Roles & Permissions

### CTO — Alice Johnson

The CTO has **unrestricted access** to the entire system via a single `can(manage, all)` rule.

#### ✅ Can

- View **all 16 employees** — including salary and roles fields
- **Create, edit, and delete** any employee
- Create, edit, and delete **any department and team**
- Read **all notes** — both public and confidential (`isAdminOnly: true`)
- Create notes on **any employee**
- The **only role** that can see or update the `salary` field

#### ❌ Cannot

- Nothing is off-limits

---

### TM (Team Manager) — Bob, Carol, David

A TM is assigned to one or more departments via the `ManagedDepartment` table. All access is scoped to those departments.

#### ✅ Can

**Employees**

- Read all employees who belong to **any of their managed department(s)**
- Update the following fields on those employees:
  - `name`, `email`, `careerStartDate`
  - `roles` — can promote or demote
  - `departmentIds` — can reassign to other departments
  - `reportingManagerId`
- Read and update their **own profile** (`name`, `careerStartDate` for self-edits)

**Departments & Teams**

- Full CRUD on departments they manage
- Full CRUD on teams within those departments

**Notes**

- Create **public** (`isAdminOnly: false`) notes on employees in managed departments
- Create **confidential** (`isAdminOnly: true`) notes on employees in managed departments
- Read all **public notes** for employees in managed departments
- Read **only their own confidential notes** (notes they personally authored)

#### ❌ Cannot

- See or modify employees in **other departments**
- See the **salary** field of any employee (CTO-only)
- Read **confidential notes authored by other TMs** — even in the same department
- Manage departments or teams outside their assignment

> **Demo:** Login as Bob (Engineering TM) → Employees list shows only Engineering employees. Navigate directly to a Sales employee's URL → access denied.

---

### RM (Reporting Manager) — Emma, Frank, Grace, Henry

An RM's access is scoped to employees whose `reportingManagerId` equals their own ID.

#### ✅ Can

**Employees**

- Read employees who directly report to them
- Update these fields on direct reports: `name`, `email`, `careerStartDate`, `departmentIds`, `reportingManagerId`
- Read and update their **own profile** (`name`, `careerStartDate`)

**Departments**

- Read departments that contain at least one of their direct reports
- Read their own assigned departments

**Notes**

- Create **public notes only** (`isAdminOnly: false`) on direct reports
- Read public notes about their direct reports
- Read any note they personally authored

#### ❌ Cannot

- See or update employees **not reporting to them** (including peers in the same department)
- See the **salary** field on anyone
- **Update the `roles` field** of any employee
- Create or read **confidential notes**
- Create, update, or delete departments or teams

> **Demo:** Login as Emma (RM Backend) → only Ivy Taylor and Jack Anderson are visible. Kelly Thomas and Leo Jackson (Frank's reports, same department) are not accessible.

---

### Employee — Ivy, Jack, Kelly, Leo, Maria, Nathan, Olivia, Paul

A regular Employee has the most restricted access — read-only on their own record only.

#### ✅ Can

- Read **their own profile only**
- Update their own `name` and `careerStartDate`
- Read **public notes** written about themselves

#### ❌ Cannot

- See **any other employee's record**
- See their own **salary** field (stripped from API response)
- See their own **roles** field (stripped from API response)
- Create, update, or delete **any note**
- See **confidential notes** — even ones written about themselves
- Access the departments or teams sections

> **Demo:** Login as Ivy Taylor → Employee list shows only her own row. The salary and roles columns are hidden entirely. Navigating to any other employee's URL returns access denied.

---

## Feature Highlights

### 1. Field-Level Access Control

The same `GET /employees/:id` endpoint returns **different fields** depending on caller identity:

| Field              | CTO | TM        | RM           | Employee    |
| ------------------ | --- | --------- | ------------ | ----------- |
| `name`             | ✅  | ✅        | ✅           | ✅ own only |
| `email`            | ✅  | ✅        | ✅           | ✅ own only |
| `salary`           | ✅  | ❌ hidden | ❌ hidden    | ❌ hidden   |
| `roles`            | ✅  | ✅        | ✅ read-only | ❌ hidden   |
| `departments`      | ✅  | ✅        | ✅           | ✅ own only |
| `reportingManager` | ✅  | ✅        | ✅           | ✅ own only |

### 2. Row-Level Access Control

`GET /employees` returns only the rows each role is permitted to see:

| Logged-in User         | Visible Employees                           |
| ---------------------- | ------------------------------------------- |
| CTO — Alice            | All 16 employees                            |
| TM — Bob (Engineering) | All employees in the Engineering department |
| TM — Carol (Sales)     | All employees in the Sales department       |
| RM — Emma (Backend)    | Only Ivy Taylor + Jack Anderson             |
| Employee — Ivy         | Only herself                                |

### 3. Confidential Notes (`isAdminOnly`)

Notes carry an `isAdminOnly` boolean flag:

| Note Type                          | Who Can Read                                                  |
| ---------------------------------- | ------------------------------------------------------------- |
| Public (`isAdminOnly: false`)      | TM of the dept, RM of the employee, the subject employee, CTO |
| Confidential (`isAdminOnly: true`) | **The authoring TM only** + CTO — nobody else                 |

A TM cannot read another TM's confidential notes even if they manage the same department.

### 4. Many-to-Many Employee–Department

An employee can belong to multiple departments via the `EmployeeDepartment` join table. The employee create/edit form uses a **multi-select** for department assignment. A TM sees any employee who belongs to **at least one** of their managed departments.

**Example:** Emma Davis belongs to both Engineering and Sales. Both Bob (TM Engineering) and Carol (TM Sales) can see Emma in their respective employee lists.

### 5. Managed Departments vs. Member Departments

Two separate concepts:

- **`ManagedDepartment`** — which departments a TM has management authority over
- **`EmployeeDepartment`** — which departments an employee belongs to as a member

A TM can manage a department without being a personal member of it, and vice versa.

---

## Demo Scenarios (Step-by-Step)

### Scenario A — CTO Login

1. Login as `alice.johnson@company.com`
2. **Employees** → all 16 employees visible, salary column is shown
3. Open any employee detail → salary is displayed
4. **Notes** → all notes visible including all confidential ones

### Scenario B — TM department isolation

1. Login as `bob.smith@company.com` (TM — Engineering)
2. **Employees** → only Engineering employees visible (no Sales or HR)
3. Navigate directly to a Sales employee's URL → 403 / not found
4. **Notes** → only public notes for Engineering employees + Bob's own confidential notes
5. Logout → login as `carol.williams@company.com` (TM — Sales) → completely different employee list

### Scenario C — RM direct-report scoping

1. Login as `emma.davis@company.com` (RM — Backend)
2. **Employees** → only Ivy Taylor and Jack Anderson visible
3. Open Ivy's detail → salary field absent, roles visible but edit button does not include roles
4. Navigate to Kelly Thomas (Frank's report) by direct URL → access denied
5. Open a note → only public notes on her direct reports

### Scenario D — Employee self-service only

1. Login as `ivy.taylor@company.com`
2. **Employees** → only her own row, no salary column, no roles column
3. Open own detail → departments shown as chips, no salary
4. **Notes** → only public notes written about her

### Scenario E — Multi-department visibility

1. Login as `bob.smith@company.com` (TM — Engineering)
2. Find **Leo Jackson** → departments column shows "Engineering, Sales"
3. Find **Emma Davis** → departments column shows "Engineering, Sales"
4. Logout → login as `carol.williams@company.com` (TM — Sales)
5. Both Leo and Emma still appear in Carol's list (Sales membership)
6. Open Leo's detail → edit form shows both Engineering and Sales selected in the multi-select

### Scenario F — Confidential note isolation

1. Login as `bob.smith@company.com` (TM — Engineering)
2. Open an Engineering employee → create a confidential note
3. Logout → login as `carol.williams@company.com` (TM — Sales)
4. Carol **cannot** see Bob's confidential note
5. Logout → login as `david.brown@company.com` (TM — HR)
6. David also **cannot** see Bob's confidential note
7. Logout → login as `alice.johnson@company.com` (CTO)
8. Alice can see **all** confidential notes from all authors

### Scenario G — Role update by TM

1. Login as `bob.smith@company.com` (TM — Engineering)
2. Open an Engineering employee → Edit → change roles to `['RM', 'Employee']`
3. Save → role update is applied (TMs can promote/demote within their dept)
4. Login as `emma.davis@company.com` (RM) → attempt to edit an employee's roles → roles field not shown in edit form (RMs cannot edit roles)
