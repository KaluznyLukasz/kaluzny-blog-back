import { ValidationOptions, registerDecorator } from 'class-validator';

// A date that cannot be read passes: the other rules on the field report that. Only a readable date later than now fails.
export function IsNotInFuture(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return function (object, propertyName) {
    registerDecorator({
      name: 'isNotInFuture',
      target: object.constructor,
      propertyName: String(propertyName),
      options: {
        message: `${String(propertyName)} must not be in the future`,
        ...validationOptions,
      },
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') {
            return true;
          }

          const time = new Date(value).getTime();

          return Number.isNaN(time) || time <= Date.now();
        },
      },
    });
  };
}
