import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateManagedDepartmentDto } from './dto/create-managed-department.dto';
import { UpdateManagedDepartmentDto } from './dto/update-managed-department.dto';
import type { UserContext } from '../ability/ability.factory/ability.factory';

@Injectable()
export class ManagedDepartmentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateManagedDepartmentDto, user: UserContext) {
    // Only CTO should be able to create managed departments
    // This is enforced by the AbilityGuard
    await this.prisma.managedDepartment.createMany({
      data: dto.departmentIds.map((departmentId) => ({
        employeeId: dto.employeeId,
        departmentId,
      })),
      skipDuplicates: true,
    });

    // createMany does not return relations, so fetch the created records
    return this.prisma.managedDepartment.findMany({
      where: {
        employeeId: dto.employeeId,
        departmentId: { in: dto.departmentIds },
      },
      include: {
        employee: true,
        department: true,
      },
    });
  }

  async findAll(user: UserContext) {
    // Typically only CTO needs to see all managed departments
    return this.prisma.managedDepartment.findMany({
      include: {
        employee: true,
        department: true,
      },
    });
  }

  async findOne(id: number, user: UserContext) {
    const managedDepartment = await this.prisma.managedDepartment.findUnique({
      where: { id },
      include: {
        employee: true,
        department: true,
      },
    });

    if (!managedDepartment) {
      throw new NotFoundException('Managed department not found');
    }

    return managedDepartment;
  }

  async update(id: number, dto: UpdateManagedDepartmentDto, user: UserContext) {
    const managedDepartment = await this.prisma.managedDepartment.findUnique({
      where: { id },
    });

    if (!managedDepartment) {
      throw new NotFoundException('Managed department not found');
    }

    return this.prisma.managedDepartment.update({
      where: { id },
      data: {
        ...(dto.employeeId !== undefined && { employeeId: dto.employeeId }),
        ...(dto.departmentId !== undefined && {
          departmentId: dto.departmentId,
        }),
      },
      include: {
        employee: true,
        department: true,
      },
    });
  }

  async remove(id: number, user: UserContext) {
    const managedDepartment = await this.prisma.managedDepartment.findUnique({
      where: { id },
    });

    if (!managedDepartment) {
      throw new NotFoundException('Managed department not found');
    }

    return this.prisma.managedDepartment.delete({
      where: { id },
    });
  }
}
