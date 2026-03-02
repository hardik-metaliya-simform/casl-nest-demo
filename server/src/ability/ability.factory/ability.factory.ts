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
  departmentId?: number;
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

    // Salary is restricted to CTO only — apply to all non-CTO roles
    cannot(Actions.Read, 'Employee', ['salary']);
    cannot(Actions.Update, 'Employee', ['salary']);

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
        departmentId: { in: deptIds },
      });

      can(
        Actions.Update,
        'Employee',
        [
          'name',
          'careerStartDate',
          'email',
          'roles',
          'departmentId',
          'reportingManagerId',
        ],
        { departmentId: { in: deptIds } },
      );

      // Can create notes (both public and private) on employees in managed depts
      can(Actions.Create, 'Note', {
        employee: { is: { departmentId: { in: deptIds } } },
      });

      // Can read public notes for employees in managed depts
      can(Actions.Read, 'Note', {
        isAdminOnly: false,
        employee: { is: { departmentId: { in: deptIds } } },
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
          'departmentId',
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
        employees: { some: { reportingManagerId: user.id } },
      });

      // Allow RM to read their own department (if assigned)
      if (user.departmentId) {
        can(Actions.Read, 'Department', { id: user.departmentId });
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
      cannot(Actions.Read, 'Employee', ['salary', 'roles']);
      // Can read own public notes only
      can(Actions.Read, 'Note', { isAdminOnly: false, employeeId: user.id });
    }

    // All authors can read notes they authored (ensures creators can always view their notes)
    can(Actions.Read, 'Note', { authorId: user.id });

    return build();
  }

  getAccessibleWhere<T extends AppSubjects>(
    ability: AppAbility,
    model: Exclude<T, 'all'>,
  ): PrismaQuery {
    // Returns Prisma WhereInput for accessible records
    const accessible = accessibleBy(ability) as any;
    return accessible[model as string] as PrismaQuery;
  }
}
