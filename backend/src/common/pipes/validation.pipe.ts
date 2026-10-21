import { ValidationError, ValidationPipe } from '@nestjs/common';
import {
  FieldErrors,
  ValidationFailedException,
} from '../exceptions/api.exception.js';

/** Ratakan error class-validator bertingkat menjadi { "items.0.quantity": [...] }. */
export function flattenValidationErrors(
  errors: ValidationError[],
  parent = '',
  result: FieldErrors = {},
): FieldErrors {
  for (const error of errors) {
    const path = parent ? `${parent}.${error.property}` : error.property;
    if (error.constraints) {
      result[path] = [...(result[path] ?? []), ...Object.values(error.constraints)];
    }
    if (error.children?.length) {
      flattenValidationErrors(error.children, path, result);
    }
  }
  return result;
}

export const createValidationPipe = () =>
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) =>
      new ValidationFailedException(flattenValidationErrors(errors)),
  });
