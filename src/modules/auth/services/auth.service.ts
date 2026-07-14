import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { RegisterDto, LoginDto } from '../dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if email already exists globally
    const existingUser = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException({
        code: 'EMAIL_ALREADY_EXISTS',
        message: '邮箱已被注册',
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Create tenant
    const tenant = await this.prisma.tenant.create({
      data: {
        id: uuidv4(),
        name: dto.name || dto.email.split('@')[0],
        slug: `tenant-${Date.now()}`,
      },
    });

    // Create user
    const user = await this.prisma.user.create({
      data: {
        id: uuidv4(),
        email: dto.email,
        passwordHash,
        name: dto.name,
        tenantId: tenant.id,
      },
    });

    // Create default workspace
    const workspace = await this.prisma.workspace.create({
      data: {
        id: uuidv4(),
        name: `${dto.name || 'My'} 的工组区`,
        slug: `workspace-${Date.now()}`,
        tenantId: tenant.id,
      },
    });

    // Create owner role
    const role = await this.prisma.role.create({
      data: {
        id: uuidv4(),
        workspaceId: workspace.id,
        name: 'Owner',
        roleType: 'OWNER',
        isSystem: true,
      },
    });

    // Add user as workspace member
    await this.prisma.workspaceMember.create({
      data: {
        id: uuidv4(),
        workspaceId: workspace.id,
        userId: user.id,
        roleId: role.id,
      },
    });

    // Generate tokens
    const tokens = this.generateTokens(user.id, user.email, user.tenantId);

    return {
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          created_at: user.createdAt.toISOString(),
        },
        token: tokens,
      },
      request_id: uuidv4(),
    };
  }

  async login(dto: LoginDto) {
    // Find user by email (need to find first since email alone is not unique)
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email },
      include: {
        workspaceMembers: {
          include: {
            workspace: true,
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: '邮箱或密码错误',
      });
    }

    // Verify password
    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: '邮箱或密码错误',
      });
    }

    // Generate tokens
    const tokens = this.generateTokens(user.id, user.email, user.tenantId);

    return {
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          created_at: user.createdAt.toISOString(),
        },
        token: tokens,
        workspaces: user.workspaceMembers.map((wm) => ({
          id: wm.workspace.id,
          name: wm.workspace.name,
          slug: wm.workspace.slug,
          role: wm.role.roleType.toLowerCase(),
        })),
      },
      request_id: uuidv4(),
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException({
          code: 'UNAUTHORIZED',
          message: '用户不存在',
        });
      }

      const tokens = this.generateTokens(user.id, user.email, user.tenantId);

      return {
        data: tokens,
        request_id: uuidv4(),
      };
    } catch {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: '刷新令牌无效',
      });
    }
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        workspaceMembers: {
          include: {
            workspace: true,
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: '用户不存在',
      });
    }

    return {
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          created_at: user.createdAt.toISOString(),
        },
        workspaces: user.workspaceMembers.map((wm) => ({
          id: wm.workspace.id,
          name: wm.workspace.name,
          slug: wm.workspace.slug,
          role: wm.role.roleType.toLowerCase(),
        })),
      },
      request_id: uuidv4(),
    };
  }

  private generateTokens(userId: string, email: string, tenantId: string) {
    const payload = {
      sub: userId,
      email,
      tenantId,
    };

    const access_token = this.jwtService.sign(payload, { expiresIn: '1h' });
    const refresh_token = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      access_token,
      refresh_token,
      expires_in: 3600,
    };
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }
}