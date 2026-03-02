import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { accessibleBy } from '@casl/prisma';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import {
  AbilityFactory,
  UserContext,
  Actions,
} from '../ability/ability.factory/ability.factory';

@Injectable()
export class DepartmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly abilityFactory: AbilityFactory,
  ) {}

  async create(dto: CreateDepartmentDto, user: UserContext) {
    const department = await this.prisma.department.create({
      data: {
        name: dto.name,
      },
      include: {
        teams: true,
        employeeDepartments: { include: { employee: true } },
      },
    });

    return {
      ...department,
      employees: department.employeeDepartments.map((ed) => ed.employee),
      employeeDepartments: undefined,
    };
  }

  async findAll(user: UserContext) {
    const ability = this.abilityFactory.defineAbility(user);

    const departments = await this.prisma.department.findMany({
      where: accessibleBy(ability, Actions.Read).Department,
      include: {
        teams: true,
        employeeDepartments: { include: { employee: true } },
      },
    });

    return departments.map((d) => ({
      ...d,
      employees: d.employeeDepartments.map((ed) => ed.employee),
      employeeDepartments: undefined,
    }));
  }

  async findOne(id: number, user: UserContext) {
    const ability = this.abilityFactory.defineAbility(user);

    const department = await this.prisma.department.findFirst({
      where: {
        AND: [accessibleBy(ability, Actions.Read).Department, { id }],
      },
      include: {
        teams: true,
        employeeDepartments: { include: { employee: true } },
      },
    });

    if (!department) {
      throw new NotFoundException('Department not found or access denied');
    }

    return {
      ...department,
      employees: department.employeeDepartments.map((ed) => ed.employee),
      employeeDepartments: undefined,
    };
  }

  async update(id: number, dto: UpdateDepartmentDto, user: UserContext) {
    const ability = this.abilityFactory.defineAbility(user);

    const department = await this.prisma.department.findFirst({
      where: {
        AND: [accessibleBy(ability, Actions.Update).Department, { id }],
      },
    });

    if (!department) {
      throw new NotFoundException('Department not found or access denied');
    }

    const updated = await this.prisma.department.update({
      where: { id },
      data: {
        name: dto.name,
      },
      include: {
        teams: true,
        employeeDepartments: { include: { employee: true } },
      },
    });

    return {
      ...updated,
      employees: updated.employeeDepartments.map((ed) => ed.employee),
      employeeDepartments: undefined,
    };
  }

  async remove(id: number, user: UserContext) {
    const ability = this.abilityFactory.defineAbility(user);

    const department = await this.prisma.department.findFirst({
      where: {
        AND: [accessibleBy(ability, Actions.Delete).Department, { id }],
      },
    });

    if (!department) {
      throw new NotFoundException('Department not found or access denied');
    }

    return this.prisma.department.delete({
      where: { id },
    });
  }
}
