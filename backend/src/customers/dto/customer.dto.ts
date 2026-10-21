import {
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { Trim, TrimToNull } from '../../common/transformers/string.transformers.js';
import { IsPastIsoDate } from '../../common/validators/is-past-iso-date.validator.js';
import { Gender } from '../../generated/prisma/enums.js';

/** Payload tambah pelanggan. PUT memakai payload lengkap yang sama. */
export class CreateCustomerDto {
  /** @example Budi Santoso */
  @Trim()
  @IsString({ message: 'Nama pelanggan wajib diisi' })
  @IsNotEmpty({ message: 'Nama pelanggan wajib diisi' })
  @MaxLength(150, { message: 'Nama pelanggan maksimal 150 karakter' })
  customer_name: string;

  /** @example Jl. Merdeka No. 1, Jakarta */
  @Trim()
  @IsString({ message: 'Alamat wajib diisi' })
  @IsNotEmpty({ message: 'Alamat wajib diisi' })
  @MaxLength(255, { message: 'Alamat maksimal 255 karakter' })
  customer_address: string;

  /** @example Pria */
  @IsEnum(Gender, { message: 'Jenis kelamin harus Pria atau Wanita' })
  gender: Gender;

  /** Format YYYY-MM-DD, tidak boleh di masa depan. @example 1995-02-10 */
  @IsPastIsoDate({ message: 'Tanggal lahir harus berformat YYYY-MM-DD dan tidak di masa depan' })
  birth_date: string;

  /** Opsional; string kosong disimpan sebagai null. @example 081234567890 */
  @TrimToNull()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @MaxLength(20, { message: 'Nomor HP maksimal 20 karakter' })
  @Matches(/^(\+62|62|0)8\d{7,12}$/, {
    message: 'Format nomor HP tidak valid (contoh: 081234567890)',
  })
  phone?: string | null;
}

export class UpdateCustomerDto extends CreateCustomerDto {}
