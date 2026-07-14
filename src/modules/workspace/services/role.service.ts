import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { Role, RoleType } from '@prisma/client';
import { RoleRepository } from '../repositories/role.repository';
import { CreateRoleDto, UpdateRoleDto, RoleDto } from '../dto/role.dto';

@Injectable()
export class RoleService {
  constructor(private readonly roleRepository: RoleRepository) {}

  async create(dto: CreateRoleDto): Promise<Role> {
    const exists = await this.roleRepository.exists(dto.name);
    if (exists) {
      throw new ConflictException('Role name already exists in this workspace');
    }

    return this.roleRepository.create({
      name: dto.name,
      description: dto.description,
      roleType: dto.roleType,
      isSystem: false,
    });
  }

  async findById(id: string): Promise<Role> {
    const role = await this.roleRepository.findById(id);
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }

  async findByName(name: string): Promise<Role | null> {
    return this.roleRepository.findByName(name);
  }

  async findByRoleType(roleType: RoleType): Promise<Role | null> {
    return this.roleRepository.findByRoleType(roleType);
  }

  async findAll(): Promise<Role[]> {
    return this.roleRepository.findAll();
  }

  async update(id: string, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.findById(id);
    if (role.isSystem) {
      throw new ConflictException('Cannot modify system roles');
    }

    if (dto.name && dto.name !== role.name) {
      const exists = await this.roleRepository.exists(dto.name);
      if (exists) {
        throw new ConflictException('Role name already exists in this workspace');
      }
    }

    return this.roleRepository.update(id, dto);
  }

  async delete(id: string): Promise<Role> {
    const role = await this.findById(id);
    if (role.isSystem) {
      throw new ConflictException('Cannot delete system roles');
    }

    return this.roleRepository.delete(id);
  }

  async ensureSystemRoles(_workspaceId: string): Promise<Record<RoleType, Role>> {
    const systemRoles: RoleType[] = [
      RoleType.OWNER,
      RoleType.ADMIN,
      RoleType.AGENT,
      RoleType.REQUESTER,
    ];
    const result = {} as Record<RoleType, Role>;

    for (const roleType of systemRoles) {
      let role = await this.roleRepository.findByRoleType(roleType);
      if (!role) {
        role = await this.roleRepository.create({
          name: this.getDefaultRoleName(roleType),
          description: this.getDefaultRoleDescription(roleType),
          roleType,
          isSystem: true,
        });
      }
      result[roleType] = role;
    }

    return result;
  }

  private getDefaultRoleName(roleType: RoleType): string {
    const names: Record<RoleType, string> = {
      [RoleType.OWNER]: 'Owner',
      [RoleType.ADMIN]: 'Admin',
      [RoleType.AGENT]: 'Agent',
      [RoleType.REQUESTER]: 'Requester',
    };
    return names[roleType];
  }

  private getDefaultRoleDescription(roleType: RoleType): string {
    const descriptions: Record<RoleType, string> = {
      [RoleType.OWNER]: 'Workspace owner with full access',
      [RoleType.ADMIN]: 'Administrator with management access',
      [RoleType.AGENT]: 'Service agent who handles tickets',
      [RoleType.REQUESTER]: 'End user who submits requests',
    };
    return descriptions[roleType];
  }

  toDto(role: Role): RoleDto {
    return {
      id: role.id,
      workspaceId: role.workspaceId,
      name: role.name,
      description: role.description,
      roleType: role.roleType,
      isSystem: role.isSystem,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }
}
