import { registerDecorator, type ValidationOptions } from 'class-validator';
import { toJakartaIsoDate } from '../utils/jakarta-date.js';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** true jika "YYYY-MM-DD" adalah tanggal kalender yang benar-benar ada (tolak 2026-02-30). */
export function isRealIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

/** Tanggal "YYYY-MM-DD" valid dan tidak di masa depan (acuan: hari ini WIB). */
export function IsPastIsoDate(options?: ValidationOptions): PropertyDecorator {
  return (target, propertyName) => {
    registerDecorator({
      name: 'isPastIsoDate',
      target: target.constructor,
      propertyName: propertyName as string,
      options,
      validator: {
        validate: (value: unknown) =>
          isRealIsoDate(value) && value <= toJakartaIsoDate(new Date()),
      },
    });
  };
}

/** Tanggal "YYYY-MM-DD" valid (untuk filter rentang tanggal). */
export function IsIsoDate(options?: ValidationOptions): PropertyDecorator {
  return (target, propertyName) => {
    registerDecorator({
      name: 'isIsoDate',
      target: target.constructor,
      propertyName: propertyName as string,
      options,
      validator: { validate: isRealIsoDate },
    });
  };
}
