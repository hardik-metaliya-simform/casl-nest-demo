import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/create-auth.dto';
import { RegisterDto } from './dto/register.dto';
import {
  UserContext,
  AbilityFactory,
  Actions,
} from '../ability/ability.factory/ability.factory';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly abilityFactory: AbilityFactory,
  ) {}

  async register(dto: RegisterDto) {
    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create employee
    const employee = await this.prisma.employee.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        roles: dto.roles?.length ? dto.roles : ['Employee'],
        reportingManagerId: dto.reportingManagerId,
        careerStartDate: dto.careerStartDate
          ? new Date(dto.careerStartDate)
          : null,
        ...(dto.departmentIds?.length
          ? {
              employeeDepartments: {
                create: dto.departmentIds.map((id) => ({ departmentId: id })),
              },
            }
          : {}),
      },
    });

    return {
      id: employee.id,
      email: employee.email,
      name: employee.name,
      roles: employee.roles,
    };
  }

  async login(dto: LoginDto) {
    // Find employee by email
    const employee = await this.prisma.employee.findUnique({
      where: { email: dto.email },
      include: {
        managedDepartments: true,
        employeeDepartments: true,
      },
    });

    if (!employee) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Validate password with bcrypt
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      employee.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Get managed department IDs for TM role
    const managedDepartmentIds = employee.roles.includes('TM')
      ? employee.managedDepartments.map((md) => md.departmentId)
      : undefined;

    const departmentIds = employee.employeeDepartments.map(
      (ed) => ed.departmentId,
    );

    // Generate JWT
    const payload = {
      sub: employee.id,
      email: employee.email,
      roles: employee.roles,
      departmentIds,
      managedDepartmentIds,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: employee.id,
        email: employee.email,
        name: employee.name,
        roles: employee.roles,
      },
    };
  }

  async validateEmployee(id: number): Promise<UserContext> {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        managedDepartments: true,
        employeeDepartments: true,
      },
    });

    if (!employee) {
      throw new UnauthorizedException('Employee not found');
    }

    const managedDepartmentIds = employee.roles.includes('TM')
      ? employee.managedDepartments.map((md) => md.departmentId)
      : undefined;

    return {
      id: employee.id,
      roles: employee.roles as any,
      departmentIds: employee.employeeDepartments.map((ed) => ed.departmentId),
      managedDepartmentIds,
    };
  }

  async getAbilities(user: UserContext) {
    const ability = this.abilityFactory.defineAbility(user);

    // Helper function to check abilities
    const canDo = (action: Actions, subject: string, field?: string) => {
      if (field) {
        return ability.can(action, subject as any, field);
      }
      return ability.can(action, subject as any);
    };

    return {
      roles: user.roles,
      userId: user.id,
      departmentIds: user.departmentIds || [],
      managedDepartmentIds: user.managedDepartmentIds || [],
      canManageAll: user.roles.includes('CTO'),
      permissions: {
        Employee: {
          create: canDo(Actions.Create, 'Employee'),
          read: canDo(Actions.Read, 'Employee'),
          update: canDo(Actions.Update, 'Employee'),
          delete: canDo(Actions.Delete, 'Employee'),
          canSeeSalary: canDo(Actions.Read, 'Employee', 'salary'),
          canEditSalary: canDo(Actions.Update, 'Employee', 'salary'),
          canSeeRole: canDo(Actions.Read, 'Employee', 'roles'),
          canEditRole: canDo(Actions.Update, 'Employee', 'roles'),
        },
        Department: {
          create: canDo(Actions.Create, 'Department'),
          read: canDo(Actions.Read, 'Department'),
          update: canDo(Actions.Update, 'Department'),
          delete: canDo(Actions.Delete, 'Department'),
        },
        Team: {
          create: canDo(Actions.Create, 'Team'),
          read: canDo(Actions.Read, 'Team'),
          update: canDo(Actions.Update, 'Team'),
          delete: canDo(Actions.Delete, 'Team'),
        },
        Note: {
          create: canDo(Actions.Create, 'Note'),
          read: canDo(Actions.Read, 'Note'),
          update: canDo(Actions.Update, 'Note'),
          delete: canDo(Actions.Delete, 'Note'),
          canSeeAdminOnly:
            user.roles.includes('CTO') || user.roles.includes('TM'),
        },
        ManagedDepartment: {
          create: canDo(Actions.Create, 'ManagedDepartment'),
          read: canDo(Actions.Read, 'ManagedDepartment'),
          update: canDo(Actions.Update, 'ManagedDepartment'),
          delete: canDo(Actions.Delete, 'ManagedDepartment'),
        },
      },
    };
  }
}
