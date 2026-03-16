const PHONE_DIGITS_REGEX = /^\d{10}$/;

export const normalizeUsPhoneDigits = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  const nationalNumber = digits.startsWith('1') ? digits.slice(1) : digits;
  return nationalNumber.slice(0, 10);
};

export const formatUsPhoneE164 = (digits: string): string =>
  `+1${normalizeUsPhoneDigits(digits)}`;

export const isValidUsPhoneDigits = (value: string): boolean =>
  PHONE_DIGITS_REGEX.test(normalizeUsPhoneDigits(value));
