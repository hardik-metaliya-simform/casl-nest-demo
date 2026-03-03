import { Injectable } from '@nestjs/common';
import { AbilityBuilder, PureAbility } from '@casl/ability';
import {
  createPrismaAbility,
  accessibleBy,
  PrismaQuery,
  Subjects,
} from '@casl/prisma';
import type {
  Employee,
  Note,
  Team,
  Department,
} from 'src/generated/prisma/client';

export enum Actions {
  Manage = 'manage', // wild card
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
}

export type AppSubjects =
  | 'all'
  | Subjects<{
      Employee: Employee;
      Note: Note;
      Team: Team;
      Department: Department;
    }>;

export type AppAbility = PureAbility<[Actions, AppSubjects], PrismaQuery>;

export type UserContext = {
  id: number;
  roles: ('CTO' | 'TM' | 'RM' | 'Employee')[];
  departmentIds?: number[];
  managedDepartmentIds?: number[];
};

@Injectable()
export class AbilityFactory {
  defineAbility(user: UserContext): AppAbility {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(
      createPrismaAbility,
    );

    const isCTO = user.roles.includes('CTO');
    const isTM = user.roles.includes('TM');
    const isRM = user.roles.includes('RM');
    const isEmployee = user.roles.includes('Employee');

    /**
     * CTO — full unrestricted access to everything
     */
    if (isCTO) {
      can(Actions.Manage, 'all');
      return build();
    }

    /**
     * TM (Team Manager)
     * - Manages one or more departments via managedDepartmentIds
     * - Can read all employees and teams within assigned departments
     * - Can update employee records including assigning/changing roles within managed departments
     * - Can create both public (isAdminOnly: false) and private (isAdminOnly: true) notes on employees in managed depts
     * - Private notes (isAdminOnly: true) are ONLY readable by the TM who authored them (plus CTO)
     * - Public notes (isAdminOnly: false) readable by anyone with access to that employee
     * - Can manage Department and Team records for managed departments
     */
    if (isTM && user.managedDepartmentIds) {
      const deptIds = user.managedDepartmentIds;

      can(Actions.Read, 'Employee', {
        employeeDepartments: { some: { departmentId: { in: deptIds } } },
      });
      can(
        Actions.Update,
        'Employee',
        [
          'name',
          'careerStartDate',
          'email',
          'roles',
          'departmentIds',
          'reportingManagerId',
        ],
        { employeeDepartments: { some: { departmentId: { in: deptIds } } } },
      );

      // Can create notes (both public and private) on employees in managed depts
      can(Actions.Create, 'Note', {
        employee: {
          is: {
            employeeDepartments: { some: { departmentId: { in: deptIds } } },
          },
        },
      });

      // Can read public notes for employees in managed depts
      can(Actions.Read, 'Note', {
        isAdminOnly: false,
        employee: {
          is: {
            employeeDepartments: { some: { departmentId: { in: deptIds } } },
          },
        },
      });

      // Can read own private (admin-only) notes — only notes this TM authored
      can(Actions.Read, 'Note', {
        isAdminOnly: true,
        authorId: user.id,
      });

      can(Actions.Manage, 'Department', { id: { in: deptIds } });
      can(Actions.Manage, 'Team', { departmentId: { in: deptIds } });

      // Own profile read + limited update
      can(Actions.Read, 'Employee', { id: user.id });
      can(Actions.Update, 'Employee', ['name', 'careerStartDate'], {
        id: user.id,
      });
    }

    /**
     * RM (Reporting Manager)
     * - Can read employees who report directly to them
     * - Can update basic fields of direct reports (not salary or roles)
     * - Can read the roles field of direct reports but cannot edit it
     * - Can create PUBLIC notes only (isAdminOnly: false) on direct reports
     * - Can read public notes on direct reports
     */
    if (isRM) {
      can(Actions.Read, 'Employee', { reportingManagerId: user.id });

      can(
        Actions.Update,
        'Employee',
        [
          'name',
          'careerStartDate',
          'email',
          'departmentIds',
          'reportingManagerId',
        ],
        { reportingManagerId: user.id },
      );

      // RM cannot update roles field on any employee
      cannot(Actions.Update, 'Employee', ['roles']);

      // Can create public notes only on direct reports
      can(Actions.Create, 'Note', {
        isAdminOnly: false,
        employee: { is: { reportingManagerId: user.id } },
      });

      // Can read public notes about direct reports
      can(Actions.Read, 'Note', {
        isAdminOnly: false,
        employee: { is: { reportingManagerId: user.id } },
      });

      // Own profile read + limited update
      can(Actions.Read, 'Employee', { id: user.id });
      can(Actions.Update, 'Employee', ['name', 'careerStartDate'], {
        id: user.id,
      });

      // Allow RM to read departments that contain their direct reports
      can(Actions.Read, 'Department', {
        employeeDepartments: {
          some: { employee: { reportingManagerId: user.id } },
        },
      });

      // Allow RM to read their own departments (if assigned)
      if (user.departmentIds?.length) {
        can(Actions.Read, 'Department', { id: { in: user.departmentIds } });
      }
    }

    /**
     * Employee (pure — no TM or RM role)
     * - Can only access own profile
     * - Cannot see salary or roles fields
     * - Can read own public notes
     */
    if (isEmployee && !isTM && !isRM) {
      can(Actions.Read, 'Employee', { id: user.id });
      can(Actions.Update, 'Employee', ['name', 'careerStartDate'], {
        id: user.id,
      });
      // Can read own public notes only
      can(Actions.Read, 'Note', { isAdminOnly: false, employeeId: user.id });
      // Pure employees cannot see their own roles field — declared after can so it wins
      cannot(Actions.Read, 'Employee', ['roles']);
    }

    // All authors can read notes they authored (ensures creators can always view their notes)
    can(Actions.Read, 'Note', { authorId: user.id });

    // Salary is CTO-only — these cannot rules are declared LAST so they override
    // any broader can(Read/Update, Employee) rules granted above (CASL: last rule wins)
    cannot(Actions.Read, 'Employee', ['salary']);
    cannot(Actions.Update, 'Employee', ['salary']);
    // cannot(Actions.Read, 'Employee', ['careerStartDate', 'email']);  --> Example

    return build();
  }
}
