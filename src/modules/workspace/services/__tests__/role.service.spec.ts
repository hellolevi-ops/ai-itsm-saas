import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { RoleService } from '../role.service';
import { RoleRepository } from '../../repositories/role.repository';
import { RoleType } from '@prisma/client';

const mockRole = {
  id: 'role-001',
  workspaceId: 'ws-001',
  name: 'Custom Role',
  description: 'A custom role',
  roleType: RoleType.AGENT,
  isSystem: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockSystemRole = {
  id: 'role-system',
  workspaceId: 'ws-001',
  name: 'Admin',
  description: 'System admin role',
  roleType: RoleType.ADMIN,
  isSystem: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('RoleService', () => {
  let service: RoleService;
  let roleRepository: jest.Mocked<RoleRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleService,
        {
          provide: RoleRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findByName: jest.fn(),
            findByRoleType: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            exists: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RoleService>(RoleService);
    roleRepository = module.get(RoleRepository) as jest.Mocked<RoleRepository>;
  });

  describe('create', () => {
    it('should create a role successfully', async () => {
      const dto = { name: 'Custom Role', description: 'A custom role', roleType: RoleType.AGENT };
      roleRepository.exists.mockResolvedValue(false);
      roleRepository.create.mockResolvedValue(mockRole);

      const result = await service.create(dto);

      expect(result.name).toBe(dto.name);
      expect(result.roleType).toBe(dto.roleType);
      expect(result.isSystem).toBe(false);
    });

    it('should throw ConflictException when role name exists', async () => {
      const dto = { name: 'Existing Role', roleType: RoleType.AGENT };
      roleRepository.exists.mockResolvedValue(true);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findById', () => {
    it('should return role when found', async () => {
      roleRepository.findById.mockResolvedValue(mockRole);

      const result = await service.findById('role-001');

      expect(result.id).toBe('role-001');
    });

    it('should throw NotFoundException when not found', async () => {
      roleRepository.findById.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByName', () => {
    it('should return role when found', async () => {
      roleRepository.findByName.mockResolvedValue(mockRole);

      const result = await service.findByName('Custom Role');

      expect(result?.name).toBe('Custom Role');
    });

    it('should return null when not found', async () => {
      roleRepository.findByName.mockResolvedValue(null);

      const result = await service.findByName('Non Existent');

      expect(result).toBeNull();
    });
  });

  describe('findByRoleType', () => {
    it('should return system role by role type', async () => {
      roleRepository.findByRoleType.mockResolvedValue(mockSystemRole);

      const result = await service.findByRoleType(RoleType.ADMIN);

      expect(result?.roleType).toBe(RoleType.ADMIN);
      expect(result?.isSystem).toBe(true);
    });
  });

  describe('findAll', () => {
    it('should return all roles', async () => {
      const roles = [mockRole, mockSystemRole];
      roleRepository.findAll.mockResolvedValue(roles);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
    });
  });

  describe('update', () => {
    it('should update role successfully', async () => {
      const dto = { name: 'Updated Role', description: 'Updated description' };
      roleRepository.findById.mockResolvedValue(mockRole);
      roleRepository.exists.mockResolvedValue(false);
      roleRepository.update.mockResolvedValue({ ...mockRole, ...dto });

      const result = await service.update('role-001', dto);

      expect(result.name).toBe('Updated Role');
    });

    it('should throw ConflictException when updating system role', async () => {
      roleRepository.findById.mockResolvedValue(mockSystemRole);

      await expect(service.update('role-system', { name: 'New Name' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException when new name already exists', async () => {
      roleRepository.findById.mockResolvedValue(mockRole);
      roleRepository.exists.mockResolvedValue(true);

      await expect(service.update('role-001', { name: 'Existing Name' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException when role not found', async () => {
      roleRepository.findById.mockResolvedValue(null);

      await expect(service.update('non-existent', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete role successfully', async () => {
      roleRepository.findById.mockResolvedValue(mockRole);
      roleRepository.delete.mockResolvedValue(mockRole);

      const result = await service.delete('role-001');

      expect(result.id).toBe('role-001');
    });

    it('should throw ConflictException when deleting system role', async () => {
      roleRepository.findById.mockResolvedValue(mockSystemRole);

      await expect(service.delete('role-system')).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when role not found', async () => {
      roleRepository.findById.mockResolvedValue(null);

      await expect(service.delete('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('ensureSystemRoles', () => {
    it('should create missing system roles', async () => {
      roleRepository.findByRoleType.mockResolvedValue(null);
      roleRepository.create.mockImplementation((data: any) =>
        Promise.resolve({
          id: 'new-role',
          workspaceId: 'ws-001',
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );

      const result = await service.ensureSystemRoles('ws-001');

      expect(result.OWNER).toBeDefined();
      expect(result.ADMIN).toBeDefined();
      expect(result.AGENT).toBeDefined();
      expect(result.REQUESTER).toBeDefined();
    });

    it('should return existing system roles', async () => {
      roleRepository.findByRoleType.mockResolvedValue(mockSystemRole);

      const result = await service.ensureSystemRoles('ws-001');

      expect(result.ADMIN.id).toBe(mockSystemRole.id);
    });
  });

  describe('toDto', () => {
    it('should convert role to DTO correctly', () => {
      const dto = service.toDto(mockRole);

      expect(dto.id).toBe(mockRole.id);
      expect(dto.workspaceId).toBe(mockRole.workspaceId);
      expect(dto.name).toBe(mockRole.name);
      expect(dto.roleType).toBe(mockRole.roleType);
      expect(dto.isSystem).toBe(false);
    });
  });
});
