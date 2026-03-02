import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsInt,
  IsDateString,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Employee email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'Employee password (minimum 6 characters)',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Employee full name',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: ['Employee'],
    description: 'Employee roles (Employee, RM, TM, CTO)',
    isArray: true,
    enum: ['Employee', 'RM', 'TM', 'CTO'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles?: string[];

  @ApiPropertyOptional({
    example: 1,
    description: 'Department ID',
  })
  @IsOptional()
  @IsInt()
  departmentId?: number;

  @ApiPropertyOptional({
    example: 2,
    description: 'Reporting manager employee ID',
  })
  @IsOptional()
  @IsInt()
  reportingManagerId?: number;

  @ApiPropertyOptional({
    example: '2020-01-01',
    description: 'Career start date (ISO 8601 format)',
  })
  @IsOptional()
  @IsDateString()
  careerStartDate?: string;
}
