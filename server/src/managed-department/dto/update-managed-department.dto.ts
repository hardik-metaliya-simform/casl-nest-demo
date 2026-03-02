import { IsInt, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateManagedDepartmentDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Employee ID (typically a TM)',
  })
  @IsOptional()
  @IsInt()
  employeeId?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Department ID to be managed',
  })
  @IsOptional()
  @IsInt()
  departmentId?: number;
}
