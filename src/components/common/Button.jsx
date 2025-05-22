import React from 'react';
import styles from '../../styles/components/Button.module.css';

const Button = ({
  children,
  type = 'button',
  disabled = false,
  onClick,
  size = 'medium',
  variant = 'contained',
  className = '',
  ...props
}) => {
  const buttonClasses = [
    styles.button,
    styles[`size${size.charAt(0).toUpperCase()}${size.slice(1)}`],
    styles[variant],
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={buttonClasses}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button; 