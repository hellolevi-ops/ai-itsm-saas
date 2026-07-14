import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { WorkspaceMemberService } from '../workspace-member.service';
import { WorkspaceMemberRepository } from '../../repositories/workspace-member.repository';
import { RoleType } from '@prisma/client';

const mockMember = {
  id: 'member-001',
  workspaceId: 'ws-001',
  userId: 'user-001',
  roleId: 'role-001',
  joinedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('WorkspaceMemberService', () => {
  let service: WorkspaceMemberService;
  let memberRepository: jest.Mocked<WorkspaceMemberRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspaceMemberService,
        {
          provide: WorkspaceMemberRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findByIdWithRole: jest.fn(),
            findByUserId: jest.fn(),
            findByUserIdAndWorkspaceId: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
            exists: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<WorkspaceMemberService>(WorkspaceMemberService);
    memberRepository = module.get(
      WorkspaceMemberRepository,
    ) as jest.Mocked<WorkspaceMemberRepository>;
  });

  describe('addMember', () => {
    it('should add a member successfully', async () => {
      const dto = { userId: 'user-001', roleId: 'role-001' };
      memberRepository.exists.mockResolvedValue(false);
      memberRepository.create.mockResolvedValue(mockMember);

      const result = await service.addMember(dto);

      expect(result.userId).toBe(dto.userId);
      expect(result.roleId).toBe(dto.roleId);
      expect(memberRepository.exists).toHaveBeenCalledWith(dto.userId);
      expect(memberRepository.create).toHaveBeenCalled();
    });

    it('should throw ConflictException when user is already a member', async () => {
      const dto = { userId: 'user-001', roleId: 'role-001' };
      memberRepository.exists.mockResolvedValue(true);

      await expect(service.addMember(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findById', () => {
    it('should return member when found', async () => {
      memberRepository.findById.mockResolvedValue(mockMember);

      const result = await service.findById('member-001');

      expect(result.id).toBe('member-001');
    });

    it('should throw NotFoundException when not found', async () => {
      memberRepository.findById.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByIdWithRole', () => {
    it('should return member with role when found', async () => {
      const memberWithRole = { ...mockMember, role: { roleType: RoleType.ADMIN } };
      memberRepository.findByIdWithRole.mockResolvedValue(memberWithRole);

      const result = await service.findByIdWithRole('member-001');

      expect(result.id).toBe('member-001');
      expect(result.role?.roleType).toBe(RoleType.ADMIN);
    });

    it('should throw NotFoundException when not found', async () => {
      memberRepository.findByIdWithRole.mockResolvedValue(null);

      await expect(service.findByIdWithRole('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByUserId', () => {
    it('should return member when found', async () => {
      memberRepository.findByUserId.mockResolvedValue(mockMember);

      const result = await service.findByUserId('user-001');

      expect(result?.userId).toBe('user-001');
    });

    it('should return null when not found', async () => {
      memberRepository.findByUserId.mockResolvedValue(null);

      const result = await service.findByUserId('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByUserIdAndWorkspaceId', () => {
    it('should return member when found', async () => {
      memberRepository.findByUserIdAndWorkspaceId.mockResolvedValue(mockMember);

      const result = await service.findByUserIdAndWorkspaceId('user-001', 'ws-001');

      expect(result?.userId).toBe('user-001');
      expect(memberRepository.findByUserIdAndWorkspaceId).toHaveBeenCalledWith(
        'user-001',
        'ws-001',
      );
    });

    it('should return null when not found', async () => {
      memberRepository.findByUserIdAndWorkspaceId.mockResolvedValue(null);

      const result = await service.findByUserIdAndWorkspaceId('user-001', 'ws-002');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return paginated members', async () => {
      const members = [mockMember];
      memberRepository.findAll.mockResolvedValue(members);
      memberRepository.count.mockResolvedValue(1);

      const result = await service.findAll({ skip: 0, take: 10 });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by roleId', async () => {
      memberRepository.findAll.mockResolvedValue([]);
      memberRepository.count.mockResolvedValue(0);

      await service.findAll({ roleId: 'role-001' });

      expect(memberRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ roleId: 'role-001' }),
      );
    });
  });

  describe('updateRole', () => {
    it('should update member role successfully', async () => {
      const dto = { roleId: 'new-role-id' };
      memberRepository.findById.mockResolvedValue(mockMember);
      memberRepository.update.mockResolvedValue({ ...mockMember, roleId: 'new-role-id' });

      const result = await service.updateRole('member-001', dto);

      expect(result.roleId).toBe('new-role-id');
    });

    it('should throw NotFoundException when member not found', async () => {
      memberRepository.findById.mockResolvedValue(null);

      await expect(service.updateRole('non-existent', { roleId: 'role-001' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeMember', () => {
    it('should remove member successfully', async () => {
      memberRepository.findById.mockResolvedValue(mockMember);
      memberRepository.delete.mockResolvedValue(mockMember);

      const result = await service.removeMember('member-001');

      expect(result.id).toBe('member-001');
    });

    it('should throw NotFoundException when member not found', async () => {
      memberRepository.findById.mockResolvedValue(null);

      await expect(service.removeMember('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('isMember', () => {
    it('should return true when user is a member', async () => {
      memberRepository.exists.mockResolvedValue(true);

      const result = await service.isMember('user-001');

      expect(result).toBe(true);
    });

    it('should return false when user is not a member', async () => {
      memberRepository.exists.mockResolvedValue(false);

      const result = await service.isMember('user-001');

      expect(result).toBe(false);
    });
  });

  describe('toDto', () => {
    it('should convert member to DTO correctly', () => {
      const memberWithRole = { ...mockMember, role: { roleType: RoleType.AGENT } };
      const dto = service.toDto(memberWithRole);

      expect(dto.id).toBe(mockMember.id);
      expect(dto.workspaceId).toBe(mockMember.workspaceId);
      expect(dto.userId).toBe(mockMember.userId);
      expect(dto.roleId).toBe(mockMember.roleId);
      expect(dto.roleType).toBe(RoleType.AGENT);
      expect(dto.joinedAt).toBeInstanceOf(Date);
    });
  });
});
