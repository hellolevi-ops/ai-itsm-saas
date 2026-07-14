import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator';
import { TicketPriority } from '@prisma/client';

export class CreateServiceCatalogItemDto {
  @IsString()
  @Length(1, 120)
  name: string;

  @IsString()
  @Length(1, 1000)
  description: string;

  @IsOptional()
  @IsString()
  @Length(1, 80)
  category?: string;

  @IsOptional()
  @IsEnum(TicketPriority)
  default_priority?: TicketPriority;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(15)
  @Max(43200)
  response_target_minutes?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(15)
  @Max(43200)
  resolution_target_minutes?: number;
}

export class CreateRequestTemplateDto {
  @IsUUID()
  service_catalog_item_id: string;

  @IsString()
  @Length(1, 120)
  name: string;

  @IsOptional()
  @IsString()
  @Length(1, 1000)
  description?: string;

  @IsString()
  @Length(1, 120)
  default_title: string;

  @IsString()
  @Length(1, 10000)
  default_description: string;

  @IsOptional()
  @IsEnum(TicketPriority)
  default_priority?: TicketPriority;

  @IsOptional()
  @IsString()
  @Length(1, 80)
  default_category?: string;
}
