import LoadingSpinner from './LoadingSpinner';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  ...props
}) {
  const baseClasses = 'font-semibold rounded-lg transition-all duration-200 inline-flex items-center justify-center';
  
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary', 
    success: 'btn-success',
    danger: 'btn-danger',
    outline: 'outline border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white',
    ghost: 'ghost text-gray-600 hover:bg-gray-100'
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  const disabledClasses = disabled || isLoading ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <LoadingSpinner size="sm" color="white" className="mr-2" />
      )}
      {children}
    </button>
  );
}