import {
  IsBooleanString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { TicketMessageVisibility, TicketPriority, TicketStatus } from '@prisma/client';

export class CreateTicketDto {
  @IsString()
  @Length(1, 120)
  title: string;

  @IsString()
  @Length(1, 10000)
  description: string;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @IsOptional()
  @IsString()
  @Length(1, 80)
  category?: string;
}

export class ListTicketsQueryDto {
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @IsOptional()
  @IsUUID()
  assignee_id?: string;

  @IsOptional()
  @IsBooleanString()
  mine?: string;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  page_size?: number;
}

export class UpdateTicketDto {
  @IsOptional()
  @IsString()
  @Length(1, 120)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(1, 10000)
  description?: string;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @IsOptional()
  @IsString()
  @Length(1, 80)
  category?: string;
}

export class AssignTicketDto {
  @IsUUID()
  assignee_id: string;
}

export class AddTicketMessageDto {
  @IsEnum(TicketMessageVisibility)
  visibility: TicketMessageVisibility;

  @IsString()
  @Length(1, 10000)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  body: string;
}

export class ChangeTicketStatusDto {
  @IsEnum(TicketStatus)
  status: TicketStatus;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  reason?: string;
}
