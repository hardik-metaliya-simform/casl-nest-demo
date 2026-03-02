import {
  IsEmail,
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  IsDateString,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEmployeeDto {
  @ApiProperty({
    example: 'jane.smith@example.com',
    description: 'Employee email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'Employee password',
  })
  @IsString()
  password: string;

  @ApiPropertyOptional({
    example: 'Jane Smith',
    description: 'Employee full name',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: '2020-06-15',
    description: 'Career start date (ISO 8601 format)',
  })
  @IsOptional()
  @IsDateString()
  careerStartDate?: string;

  @ApiPropertyOptional({
    example: 75000,
    description: 'Employee salary (only CTO can set/view)',
  })
  @IsOptional()
  @IsNumber()
  salary?: number;

  @ApiPropertyOptional({
    example: ['Employee'],
    description: 'Employee roles',
    isArray: true,
    enum: ['Employee', 'RM', 'TM', 'CTO'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles?: string[];

  @ApiPropertyOptional({
    example: [1, 2],
    description: 'Department IDs (employee can belong to multiple departments)',
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  departmentIds?: number[];

  @ApiPropertyOptional({
    example: 2,
    description: 'Reporting manager employee ID',
  })
  @IsOptional()
  @IsInt()
  reportingManagerId?: number;
}
