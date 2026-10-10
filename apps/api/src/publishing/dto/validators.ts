import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsIanaTimezone(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isIanaTimezone',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: `${propertyName} must be a valid IANA timezone identifier (e.g., 'UTC', 'America/New_York', 'Asia/Kolkata')`,
        ...validationOptions,
      },
      validator: {
        validate(value: any, _args: ValidationArguments) {
          if (value === undefined || value === null || value === '') return true;
          if (typeof value !== 'string') return false;
          try {
            Intl.DateTimeFormat(undefined, { timeZone: value });
            return true;
          } catch {
            return false;
          }
        },
      },
    });
  };
}

export function IsMinFiveMinutesInFuture(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isMinFiveMinutesInFuture',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: `${propertyName} must be scheduled at least 5 minutes in the future`,
        ...validationOptions,
      },
      validator: {
        validate(value: any, _args: ValidationArguments) {
          if (!value) return false;
          const date = new Date(value);
          if (isNaN(date.getTime())) return false;
          const minTime = Date.now() + 4.5 * 60 * 1000; // 4.5m to allow slight clock drift
          return date.getTime() >= minTime;
        },
      },
    });
  };
}
