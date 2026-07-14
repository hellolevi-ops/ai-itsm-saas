import { IsEmail, IsEnum, IsOptional, IsString, Length, MinLength } from 'class-validator';
import { RoleType } from '@prisma/client';

export class CreateInvitationDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(RoleType)
  role_type?: RoleType;
}

export class AcceptInvitationDto {
  @IsString()
  @MinLength(16)
  token!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @Length(8, 128)
  password!: string;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  name?: string;
}
