import { IsUUID } from 'class-validator';
import { RoleType } from '@prisma/client';

export class AddMemberDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  roleId: string;
}

export class UpdateMemberRoleDto {
  @IsUUID()
  roleId: string;
}

export class WorkspaceMemberDto {
  id: string;
  workspaceId: string;
  userId: string;
  roleId: string;
  roleType: RoleType;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
