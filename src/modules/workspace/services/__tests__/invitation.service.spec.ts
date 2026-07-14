import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { InvitationService } from '../invitation.service';
import { InvitationRepository } from '../../repositories/invitation.repository';
import { InvitationStatus } from '@prisma/client';

const createMockInvitation = (status: InvitationStatus = InvitationStatus.PENDING) => ({
  id: 'inv-001',
  workspaceId: 'ws-001',
  email: 'test@example.com',
  roleId: 'role-001',
  invitedById: 'user-001',
  expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
  acceptedAt: null,
  status,
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('InvitationService', () => {
  let service: InvitationService;
  let invitationRepository: jest.Mocked<InvitationRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitationService,
        {
          provide: InvitationRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findByEmail: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<InvitationService>(InvitationService);
    invitationRepository = module.get(InvitationRepository) as jest.Mocked<InvitationRepository>;
  });

  describe('create', () => {
    it('should create an invitation successfully', async () => {
      const dto = { email: 'new@example.com', roleId: 'role-001' };
      const invitedById = 'user-001';
      invitationRepository.findByEmail.mockResolvedValue(null);
      invitationRepository.create.mockResolvedValue(createMockInvitation(InvitationStatus.PENDING));

      const result = await service.create(dto, invitedById);

      expect(result.email).toBe('test@example.com');
      expect(result.status).toBe(InvitationStatus.PENDING);
      expect(invitationRepository.findByEmail).toHaveBeenCalledWith(
        dto.email,
        InvitationStatus.PENDING,
      );
    });

    it('should set expiration to 72 hours', async () => {
      const dto = { email: 'new@example.com', roleId: 'role-001' };
      invitationRepository.findByEmail.mockResolvedValue(null);
      invitationRepository.create.mockResolvedValue(createMockInvitation(InvitationStatus.PENDING));

      await service.create(dto, 'user-001');

      expect(invitationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: InvitationStatus.PENDING,
        }),
      );
    });

    it('should throw ConflictException when pending invitation exists', async () => {
      const dto = { email: 'existing@example.com', roleId: 'role-001' };
      invitationRepository.findByEmail.mockResolvedValue(createMockInvitation());

      await expect(service.create(dto, 'user-001')).rejects.toThrow(ConflictException);
    });
  });

  describe('findById', () => {
    it('should return invitation when found', async () => {
      const invitation = createMockInvitation();
      invitationRepository.findById.mockResolvedValue(invitation);

      const result = await service.findById('inv-001');

      expect(result.id).toBe('inv-001');
    });

    it('should throw NotFoundException when not found', async () => {
      invitationRepository.findById.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated invitations', async () => {
      const invitations = [createMockInvitation()];
      invitationRepository.findAll.mockResolvedValue(invitations);
      invitationRepository.count.mockResolvedValue(1);

      const result = await service.findAll({ skip: 0, take: 10 });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by status', async () => {
      invitationRepository.findAll.mockResolvedValue([]);
      invitationRepository.count.mockResolvedValue(0);

      await service.findAll({ status: InvitationStatus.PENDING });

      expect(invitationRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ status: InvitationStatus.PENDING }),
      );
    });
  });

  describe('revoke', () => {
    it('should revoke a pending invitation', async () => {
      const invitation = createMockInvitation(InvitationStatus.PENDING);
      invitationRepository.findById.mockResolvedValue(invitation);
      invitationRepository.update.mockResolvedValue({
        ...invitation,
        status: InvitationStatus.REVOKED,
      });

      const result = await service.revoke('inv-001');

      expect(result.status).toBe(InvitationStatus.REVOKED);
    });

    it('should throw ConflictException when invitation is not pending', async () => {
      const invitation = createMockInvitation(InvitationStatus.ACCEPTED);
      invitationRepository.findById.mockResolvedValue(invitation);

      await expect(service.revoke('inv-001')).rejects.toThrow(ConflictException);
    });
  });

  describe('accept', () => {
    it('should accept a valid pending invitation', async () => {
      const invitation = createMockInvitation(InvitationStatus.PENDING);
      invitationRepository.findById.mockResolvedValue(invitation);
      invitationRepository.update.mockResolvedValue({
        ...invitation,
        status: InvitationStatus.ACCEPTED,
        acceptedAt: new Date(),
      });

      const result = await service.accept('inv-001');

      expect(result.status).toBe(InvitationStatus.ACCEPTED);
      expect(result.acceptedAt).not.toBeNull();
    });

    it('should mark as expired if past expiration', async () => {
      const expiredInvitation = createMockInvitation(InvitationStatus.PENDING);
      expiredInvitation.expiresAt = new Date(Date.now() - 1000);
      invitationRepository.findById.mockResolvedValue(expiredInvitation);
      invitationRepository.update.mockResolvedValue({
        ...expiredInvitation,
        status: InvitationStatus.EXPIRED,
      });

      const result = await service.accept('inv-001');

      expect(result.status).toBe(InvitationStatus.EXPIRED);
    });

    it('should throw ConflictException when invitation is not pending', async () => {
      const invitation = createMockInvitation(InvitationStatus.ACCEPTED);
      invitationRepository.findById.mockResolvedValue(invitation);

      await expect(service.accept('inv-001')).rejects.toThrow(ConflictException);
    });
  });

  describe('isExpired', () => {
    it('should return false for active invitation', () => {
      const invitation = createMockInvitation();
      expect(service.isExpired(invitation)).toBe(false);
    });

    it('should return true for expired invitation', () => {
      const invitation = createMockInvitation();
      invitation.expiresAt = new Date(Date.now() - 1000);
      expect(service.isExpired(invitation)).toBe(true);
    });
  });

  describe('toDto', () => {
    it('should convert invitation to DTO correctly', () => {
      const invitation = createMockInvitation();
      const dto = service.toDto(invitation);

      expect(dto.id).toBe(invitation.id);
      expect(dto.workspaceId).toBe(invitation.workspaceId);
      expect(dto.email).toBe(invitation.email);
      expect(dto.roleId).toBe(invitation.roleId);
      expect(dto.status).toBe(invitation.status);
    });
  });
});
