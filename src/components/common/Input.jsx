import React from 'react';
import styles from '../../styles/components/Input.module.css';

const Input = ({
  label,
  error,
  helperText,
  required = false,
  disabled = false,
  className = '',
  ...props
}) => {
  const inputId = `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={styles.container}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <input
        id={inputId}
        className={`${styles.input} ${error ? styles.error : ''} ${className}`}
        disabled={disabled}
        aria-invalid={!!error}
        {...props}
      />
      {(error || helperText) && (
        <p className={`${styles.helper} ${error ? styles.errorText : ''}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
};

export default Input; 