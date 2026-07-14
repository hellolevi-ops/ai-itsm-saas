import { IsString, IsOptional, Length, IsUUID, IsEmail } from 'class-validator';
import { InvitationStatus } from '@prisma/client';

export class CreateTeamDto {
  @IsString()
  @Length(2, 50)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateTeamDto {
  @IsOptional()
  @IsString()
  @Length(2, 50)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class TeamDto {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class CreateInvitationDto {
  @IsEmail()
  email: string;

  @IsUUID()
  roleId: string;
}

export class InvitationDto {
  id: string;
  workspaceId: string;
  email: string;
  roleId: string;
  invitedById: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  status: InvitationStatus;
  createdAt: Date;
  updatedAt: Date;
}
