import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { accessibleBy } from '@casl/prisma';
import { subject } from '@casl/ability';
import * as bcrypt from 'bcrypt';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import {
  AbilityFactory,
  UserContext,
  Actions,
} from '../ability/ability.factory/ability.factory';

@Injectable()
export class EmployeeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly abilityFactory: AbilityFactory,
  ) {}

  async create(dto: CreateEmployeeDto, user: UserContext) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.employee.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        careerStartDate: dto.careerStartDate
          ? new Date(dto.careerStartDate)
          : null,
        salary: dto.salary,
        roles: dto.roles?.length ? dto.roles : ['Employee'],
        reportingManagerId: dto.reportingManagerId,
        ...(dto.departmentIds?.length
          ? {
              employeeDepartments: {
                create: dto.departmentIds.map((id) => ({
                  departmentId: id,
                })),
              },
            }
          : {}),
      },
      include: {
        employeeDepartments: { include: { department: true } },
        reportingManager: true,
      },
    });
  }

  async findAll(user: UserContext) {
    const ability = this.abilityFactory.defineAbility(user);

    // Get Prisma-compatible filter from CASL
    const accessibleFilter = accessibleBy(ability, Actions.Read).Employee;
    console.log({ ability: ability.rules });

    // Fetch employees with permissions applied
    const employees = await this.prisma.employee.findMany({
      where: accessibleFilter,
      include: {
        employeeDepartments: { include: { department: true } },
        reportingManager: true,
        notes: true,
      },
    });

    return employees.map((e) => this.sanitizeEmployee(e, user));
  }

  async findOne(id: number, user: UserContext) {
    const ability = this.abilityFactory.defineAbility(user);

    // Combine accessibleBy with specific ID
    const employee = await this.prisma.employee.findFirst({
      where: {
        AND: [accessibleBy(ability, Actions.Read).Employee, { id }],
      },
      include: {
        employeeDepartments: { include: { department: true } },
        reportingManager: true,
        reports: true,
        notes: true,
        managedDepartments: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found or access denied');
    }

    return this.sanitizeEmployee(employee, user);
  }

  async update(id: number, dto: UpdateEmployeeDto, user: UserContext) {
    const ability = this.abilityFactory.defineAbility(user);

    // First check if employee exists and is accessible
    const employee = await this.prisma.employee.findFirst({
      where: {
        AND: [accessibleBy(ability, Actions.Update).Employee, { id }],
      },
      // Required: CASL evaluates field-level conditions (e.g. TM updating 'roles'
      // is gated on employeeDepartments) against the loaded instance — without this,
      // the condition evaluates against undefined and the field is always rejected
      include: { employeeDepartments: true },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found or access denied');
    }

    // Build a field-filtered data object — only include fields the user is permitted to update
    const employeeSubject = subject('Employee', employee);
    const data: Record<string, any> = {};

    const fieldCandidates: Array<[string, any]> = [
      ['name', dto.name],
      ['email', dto.email],
      [
        'careerStartDate',
        dto.careerStartDate ? new Date(dto.careerStartDate) : undefined,
      ],
      ['salary', dto.salary],
      ['roles', dto.roles],
      ['reportingManagerId', dto.reportingManagerId],
    ];

    for (const [field, value] of fieldCandidates) {
      if (
        value !== undefined &&
        ability.can(Actions.Update, employeeSubject, field)
      ) {
        data[field] = value;
      }
    }

    // Explicit safety guards — these mirror the cannot() rules in AbilityFactory
    // and prevent createPrismaAbility instance-check edge cases from bypassing them
    if (!user.roles.includes('CTO')) {
      // Only CTO can update salary
      delete data['salary'];
    }
    if (!user.roles.includes('CTO') && !user.roles.includes('TM')) {
      // Only CTO and TM can update roles
      delete data['roles'];
    }

    // Password is handled separately (must be hashed)
    if (
      dto.password !== undefined &&
      ability.can(Actions.Update, employeeSubject, 'password')
    ) {
      data.password = await bcrypt.hash(dto.password, 10);
    }

    // Handle departmentIds replacement (many-to-many)
    if (
      dto.departmentIds !== undefined &&
      ability.can(Actions.Update, employeeSubject, 'departmentIds')
    ) {
      await this.prisma.employeeDepartment.deleteMany({
        where: { employeeId: id },
      });
      if (dto.departmentIds.length > 0) {
        await this.prisma.employeeDepartment.createMany({
          data: dto.departmentIds.map((dId) => ({
            employeeId: id,
            departmentId: dId,
          })),
        });
      }
    }

    return this.sanitizeEmployee(
      await this.prisma.employee.update({
        where: { id },
        data,
        include: {
          employeeDepartments: { include: { department: true } },
          reportingManager: true,
        },
      }),
      user,
    );
  }

  async remove(id: number, user: UserContext) {
    const ability = this.abilityFactory.defineAbility(user);

    // Check if employee exists and is accessible for deletion
    const employee = await this.prisma.employee.findFirst({
      where: {
        AND: [accessibleBy(ability, Actions.Delete).Employee, { id }],
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found or access denied');
    }

    return this.prisma.employee.delete({
      where: { id },
    });
  }

  /** Strip fields the user is not permitted to read from an employee record. */
  private sanitizeEmployee(emp: any, user: UserContext): any {
    const result = { ...emp };

    // Flatten employeeDepartments → departments array for a clean response shape
    if (Array.isArray(result.employeeDepartments)) {
      result.departments = result.employeeDepartments.map(
        (ed: any) => ed.department,
      );
      delete result.employeeDepartments;
    }

    // Only CTO can see salary
    if (!user.roles.includes('CTO')) {
      delete result.salary;
    }

    // Pure Employee role cannot see the roles field on any record
    if (
      !user.roles.includes('CTO') &&
      !user.roles.includes('TM') &&
      !user.roles.includes('RM')
    ) {
      delete result.roles;
    }

    // Sanitize nested single employee (e.g. reportingManager)
    if (result.reportingManager) {
      result.reportingManager = this.sanitizeEmployee(
        result.reportingManager,
        user,
      );
    }
    // Sanitize nested employee arrays (e.g. reports)
    if (Array.isArray(result.reports)) {
      result.reports = result.reports.map((r: any) =>
        this.sanitizeEmployee(r, user),
      );
    }

    return result;
  }
}
