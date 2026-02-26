import React from 'react';

/**
 * Переиспользуемый компонент выпадающего списка (Select)
 * 
 * @param {string} value - Текущее значение
 * @param {function} onChange - Обработчик изменения
 * @param {Array} options - Массив опций {value, label}
 * @param {string} placeholder - Текст плейсхолдера
 * @param {string} label - Метка поля
 * @param {boolean} required - Обязательное поле
 * @param {string} name - Имя поля
 * @param {boolean} disabled - Отключенное состояние
 * @param {string} className - Дополнительные классы
 */
const Select = ({
    value,
    onChange,
    options = [],
    placeholder = 'Выберите...',
    label,
    required = false,
    name,
    disabled = false,
    className = '',
    ...props
}) => {
    // Базовые классы
    const baseClasses = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';
    
    // Классы для отключенного состояния
    const disabledClasses = disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white';
    
    // Классы для обязательного поля
    const requiredClasses = required ? 'border-blue-500' : '';
    
    // Собираем все классы
    const selectClasses = [baseClasses, disabledClasses, requiredClasses, className].join(' ');
    
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <select
                value={value || ''}
                onChange={onChange}
                name={name}
                disabled={disabled}
                className={selectClasses}
                {...props}
            >
                {placeholder && (
                    <option value="" disabled>
                        {placeholder}
                    </option>
                )}
                {options.map((option, index) => (
                    <option key={option.value || index} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default Select;
