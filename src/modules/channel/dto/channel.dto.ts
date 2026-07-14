import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateWeComChannelDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(8)
  token!: string;
}

export class ReceiveWeComMessageDto {
  @IsString()
  @MinLength(1)
  external_message_id!: string;

  @IsString()
  @MinLength(1)
  external_user_id!: string;

  @IsOptional()
  @IsString()
  external_user_name?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsString()
  @MinLength(1)
  text!: string;
}
