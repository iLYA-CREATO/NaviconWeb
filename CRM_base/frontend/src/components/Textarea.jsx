import React from 'react';

/**
 * Переиспользуемый компонент многострочного текстового поля (Textarea)
 * 
 * @param {string} value - Текущее значение
 * @param {function} onChange - Обработчик изменения
 * @param {string} placeholder - Текст плейсхолдера
 * @param {string} label - Метка поля
 * @param {boolean} required - Обязательное поле
 * @param {string} name - Имя поля
 * @param {boolean} disabled - Отключенное состояние
 * @param {string} className - Дополнительные классы
 * @param {string} error - Текст ошибки
 * @param {number} rows - Количество строк
 * @param {number} cols - Количество колонок
 * @param {boolean} resize - Возможность изменения размера
 */
const Textarea = ({
    value,
    onChange,
    placeholder,
    label,
    required = false,
    name,
    disabled = false,
    className = '',
    error,
    rows = 4,
    cols,
    resize = true,
    ...props
}) => {
    // Базовые классы
    const baseClasses = 'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200';
    
    // Классы для ошибки
    const errorClasses = error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300';
    
    // Классы для отключенного состояния
    const disabledClasses = disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white';
    
    // Классы для resize
    const resizeClasses = resize ? 'resize' : 'resize-none';
    
    // Собираем все классы
    const textareaClasses = [baseClasses, errorClasses, disabledClasses, resizeClasses, className].join(' ');
    
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-bold mb-2">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <textarea
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                name={name}
                disabled={disabled}
                rows={rows}
                cols={cols}
                className={textareaClasses}
                required={required}
                {...props}
            />
            {error && (
                <p className="mt-1 text-sm text-red-500">{error}</p>
            )}
        </div>
    );
};

export default Textarea;
