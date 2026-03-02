import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { UserContext } from '../../ability/ability.factory/ability.factory';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    });
  }

  async validate(payload: any): Promise<UserContext> {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Re-fetch from DB on every request so TM managed-department
    // assignments are always up-to-date without requiring a re-login
    const employee = await this.prisma.employee.findUnique({
      where: { id: payload.sub },
      include: { managedDepartments: true },
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
      departmentId: employee.departmentId ?? undefined,
      managedDepartmentIds,
    };
  }
}
