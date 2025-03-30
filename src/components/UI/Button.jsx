import React from 'react';

export const Button = ({ 
  children, 
  onClick,
  type = "button",
  disabled = false,
  className = ""
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`font-medium focus:outline-none focus:ring-2 focus:ring-blue-300 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'transition-colors'
      } ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;