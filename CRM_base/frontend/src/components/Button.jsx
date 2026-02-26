import React from 'react';

/**
 * Переиспользуемый компонент кнопки
 * 
 * @param {string} variant - Вариант кнопки: 'primary' | 'danger' | 'secondary' | 'ghost' | 'icon'
 * @param {string} size - Размер кнопки: 'sm' | 'md' | 'lg'
 * @param {boolean} disabled - Отключенное состояние
 * @param {boolean} loading - Состояние загрузки
 * @param {string} type - Тип кнопки: 'button' | 'submit' | 'reset'
 * @param {function} onClick - Обработчик клика
 * @param {React.ReactNode} children - Дочерние элементы
 * @param {string} className - Дополнительные классы
 * @param {string} title - Tooltip
 * @param {React.ReactNode} icon - Иконка перед текстом
 * @param {boolean} iconOnly - Только иконка (без текста)
 */
const Button = ({
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    type = 'button',
    onClick,
    children,
    className = '',
    title,
    icon,
    iconOnly = false,
    ...props
}) => {
    // Базовые классы
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    // Классы для вариантов
    const variantClasses = {
        primary: 'bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500',
        danger: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500',
        secondary: 'bg-gray-500 hover:bg-gray-600 text-white focus:ring-gray-500',
        ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-500',
        icon: 'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-500',
        orange: 'bg-orange-500 hover:bg-orange-600 text-white focus:ring-orange-500',
    };
    
    // Классы для размеров
    const sizeClasses = {
        sm: iconOnly ? 'p-1.5' : 'px-3 py-1.5 text-sm',
        md: iconOnly ? 'p-2' : 'px-4 py-2 text-base',
        lg: iconOnly ? 'p-3' : 'px-6 py-3 text-lg',
    };
    
    // Классы для отключенного состояния
    const disabledClasses = disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
    
    // Собираем все классы
    const buttonClasses = [
        baseClasses,
        variantClasses[variant] || variantClasses.primary,
        sizeClasses[size] || sizeClasses.md,
        disabledClasses,
        className,
    ].join(' ');
    
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={buttonClasses}
            title={title}
            {...props}
        >
            {loading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {children}
                </>
            ) : (
                <>
                    {icon && <span className={children ? 'mr-2' : ''}>{icon}</span>}
                    {children}
                </>
            )}
        </button>
    );
};

export default Button;
