import { BadRequestException } from '@nestjs/common';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const NAME_MAX = 120;
export const EMAIL_MAX = 255;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Manual validation (class-validator is not installed and main.ts has no
 * global ValidationPipe). Returns a list of error messages.
 */
export function validateUserFields(
  input: { name?: unknown; email?: unknown; password?: unknown },
  required: boolean,
): string[] {
  const errors: string[] = [];

  if (input.name !== undefined || required) {
    if (
      typeof input.name !== 'string' ||
      input.name.trim().length === 0 ||
      input.name.trim().length > NAME_MAX
    ) {
      errors.push(`name must be a non-empty string (max ${NAME_MAX})`);
    }
  }
  if (input.email !== undefined || required) {
    if (
      typeof input.email !== 'string' ||
      input.email.trim().length > EMAIL_MAX ||
      !EMAIL_REGEX.test(input.email.trim())
    ) {
      errors.push('email must be a valid email address');
    }
  }
  if (input.password !== undefined || required) {
    if (
      typeof input.password !== 'string' ||
      input.password.length < PASSWORD_MIN ||
      input.password.length > PASSWORD_MAX
    ) {
      errors.push(
        `password must be a string of ${PASSWORD_MIN}-${PASSWORD_MAX} characters`,
      );
    }
  }
  return errors;
}

export function assertValid(errors: string[]): void {
  if (errors.length > 0) throw new BadRequestException(errors);
}
