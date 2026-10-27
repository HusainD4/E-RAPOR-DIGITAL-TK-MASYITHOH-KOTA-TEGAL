import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSchoolDto {
  @IsNotEmpty({ message: 'foundationId wajib diisi' })
  @IsString()
  foundationId: string;

  @IsOptional()
  @IsString()
  npsn?: string;

  @IsNotEmpty({ message: 'Nama sekolah wajib diisi' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'Alamat sekolah wajib diisi' })
  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  headmasterId?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;
}

export class UpdateSchoolDto {
  @IsOptional()
  @IsString()
  npsn?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  headmasterId?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;
}
