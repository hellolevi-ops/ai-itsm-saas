interface AlertProps {
  type?: 'error' | 'success' | 'info';
  message: string;
  className?: string;
}

export function Alert({ type = 'error', message, className = '' }: AlertProps) {
  const typeStyles = {
    error: 'bg-red-50 border-red-200 text-red-700',
    success: 'bg-green-50 border-green-200 text-green-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
  };

  return (
    <div
      role="alert"
      data-testid="alert"
      className={`p-3 rounded-lg border text-sm ${typeStyles[type]} ${className}`}
    >
      {message}
    </div>
  );
}
