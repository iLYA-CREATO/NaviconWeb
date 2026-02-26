import React from 'react';

/**
 * Переиспользуемый компонент текстового поля ввода (Input)
 * 
 * @param {string} value - Текущее значение
 * @param {function} onChange - Обработчик изменения
 * @param {string} type - Тип input (text, password, email, number, etc.)
 * @param {string} placeholder - Текст плейсхолдера
 * @param {string} label - Метка поля
 * @param {boolean} required - Обязательное поле
 * @param {string} name - Имя поля
 * @param {boolean} disabled - Отключенное состояние
 * @param {string} className - Дополнительные классы
 * @param {string} error - Текст ошибки
 * @param {object} props - Дополнительные props
 */
const Input = ({
    value,
    onChange,
    type = 'text',
    placeholder,
    label,
    required = false,
    name,
    disabled = false,
    className = '',
    error,
    ...props
}) => {
    // Базовые классы
    const baseClasses = 'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200';
    
    // Классы для ошибки
    const errorClasses = error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300';
    
    // Классы для отключенного состояния
    const disabledClasses = disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white';
    
    // Собираем все классы
    const inputClasses = [baseClasses, errorClasses, disabledClasses, className].join(' ');
    
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-bold mb-2">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                name={name}
                disabled={disabled}
                className={inputClasses}
                required={required}
                {...props}
            />
            {error && (
                <p className="mt-1 text-sm text-red-500">{error}</p>
            )}
        </div>
    );
};

export default Input;
