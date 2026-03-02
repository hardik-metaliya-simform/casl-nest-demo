import { IsInt, IsArray, ArrayNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateManagedDepartmentDto {
  @ApiProperty({
    example: 1,
    description: 'Employee ID (typically a TM)',
  })
  @IsInt()
  employeeId: number;

  @ApiProperty({
    example: [1, 2],
    description: 'One or more Department IDs to assign to this employee',
    type: [Number],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  departmentIds: number[];
}
