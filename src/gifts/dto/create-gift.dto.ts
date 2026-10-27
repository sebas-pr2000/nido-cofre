import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateGiftDto {
  @IsString()
  @IsNotEmpty()
  senderId!: string;

  @IsString()
  @IsNotEmpty()
  receiverId!: string;

  @IsInt()
  @Min(20000)
  @Max(2000000)
  budget!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(280)
  message!: string;

  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  @ArrayUnique()
  @IsInt({ each: true })
  productIds!: number[];
}