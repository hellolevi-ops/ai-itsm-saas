import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { Team } from '@prisma/client';
import { TeamRepository } from '../repositories/team.repository';
import { CreateTeamDto, UpdateTeamDto, TeamDto } from '../dto/team-invitation.dto';

@Injectable()
export class TeamService {
  constructor(private readonly teamRepository: TeamRepository) {}

  async create(dto: CreateTeamDto): Promise<Team> {
    const exists = await this.teamRepository.exists(dto.name);
    if (exists) {
      throw new ConflictException('Team name already exists in this workspace');
    }

    return this.teamRepository.create({
      name: dto.name,
      description: dto.description,
    });
  }

  async findById(id: string): Promise<Team> {
    const team = await this.teamRepository.findById(id);
    if (!team) {
      throw new NotFoundException('Team not found');
    }
    return team;
  }

  async findByName(name: string): Promise<Team | null> {
    return this.teamRepository.findByName(name);
  }

  async findAll(): Promise<Team[]> {
    return this.teamRepository.findAll();
  }

  async update(id: string, dto: UpdateTeamDto): Promise<Team> {
    const team = await this.findById(id);

    if (dto.name && dto.name !== team.name) {
      const exists = await this.teamRepository.exists(dto.name);
      if (exists) {
        throw new ConflictException('Team name already exists in this workspace');
      }
    }

    return this.teamRepository.update(id, dto);
  }

  async delete(id: string): Promise<Team> {
    await this.findById(id);
    return this.teamRepository.delete(id);
  }

  async addMember(teamId: string, userId: string): Promise<void> {
    await this.findById(teamId);
    await this.teamRepository.addMember(teamId, userId);
  }

  async removeMember(teamId: string, userId: string): Promise<void> {
    await this.findById(teamId);
    await this.teamRepository.removeMember(teamId, userId);
  }

  async getMemberIds(teamId: string): Promise<string[]> {
    await this.findById(teamId);
    return this.teamRepository.getTeamMembers(teamId);
  }

  toDto(team: Team): TeamDto {
    return {
      id: team.id,
      workspaceId: team.workspaceId,
      name: team.name,
      description: team.description,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
    };
  }
}
