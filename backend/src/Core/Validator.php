<?php

namespace App\Core;

/**
 * Input Validator
 * 
 * Server-side validation for all API inputs.
 * Supports required, string, integer, email, min/max length, in-list, date, etc.
 */
class Validator
{
    /** @var array */
    private $errors = [];

    /** @var array */
    private $data;

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    /**
     * Validate data against rules
     * 
     * @param array $rules ['field' => 'required|string|max:100']
     * @return bool
     */
    public function validate(array $rules): bool
    {
        $this->errors = [];

        foreach ($rules as $field => $ruleString) {
            $fieldRules = explode('|', $ruleString);
            $value = $this->data[$field] ?? null;
            $isRequired = in_array('required', $fieldRules);
            $isNullable = in_array('nullable', $fieldRules);

            // Skip validation if field is nullable and not present/null
            if ($isNullable && ($value === null || $value === '')) {
                continue;
            }

            foreach ($fieldRules as $rule) {
                $this->applyRule($field, $value, $rule, $isRequired);
            }
        }

        return empty($this->errors);
    }

    /**
     * Apply a single validation rule
     */
    private function applyRule(string $field, $value, string $rule, bool $isRequired): void
    {
        // Parse rule:parameter format
        $parts = explode(':', $rule, 2);
        $ruleName = $parts[0];
        $ruleParam = $parts[1] ?? null;

        switch ($ruleName) {
            case 'required':
                if ($value === null || $value === '') {
                    $this->addError($field, "{$field} is required");
                }
                break;

            case 'nullable':
                // Handled above
                break;

            case 'string':
                if ($value !== null && $value !== '' && !is_string($value)) {
                    $this->addError($field, "{$field} must be a string");
                }
                break;

            case 'integer':
            case 'int':
                if ($value !== null && $value !== '' && !is_numeric($value)) {
                    $this->addError($field, "{$field} must be an integer");
                }
                break;

            case 'numeric':
                if ($value !== null && $value !== '' && !is_numeric($value)) {
                    $this->addError($field, "{$field} must be numeric");
                }
                break;

            case 'email':
                if ($value !== null && $value !== '' && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
                    $this->addError($field, "{$field} must be a valid email");
                }
                break;

            case 'min':
                if ($value !== null && is_string($value) && strlen($value) < (int) $ruleParam) {
                    $this->addError($field, "{$field} must be at least {$ruleParam} characters");
                }
                break;

            case 'max':
                if ($value !== null && is_string($value) && strlen($value) > (int) $ruleParam) {
                    $this->addError($field, "{$field} must not exceed {$ruleParam} characters");
                }
                break;

            case 'in':
                $allowed = explode(',', $ruleParam);
                if ($value !== null && $value !== '' && !in_array($value, $allowed)) {
                    $this->addError($field, "{$field} must be one of: {$ruleParam}");
                }
                break;

            case 'date':
                if ($value !== null && $value !== '') {
                    $date = \DateTime::createFromFormat('Y-m-d', $value);
                    if (!$date || $date->format('Y-m-d') !== $value) {
                        $this->addError($field, "{$field} must be a valid date (YYYY-MM-DD)");
                    }
                }
                break;

            case 'boolean':
            case 'bool':
                if ($value !== null && $value !== '' && !in_array($value, [true, false, 0, 1, '0', '1', 'true', 'false'], true)) {
                    $this->addError($field, "{$field} must be a boolean");
                }
                break;

            case 'unique':
                // Format: unique:table,column
                // This is handled at the service level, not here
                break;
        }
    }

    /**
     * Add a validation error
     */
    private function addError(string $field, string $message): void
    {
        if (!isset($this->errors[$field])) {
            $this->errors[$field] = [];
        }
        $this->errors[$field][] = $message;
    }

    /**
     * Get all validation errors
     */
    public function errors(): array
    {
        return $this->errors;
    }

    /**
     * Check if validation failed
     */
    public function fails(): bool
    {
        return !empty($this->errors);
    }

    /**
     * Get validated data (only fields that had rules)
     */
    public function validated(): array
    {
        return array_intersect_key($this->data, $this->errors ?: array_flip(array_keys($this->data)));
    }

    /**
     * Static helper: validate and return errors or null
     */
    public static function make(array $data, array $rules): ?array
    {
        $validator = new self($data);
        if (!$validator->validate($rules)) {
            return $validator->errors();
        }
        return null;
    }
}
