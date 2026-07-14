import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { BetaFeedbackSeverity, BetaFeedbackType } from '@prisma/client';

export class CreateBetaFeedbackDto {
  @IsEnum(BetaFeedbackType)
  type!: BetaFeedbackType;

  @IsEnum(BetaFeedbackSeverity)
  @IsOptional()
  severity?: BetaFeedbackSeverity;

  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(4000)
  description!: string;
}

export class UpdateFeatureFlagDto {
  @IsBoolean()
  enabled!: boolean;
}
