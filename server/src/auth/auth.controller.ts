import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/create-auth.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UserContext } from '../ability/ability.factory/ability.factory';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new employee' })
  @ApiResponse({ status: 201, description: 'Employee successfully registered' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Successfully authenticated',
    schema: {
      properties: {
        accessToken: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            email: { type: 'string' },
            name: { type: 'string' },
            role: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user information' })
  @ApiResponse({ status: 200, description: 'Current user information' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMe(@CurrentUser() user: UserContext) {
    return user;
  }

  @Get('abilities')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user abilities and permissions' })
  @ApiResponse({ status: 200, description: 'User abilities and permissions' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getAbilities(@CurrentUser() user: UserContext) {
    return this.authService.getAbilities(user);
  }

  @Get('packed-rules')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get CASL packed rules for the current user' })
  @ApiResponse({ status: 200, description: 'Packed CASL rules array' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getPackedRules(@CurrentUser() user: UserContext) {
    return this.authService.getPackedRules(user);
  }
}
