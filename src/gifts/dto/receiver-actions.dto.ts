import { IsInt, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ActorDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;
}

export class ChooseOptionDto extends ActorDto {
  @IsInt()
  productId!: number;
}

export class ThankDto extends ActorDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(280)
  message!: string;
}