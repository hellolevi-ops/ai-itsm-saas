import { IsString, IsOptional, IsEnum, Length } from 'class-validator';
import { RoleType } from '@prisma/client';

export class CreateRoleDto {
  @IsString()
  @Length(2, 50)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(RoleType)
  roleType: RoleType;
}

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @Length(2, 50)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(RoleType)
  roleType?: RoleType;
}

export class RoleDto {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  roleType: RoleType;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}
