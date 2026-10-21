import { HttpException, HttpStatus } from '@nestjs/common';

/** Error per field dengan kunci dot-notation, mis. "items.0.quantity". */
export type FieldErrors = Record<string, string[]>;

/**
 * Error bisnis yang membawa `errors` per field agar frontend bisa
 * menempelkannya langsung ke input yang bermasalah.
 */
export class ApiException extends HttpException {
  constructor(status: HttpStatus, message: string, errors?: FieldErrors) {
    super({ message, errors }, status);
  }
}

export class ValidationFailedException extends ApiException {
  constructor(errors: FieldErrors, message = 'Data tidak valid') {
    super(HttpStatus.UNPROCESSABLE_ENTITY, message, errors);
  }
}
