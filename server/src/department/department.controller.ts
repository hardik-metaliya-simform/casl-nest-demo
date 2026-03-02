import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DepartmentService } from './department.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AbilityGuard } from '../common/guards/ability.guard';
import { CheckAbility } from '../common/decorators/check-ability.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Actions } from '../ability/ability.factory/ability.factory';
import type { UserContext } from '../ability/ability.factory/ability.factory';

@ApiTags('departments')
@ApiBearerAuth('JWT-auth')
@Controller('departments')
@UseGuards(JwtAuthGuard, AbilityGuard)
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Post()
  @CheckAbility({ action: Actions.Create, subject: 'Department' })
  @ApiOperation({ summary: 'Create a new department' })
  @ApiResponse({ status: 201, description: 'Department successfully created' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(
    @Body() createDepartmentDto: CreateDepartmentDto,
    @CurrentUser() user: UserContext,
  ) {
    return this.departmentService.create(createDepartmentDto, user);
  }

  @Get()
  // @CheckAbility({ action: Actions.Read, subject: 'Department' })
  @ApiOperation({ summary: 'Get all departments (filtered by permissions)' })
  @ApiResponse({ status: 200, description: 'List of accessible departments' })
  findAll(@CurrentUser() user: UserContext) {
    return this.departmentService.findAll(user);
  }

  @Get(':id')
  @CheckAbility({ action: Actions.Read, subject: 'Department' })
  @ApiOperation({ summary: 'Get department by ID' })
  @ApiResponse({ status: 200, description: 'Department details' })
  @ApiResponse({
    status: 404,
    description: 'Department not found or access denied',
  })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserContext,
  ) {
    return this.departmentService.findOne(id, user);
  }

  @Patch(':id')
  @CheckAbility({ action: Actions.Update, subject: 'Department' })
  @ApiOperation({ summary: 'Update department' })
  @ApiResponse({ status: 200, description: 'Department successfully updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
    @CurrentUser() user: UserContext,
  ) {
    return this.departmentService.update(id, updateDepartmentDto, user);
  }

  @Delete(':id')
  @CheckAbility({ action: Actions.Delete, subject: 'Department' })
  @ApiOperation({ summary: 'Delete department' })
  @ApiResponse({ status: 200, description: 'Department successfully deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserContext,
  ) {
    return this.departmentService.remove(id, user);
  }
}
