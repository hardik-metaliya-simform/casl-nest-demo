import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { accessibleBy } from '@casl/prisma';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import {
  AbilityFactory,
  UserContext,
  Actions,
} from '../ability/ability.factory/ability.factory';

@Injectable()
export class NoteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly abilityFactory: AbilityFactory,
  ) {}

  async create(dto: CreateNoteDto, user: UserContext) {
    const ability = this.abilityFactory.defineAbility(user);

    // Verify the requesting user has read access to the target employee
    // (direct reports for RM, employees in managed departments for TM)
    const accessibleEmployee = await this.prisma.employee.findFirst({
      where: {
        AND: [
          accessibleBy(ability, Actions.Read).Employee,
          { id: dto.employeeId },
        ],
      },
    });

    if (!accessibleEmployee) {
      throw new ForbiddenException('Cannot create a note for this employee');
    }

    // RM can only create public notes (isAdminOnly: false)
    // TM and CTO can create both public and private notes
    if (
      dto.isAdminOnly &&
      !user.roles.includes('TM') &&
      !user.roles.includes('CTO')
    ) {
      throw new ForbiddenException(
        'Only TM and CTO can create admin-only notes',
      );
    }

    return this.prisma.note.create({
      data: {
        content: dto.content,
        isAdminOnly: dto.isAdminOnly || false,
        employeeId: dto.employeeId,
        authorId: user.id,
      },
      include: {
        employee: true,
      },
    });
  }

  async findAll(user: UserContext) {
    const ability = this.abilityFactory.defineAbility(user);

    // accessibleBy automatically filters out admin-only notes for non-TM/CTO users
    const notes = await this.prisma.note.findMany({
      where: accessibleBy(ability, Actions.Read).Note,
      include: {
        employee: true,
      },
    });

    return notes;
  }

  async findOne(id: number, user: UserContext) {
    const ability = this.abilityFactory.defineAbility(user);

    const note = await this.prisma.note.findFirst({
      where: {
        AND: [accessibleBy(ability, Actions.Read).Note, { id }],
      },
      include: {
        employee: true,
      },
    });

    if (!note) {
      throw new NotFoundException('Note not found or access denied');
    }

    return note;
  }

  async update(id: number, dto: UpdateNoteDto, user: UserContext) {
    const ability = this.abilityFactory.defineAbility(user);

    const note = await this.prisma.note.findFirst({
      where: {
        AND: [accessibleBy(ability, Actions.Update).Note, { id }],
      },
    });

    if (!note) {
      throw new NotFoundException('Note not found or access denied');
    }

    return this.prisma.note.update({
      where: { id },
      data: {
        content: dto.content,
        isAdminOnly: dto.isAdminOnly,
        employeeId: dto.employeeId,
      },
      include: {
        employee: true,
      },
    });
  }

  async remove(id: number, user: UserContext) {
    const ability = this.abilityFactory.defineAbility(user);

    const note = await this.prisma.note.findFirst({
      where: {
        AND: [accessibleBy(ability, Actions.Delete).Note, { id }],
      },
    });

    if (!note) {
      throw new NotFoundException('Note not found or access denied');
    }

    return this.prisma.note.delete({
      where: { id },
    });
  }
}
