import { useState } from 'react';
import { ZodSchema } from 'zod';

interface UseFormValidationResult<T> {
  errors: Record<string, string>;
  validateForm: (data: T) => boolean;
}

export function useFormValidation<T>(schema: ZodSchema<T>): UseFormValidationResult<T> {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (data: T): boolean => {
    const result = schema.safeParse(data);
    
    if (!result.success) {
      const formattedErrors: Record<string, string> = {};
      result.error.issues.forEach((error) => {
        const path = error.path.join('.');
        formattedErrors[path] = error.message;
      });
      setErrors(formattedErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  return { errors, validateForm };
}