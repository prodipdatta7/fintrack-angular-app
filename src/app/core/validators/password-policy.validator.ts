import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export interface PasswordCriteria {
    id: string;
    label: string;
    met: boolean;
}

export interface PasswordEvaluation {
    hasLength: boolean;
    hasLower: boolean;
    hasUpper: boolean;
    hasDigit: boolean;
    hasSpecial: boolean;
    score: number; // 0 to 5
    percentage: number; // 0 to 100
    strengthTag: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
    strengthLevel: 'none' | 'low' | 'medium' | 'high';
    isValid: boolean;
    criteria: PasswordCriteria[];
}

/**
 * Evaluates password string against Firebase Authentication requirements:
 * - 8 to 24 characters
 * - At least 1 lowercase letter
 * - At least 1 uppercase letter
 * - At least 1 numeric digit
 * - At least 1 special character
 */
export function evaluatePassword(password: string | null | undefined): PasswordEvaluation {
    const val = password || '';

    const hasLength = val.length >= 8 && val.length <= 24;
    const hasLower = /[a-z]/.test(val);
    const hasUpper = /[A-Z]/.test(val);
    const hasDigit = /\d/.test(val);
    const hasSpecial = /[^A-Za-z0-9]/.test(val);

    let score = 0;
    if (hasLength) score++;
    if (hasLower) score++;
    if (hasUpper) score++;
    if (hasDigit) score++;
    if (hasSpecial) score++;

    let strengthTag: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' = 'NONE';
    let strengthLevel: 'none' | 'low' | 'medium' | 'high' = 'none';

    if (val.length === 0) {
        strengthTag = 'NONE';
        strengthLevel = 'none';
    } else if (score <= 2) {
        strengthTag = 'LOW';
        strengthLevel = 'low';
    } else if (score <= 4) {
        strengthTag = 'MEDIUM';
        strengthLevel = 'medium';
    } else {
        strengthTag = 'HIGH';
        strengthLevel = 'high';
    }

    const percentage = val.length === 0 ? 0 : Math.round((score / 5) * 100);
    const isValid = score === 5;

    const criteria: PasswordCriteria[] = [
        {
            id: 'length',
            label: '8 to 24 characters',
            met: hasLength,
        },
        {
            id: 'lower',
            label: 'At least 1 lowercase letter (a-z)',
            met: hasLower,
        },
        {
            id: 'upper',
            label: 'At least 1 uppercase letter (A-Z)',
            met: hasUpper,
        },
        {
            id: 'digit',
            label: 'At least 1 numeric digit (0-9)',
            met: hasDigit,
        },
        {
            id: 'special',
            label: 'At least 1 special character (e.g. !@#$%^&*)',
            met: hasSpecial,
        },
    ];

    return {
        hasLength,
        hasLower,
        hasUpper,
        hasDigit,
        hasSpecial,
        score,
        percentage,
        strengthTag,
        strengthLevel,
        isValid,
        criteria,
    };
}

/**
 * Angular Reactive Forms Validator for strict Firebase password policy.
 */
export function passwordPolicyValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const val = control.value;
        if (!val) return null; // Let Validators.required handle empty values

        const evaluation = evaluatePassword(val);
        if (evaluation.isValid) {
            return null;
        }

        return {
            passwordPolicy: {
                hasLength: evaluation.hasLength,
                hasLower: evaluation.hasLower,
                hasUpper: evaluation.hasUpper,
                hasDigit: evaluation.hasDigit,
                hasSpecial: evaluation.hasSpecial,
                score: evaluation.score,
            },
        };
    };
}
