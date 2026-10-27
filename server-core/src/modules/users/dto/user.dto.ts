import { IsNotEmpty, IsOptional, IsString, IsEnum, MinLength, IsEmail, IsBoolean } from 'class-validator';
import { Role } from '../../../common/constants';

export class CreateUserDto {
  @IsNotEmpty({ message: 'Username wajib diisi' })
  @IsString()
  username: string;

  @IsOptional()
  @IsEmail({}, { message: 'Format email tidak valid' })
  email?: string;

  @IsNotEmpty({ message: 'Nomor telepon wajib diisi' })
  @IsString()
  phoneNumber: string;

  @IsNotEmpty({ message: 'Password wajib diisi' })
  @IsString()
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password: string;

  @IsNotEmpty({ message: 'Role wajib ditentukan' })
  @IsEnum(Role, { message: 'Role tidak valid' })
  role: Role;

  @IsOptional()
  @IsString()
  schoolId?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsEmail({}, { message: 'Format email tidak valid' })
  email?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password?: string;

  @IsOptional()
  @IsEnum(Role, { message: 'Role tidak valid' })
  role?: Role;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  schoolId?: string;
}
