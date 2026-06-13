/**
 * フォームバリデーションユーティリティ
 * 
 * UI/UXガイドに基づく設計:
 * - リアルタイムバリデーション: 入力直後にフィードバック
 * - 明確なエラーメッセージ: 何が間違っているかを具体的に説明
 * - エラー防止: 入力前にヒントを表示
 */

export type ValidationResult = {
  valid: boolean;
  error?: string;
};

export type Validator = (value: string) => ValidationResult;

// 必須フィールド
export function required(message = "この項目は必須です"): Validator {
  return (value: string) => ({
    valid: value.trim().length > 0,
    error: value.trim().length > 0 ? undefined : message,
  });
}

// 最小文字数
export function minLength(min: number, message?: string): Validator {
  return (value: string) => ({
    valid: value.length >= min,
    error: value.length >= min ? undefined : message || `${min}文字以上で入力してください`,
  });
}

// 最大文字数
export function maxLength(max: number, message?: string): Validator {
  return (value: string) => ({
    valid: value.length <= max,
    error: value.length <= max ? undefined : message || `${max}文字以内で入力してください`,
  });
}

// メールアドレス形式
export function email(message = "有効なメールアドレスを入力してください"): Validator {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return (value: string) => ({
    valid: emailRegex.test(value),
    error: emailRegex.test(value) ? undefined : message,
  });
}

// URL形式
export function url(message = "有効なURLを入力してください"): Validator {
  const urlRegex = /^https?:\/\/.+/;
  return (value: string) => ({
    valid: urlRegex.test(value),
    error: urlRegex.test(value) ? undefined : message,
  });
}

// 数値のみ
export function numeric(message = "数値を入力してください"): Validator {
  return (value: string) => ({
    valid: /^\d+$/.test(value),
    error: /^\d+$/.test(value) ? undefined : message,
  });
}

// 範囲内の数値
export function range(min: number, max: number, message?: string): Validator {
  return (value: string) => {
    const num = parseInt(value, 10);
    const valid = !isNaN(num) && num >= min && num <= max;
    return {
      valid,
      error: valid ? undefined : message || `${min}から${max}の間で入力してください`,
    };
  };
}

// 日付形式（YYYY-MM-DD）
export function date(message = "有効な日付を入力してください（YYYY-MM-DD）"): Validator {
  return (value: string) => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(value)) {
      return { valid: false, error: message };
    }
    const d = new Date(value);
    const valid = d instanceof Date && !isNaN(d.getTime());
    return { valid, error: valid ? undefined : message };
  };
}

// 将来の日付
export function futureDate(message = "未来の日付を入力してください"): Validator {
  return (value: string) => {
    const d = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const valid = d > today;
    return { valid, error: valid ? undefined : message };
  };
}

// カスタムパターン
export function pattern(regex: RegExp, message: string): Validator {
  return (value: string) => ({
    valid: regex.test(value),
    error: regex.test(value) ? undefined : message,
  });
}

// 複数のバリデーターを組み合わせ
export function compose(...validators: Validator[]): Validator {
  return (value: string) => {
    for (const validator of validators) {
      const result = validator(value);
      if (!result.valid) {
        return result;
      }
    }
    return { valid: true };
  };
}

// フォーム全体のバリデーション
export function validateForm<T extends Record<string, string>>(
  values: T,
  validators: Partial<Record<keyof T, Validator>>
): { valid: boolean; errors: Partial<Record<keyof T, string>> } {
  const errors: Partial<Record<keyof T, string>> = {};
  let valid = true;

  for (const [field, validator] of Object.entries(validators)) {
    if (validator) {
      const result = (validator as Validator)(values[field as keyof T] || "");
      if (!result.valid) {
        valid = false;
        errors[field as keyof T] = result.error;
      }
    }
  }

  return { valid, errors };
}

// リアルタイムバリデーション用のフック
import { useState, useCallback } from "react";

export function useValidation<T extends Record<string, string>>(
  validators: Partial<Record<keyof T, Validator>>
) {
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const validateField = useCallback(
    (field: keyof T, value: string) => {
      const validator = validators[field];
      if (validator) {
        const result = validator(value);
        setErrors((prev) => ({
          ...prev,
          [field]: result.error,
        }));
        return result.valid;
      }
      return true;
    },
    [validators]
  );

  const touchField = useCallback((field: keyof T) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
  }, []);

  const getFieldError = useCallback(
    (field: keyof T) => {
      return touched[field] ? errors[field] : undefined;
    },
    [errors, touched]
  );

  const validateAll = useCallback(
    (values: T) => {
      const result = validateForm(values, validators);
      setErrors(result.errors);
      // 全フィールドをタッチ済みに
      const allTouched: Partial<Record<keyof T, boolean>> = {};
      for (const key of Object.keys(validators)) {
        allTouched[key as keyof T] = true;
      }
      setTouched(allTouched);
      return result.valid;
    },
    [validators]
  );

  const resetValidation = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  return {
    errors,
    touched,
    validateField,
    touchField,
    getFieldError,
    validateAll,
    resetValidation,
  };
}
