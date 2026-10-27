import { IsNotEmpty, IsString, IsUUID, Matches } from 'class-validator';

export class CheckoutDto {
  @IsString()
  @IsNotEmpty()
  payerId!: string;

  @Matches(/^\d{16}$/, { message: 'El número de tarjeta debe tener 16 dígitos' })
  cardNumber!: string;

  @IsUUID()
  idempotencyKey!: string;
}