import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { TeamService } from '../team.service';
import { TeamRepository } from '../../repositories/team.repository';

const mockTeam = {
  id: 'team-001',
  workspaceId: 'ws-001',
  name: 'Engineering',
  description: 'Engineering team',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('TeamService', () => {
  let service: TeamService;
  let teamRepository: jest.Mocked<TeamRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamService,
        {
          provide: TeamRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findByName: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            exists: jest.fn(),
            addMember: jest.fn(),
            removeMember: jest.fn(),
            getTeamMembers: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TeamService>(TeamService);
    teamRepository = module.get(TeamRepository) as jest.Mocked<TeamRepository>;
  });

  describe('create', () => {
    it('should create a team successfully', async () => {
      const dto = { name: 'Engineering', description: 'Engineering team' };
      teamRepository.exists.mockResolvedValue(false);
      teamRepository.create.mockResolvedValue(mockTeam);

      const result = await service.create(dto);

      expect(result.name).toBe(dto.name);
      expect(teamRepository.exists).toHaveBeenCalledWith(dto.name);
    });

    it('should throw ConflictException when team name exists', async () => {
      const dto = { name: 'Existing Team' };
      teamRepository.exists.mockResolvedValue(true);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findById', () => {
    it('should return team when found', async () => {
      teamRepository.findById.mockResolvedValue(mockTeam);

      const result = await service.findById('team-001');

      expect(result.id).toBe('team-001');
    });

    it('should throw NotFoundException when not found', async () => {
      teamRepository.findById.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all teams', async () => {
      const teams = [mockTeam];
      teamRepository.findAll.mockResolvedValue(teams);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('should update team successfully', async () => {
      const dto = { name: 'Updated Team', description: 'Updated description' };
      teamRepository.findById.mockResolvedValue(mockTeam);
      teamRepository.exists.mockResolvedValue(false);
      teamRepository.update.mockResolvedValue({ ...mockTeam, ...dto });

      const result = await service.update('team-001', dto);

      expect(result.name).toBe('Updated Team');
    });

    it('should throw ConflictException when new name exists', async () => {
      teamRepository.findById.mockResolvedValue(mockTeam);
      teamRepository.exists.mockResolvedValue(true);

      await expect(service.update('team-001', { name: 'Existing' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('delete', () => {
    it('should delete team successfully', async () => {
      teamRepository.findById.mockResolvedValue(mockTeam);
      teamRepository.delete.mockResolvedValue(mockTeam);

      const result = await service.delete('team-001');

      expect(result.id).toBe('team-001');
    });

    it('should throw NotFoundException when team not found', async () => {
      teamRepository.findById.mockResolvedValue(null);

      await expect(service.delete('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('addMember', () => {
    it('should add member to team', async () => {
      teamRepository.findById.mockResolvedValue(mockTeam);
      teamRepository.addMember.mockResolvedValue(undefined);

      await service.addMember('team-001', 'user-001');

      expect(teamRepository.addMember).toHaveBeenCalledWith('team-001', 'user-001');
    });

    it('should throw NotFoundException when team not found', async () => {
      teamRepository.findById.mockResolvedValue(null);

      await expect(service.addMember('non-existent', 'user-001')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeMember', () => {
    it('should remove member from team', async () => {
      teamRepository.findById.mockResolvedValue(mockTeam);
      teamRepository.removeMember.mockResolvedValue(undefined);

      await service.removeMember('team-001', 'user-001');

      expect(teamRepository.removeMember).toHaveBeenCalledWith('team-001', 'user-001');
    });
  });

  describe('getMemberIds', () => {
    it('should return member user IDs', async () => {
      teamRepository.findById.mockResolvedValue(mockTeam);
      teamRepository.getTeamMembers.mockResolvedValue(['user-001', 'user-002']);

      const result = await service.getMemberIds('team-001');

      expect(result).toEqual(['user-001', 'user-002']);
    });
  });

  describe('toDto', () => {
    it('should convert team to DTO correctly', () => {
      const dto = service.toDto(mockTeam);

      expect(dto.id).toBe(mockTeam.id);
      expect(dto.workspaceId).toBe(mockTeam.workspaceId);
      expect(dto.name).toBe(mockTeam.name);
      expect(dto.description).toBe(mockTeam.description);
    });
  });
});
