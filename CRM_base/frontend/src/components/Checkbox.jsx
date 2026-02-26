import React from 'react';

/**
 * Переиспользуемый компонент флажка (Checkbox)
 * 
 * @param {boolean} checked - Состояние флажка
 * @param {function} onChange - Обработчик изменения
 * @param {string} label - Метка флажка
 * @param {string} name - Имя поля
 * @param {boolean} disabled - Отключенное состояние
 * @param {string} className - Дополнительные классы
 */
const Checkbox = ({
    checked,
    onChange,
    label,
    name,
    disabled = false,
    className = '',
    ...props
}) => {
    // Базовые классы для checkbox
    const checkboxClasses = 'w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500';
    
    // Классы для отключенного состояния
    const disabledClasses = disabled ? 'bg-gray-100 cursor-not-allowed' : '';
    
    return (
        <label className={`inline-flex items-center ${disabledClasses} ${className}`}>
            <input
                type="checkbox"
                checked={checked || false}
                onChange={onChange}
                name={name}
                disabled={disabled}
                className={checkboxClasses}
                {...props}
            />
            {label && (
                <span className="ml-2 text-sm text-gray-700">{label}</span>
            )}
        </label>
    );
};

export default Checkbox;
