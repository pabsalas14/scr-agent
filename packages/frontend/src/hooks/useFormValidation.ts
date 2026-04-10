import { useState, useCallback } from 'react';

export interface ValidationRule {
  validate: (value: any) => boolean;
  message: string;
}

export interface FieldErrors {
  [fieldName: string]: string | null;
}

export interface FormValidationOptions {
  initialValues: Record<string, any>;
  validationRules?: Record<string, ValidationRule[]>;
}

export interface UseFormValidationResult {
  values: Record<string, any>;
  errors: FieldErrors;
  touched: Record<string, boolean>;

  setFieldValue: (field: string, value: any) => void;
  setFieldTouched: (field: string, touched: boolean) => void;
  validateField: (field: string) => string | null;
  validateForm: () => boolean;
  setFieldError: (field: string, error: string | null) => void;
  reset: () => void;

  getFieldProps: (field: string) => {
    value: any;
    onChange: (e: any) => void;
    onBlur: () => void;
  };

  isValid: boolean;
  isFieldValid: (field: string) => boolean;
  isDirty: boolean;
}

export function useFormValidation({
  initialValues,
  validationRules = {},
}: FormValidationOptions): UseFormValidationResult {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  /**
   * Validate a single field against its rules
   */
  const validateField = useCallback(
    (field: string): string | null => {
      const value = values[field];
      const rules = validationRules[field];

      if (!rules || rules.length === 0) {
        return null;
      }

      for (const rule of rules) {
        if (!rule.validate(value)) {
          return rule.message;
        }
      }

      return null;
    },
    [values, validationRules]
  );

  /**
   * Validate entire form
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: FieldErrors = {};
    let hasErrors = false;

    for (const field in validationRules) {
      const error = validateField(field);
      if (error) {
        newErrors[field] = error;
        hasErrors = true;
      } else {
        newErrors[field] = null;
      }
    }

    setErrors(newErrors);
    return !hasErrors;
  }, [validationRules, validateField]);

  /**
   * Set a field's value and validate
   */
  const setFieldValue = useCallback(
    (field: string, value: any) => {
      setValues((prev) => ({
        ...prev,
        [field]: value,
      }));

      // Auto-validate if field has been touched
      if (touched[field]) {
        const error = validateField(field);
        setErrors((prev) => ({
          ...prev,
          [field]: error,
        }));
      }
    },
    [touched, validateField]
  );

  /**
   * Mark field as touched and validate
   */
  const setFieldTouched = useCallback(
    (field: string, isTouched: boolean) => {
      setTouched((prev) => ({
        ...prev,
        [field]: isTouched,
      }));

      if (isTouched) {
        const error = validateField(field);
        setErrors((prev) => ({
          ...prev,
          [field]: error,
        }));
      }
    },
    [validateField]
  );

  /**
   * Manually set field error
   */
  const setFieldError = useCallback((field: string, error: string | null) => {
    setErrors((prev) => ({
      ...prev,
      [field]: error,
    }));
  }, []);

  /**
   * Get props for a form field
   */
  const getFieldProps = useCallback(
    (field: string) => ({
      value: values[field] ?? '',
      onChange: (e: any) => {
        const value = e.target?.value ?? e;
        setFieldValue(field, value);
      },
      onBlur: () => setFieldTouched(field, true),
    }),
    [values, setFieldValue, setFieldTouched]
  );

  /**
   * Reset form to initial values
   */
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  /**
   * Check if specific field is valid
   */
  const isFieldValid = useCallback(
    (field: string) => !errors[field],
    [errors]
  );

  /**
   * Check if entire form is valid
   */
  const isValid = Object.values(errors).every((error) => error === null);

  /**
   * Check if form has been modified
   */
  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);

  return {
    values,
    errors,
    touched,
    setFieldValue,
    setFieldTouched,
    validateField,
    validateForm,
    setFieldError,
    reset,
    getFieldProps,
    isValid,
    isFieldValid,
    isDirty,
  };
}

// Common validation rules
export const ValidationRules = {
  required: (message = 'Este campo es requerido'): ValidationRule => ({
    validate: (value) => value !== undefined && value !== null && value !== '',
    message,
  }),

  email: (message = 'Email inválido'): ValidationRule => ({
    validate: (value) => {
      if (!value) return true; // Allow empty for optional fields
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },
    message,
  }),

  minLength: (length: number, message?: string): ValidationRule => ({
    validate: (value) => !value || value.length >= length,
    message: message || `Mínimo ${length} caracteres`,
  }),

  maxLength: (length: number, message?: string): ValidationRule => ({
    validate: (value) => !value || value.length <= length,
    message: message || `Máximo ${length} caracteres`,
  }),

  pattern: (regex: RegExp, message = 'Formato inválido'): ValidationRule => ({
    validate: (value) => !value || regex.test(value),
    message,
  }),

  numeric: (message = 'Debe ser un número'): ValidationRule => ({
    validate: (value) => !value || /^\d+(\.\d+)?$/.test(value),
    message,
  }),

  url: (message = 'URL inválida'): ValidationRule => ({
    validate: (value) => {
      if (!value) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message,
  }),

  match: (
    fieldName: string,
    getOtherValue: () => any,
    message = 'Los campos no coinciden'
  ): ValidationRule => ({
    validate: (value) => value === getOtherValue(),
    message,
  }),

  custom: (validate: (value: any) => boolean, message = 'Validación fallida'): ValidationRule => ({
    validate,
    message,
  }),
};
