import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { WorkspaceService } from '../workspace.service';
import {
  WorkspaceRepository,
  TenantWorkspaceRepository,
} from '../../repositories/workspace.repository';
import { WorkspaceStatus } from '@prisma/client';

const mockWorkspace = {
  id: 'ws-001',
  name: 'Test Workspace',
  slug: 'test-workspace',
  timezone: 'Asia/Shanghai',
  language: 'zh-CN',
  status: WorkspaceStatus.ACTIVE,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('WorkspaceService', () => {
  let service: WorkspaceService;
  let workspaceRepository: jest.Mocked<WorkspaceRepository>;
  let tenantWorkspaceRepository: jest.Mocked<TenantWorkspaceRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspaceService,
        {
          provide: WorkspaceRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findBySlug: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            countByStatus: jest.fn(),
          },
        },
        {
          provide: TenantWorkspaceRepository,
          useValue: {
            findCurrent: jest.fn(),
            updateCurrent: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<WorkspaceService>(WorkspaceService);
    workspaceRepository = module.get(WorkspaceRepository) as jest.Mocked<WorkspaceRepository>;
    tenantWorkspaceRepository = module.get(
      TenantWorkspaceRepository,
    ) as jest.Mocked<TenantWorkspaceRepository>;
  });

  describe('create', () => {
    it('should create a workspace successfully', async () => {
      const createDto = { name: 'New Workspace', slug: 'new-workspace' };
      workspaceRepository.findBySlug.mockResolvedValue(null);
      workspaceRepository.create.mockResolvedValue({ ...mockWorkspace, ...createDto });

      const result = await service.create(createDto);

      expect(result.name).toBe(createDto.name);
      expect(result.slug).toBe(createDto.slug);
      expect(workspaceRepository.findBySlug).toHaveBeenCalledWith(createDto.slug);
      expect(workspaceRepository.create).toHaveBeenCalled();
    });

    it('should throw ConflictException when slug already exists', async () => {
      const createDto = { name: 'Test', slug: 'existing-slug' };
      workspaceRepository.findBySlug.mockResolvedValue(mockWorkspace);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });

    it('should use default timezone and language', async () => {
      const createDto = { name: 'New Workspace', slug: 'new-workspace' };
      workspaceRepository.findBySlug.mockResolvedValue(null);
      workspaceRepository.create.mockResolvedValue({
        ...mockWorkspace,
        ...createDto,
      });

      await service.create(createDto);

      expect(workspaceRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          timezone: 'Asia/Shanghai',
          language: 'zh-CN',
        }),
      );
    });

    it('should use provided timezone and language', async () => {
      const createDto = {
        name: 'New Workspace',
        slug: 'new-workspace',
        timezone: 'America/New_York',
        language: 'en-US',
      };
      workspaceRepository.findBySlug.mockResolvedValue(null);
      workspaceRepository.create.mockResolvedValue({
        ...mockWorkspace,
        ...createDto,
      });

      await service.create(createDto);

      expect(workspaceRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          timezone: 'America/New_York',
          language: 'en-US',
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return workspace when found', async () => {
      workspaceRepository.findById.mockResolvedValue(mockWorkspace);

      const result = await service.findById('ws-001');

      expect(result.id).toBe('ws-001');
      expect(workspaceRepository.findById).toHaveBeenCalledWith('ws-001');
    });

    it('should throw NotFoundException when not found', async () => {
      workspaceRepository.findById.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBySlug', () => {
    it('should return workspace when found', async () => {
      workspaceRepository.findBySlug.mockResolvedValue(mockWorkspace);

      const result = await service.findBySlug('test-workspace');

      expect(result?.slug).toBe('test-workspace');
    });

    it('should return null when not found', async () => {
      workspaceRepository.findBySlug.mockResolvedValue(null);

      const result = await service.findBySlug('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return paginated workspaces', async () => {
      const workspaces = [mockWorkspace];
      workspaceRepository.findAll.mockResolvedValue(workspaces);
      workspaceRepository.countByStatus.mockResolvedValue(1);

      const result = await service.findAll({ skip: 0, take: 10 });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by status', async () => {
      workspaceRepository.findAll.mockResolvedValue([]);
      workspaceRepository.countByStatus.mockResolvedValue(0);

      await service.findAll({ status: WorkspaceStatus.ACTIVE });

      expect(workspaceRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ status: WorkspaceStatus.ACTIVE }),
      );
      expect(workspaceRepository.countByStatus).toHaveBeenCalledWith(WorkspaceStatus.ACTIVE);
    });
  });

  describe('update', () => {
    it('should update workspace successfully', async () => {
      const updateDto = { name: 'Updated Name' };
      workspaceRepository.findById.mockResolvedValue(mockWorkspace);
      workspaceRepository.update.mockResolvedValue({ ...mockWorkspace, ...updateDto });

      const result = await service.update('ws-001', updateDto);

      expect(result.name).toBe('Updated Name');
      expect(workspaceRepository.update).toHaveBeenCalledWith('ws-001', updateDto);
    });

    it('should throw NotFoundException when workspace not found', async () => {
      workspaceRepository.findById.mockResolvedValue(null);

      await expect(service.update('non-existent', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should soft delete workspace by setting status to DELETED', async () => {
      workspaceRepository.findById.mockResolvedValue(mockWorkspace);
      workspaceRepository.delete.mockResolvedValue({
        ...mockWorkspace,
        status: WorkspaceStatus.DELETED,
      });

      const result = await service.delete('ws-001');

      expect(result.status).toBe(WorkspaceStatus.DELETED);
    });

    it('should throw NotFoundException when workspace not found', async () => {
      workspaceRepository.findById.mockResolvedValue(null);

      await expect(service.delete('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('toDto', () => {
    it('should convert workspace to DTO correctly', () => {
      const dto = service.toDto(mockWorkspace);

      expect(dto.id).toBe(mockWorkspace.id);
      expect(dto.name).toBe(mockWorkspace.name);
      expect(dto.slug).toBe(mockWorkspace.slug);
      expect(dto.timezone).toBe(mockWorkspace.timezone);
      expect(dto.language).toBe(mockWorkspace.language);
      expect(dto.status).toBe(mockWorkspace.status);
      expect(dto.createdAt).toBeInstanceOf(Date);
      expect(dto.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('getCurrentWorkspace', () => {
    it('should return current workspace', async () => {
      tenantWorkspaceRepository.findCurrent.mockResolvedValue(mockWorkspace);

      const result = await service.getCurrentWorkspace();

      expect(result.id).toBe('ws-001');
      expect(tenantWorkspaceRepository.findCurrent).toHaveBeenCalled();
    });

    it('should throw NotFoundException when current workspace not found', async () => {
      tenantWorkspaceRepository.findCurrent.mockResolvedValue(null);

      await expect(service.getCurrentWorkspace()).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateCurrentWorkspace', () => {
    it('should update current workspace', async () => {
      const updateDto = { name: 'Updated Workspace' };
      tenantWorkspaceRepository.updateCurrent.mockResolvedValue({
        ...mockWorkspace,
        ...updateDto,
      });

      const result = await service.updateCurrentWorkspace(updateDto);

      expect(result.name).toBe('Updated Workspace');
      expect(tenantWorkspaceRepository.updateCurrent).toHaveBeenCalledWith(updateDto);
    });
  });
});
