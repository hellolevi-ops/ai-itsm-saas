import { IsString, IsOptional, IsEnum, Length } from 'class-validator';
import { WorkspaceStatus } from '@prisma/client';

export class CreateWorkspaceDto {
  @IsString()
  @Length(2, 100)
  name: string;

  @IsOptional()
  @IsString()
  @Length(3, 50)
  slug?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  language?: string;
}

export class UpdateWorkspaceDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsEnum(WorkspaceStatus)
  status?: WorkspaceStatus;
}

export class WorkspaceDto {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  timezone: string;
  language: string;
  status: WorkspaceStatus;
  createdAt: Date;
  updatedAt: Date;
}
