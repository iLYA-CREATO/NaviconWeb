import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';

/**
 * MultiSelectFilter Component
 * A custom dropdown component that allows selecting multiple options
 * 
 * @param {Array} value - Array of selected values
 * @param {function} onChange - Handler for value changes
 * @param {Array} options - Array of available options {value, label}
 * @param {string} placeholder - Placeholder text
 * @param {string} label - Label for the filter
 * @param {boolean} exceptMode - Whether "except" mode is enabled
 */
const MultiSelectFilter = ({
    value = [],
    onChange,
    options = [],
    placeholder = 'Выберите...',
    label,
    exceptMode = false,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef(null);
    
    // Filter options based on search
    const filteredOptions = options.filter(option => 
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };
        
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Handle option toggle
    const handleToggle = (optionValue) => {
        const newValue = value.includes(optionValue)
            ? value.filter(v => v !== optionValue)
            : [...value, optionValue];
        onChange(newValue);
    };

    // Handle clear all
    const handleClear = () => {
        onChange([]);
    };

    // Get display text
    const getDisplayText = () => {
        if (value.length === 0) {
            return exceptMode ? 'Все (кроме)' : placeholder;
        }
        if (value.length === 1) {
            const option = options.find(o => o.value === value[0]);
            return option ? option.label : `${value.length} выбрано`;
        }
        return `${value.length} выбрано`;
    };

    const borderColor = exceptMode ? 'border-red-300 bg-red-50' : 'border-gray-300';
    const focusRing = exceptMode ? 'focus:ring-red-500' : 'focus:ring-blue-500';

    return (
        <div className="relative" ref={containerRef}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                </label>
            )}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between px-3 py-2 border rounded-lg cursor-pointer bg-white ${borderColor} hover:border-gray-400 focus:outline-none focus:ring-2 ${focusRing} transition-colors`}
                style={{ minHeight: '42px' }}
            >
                <span className={`text-sm truncate ${value.length === 0 ? 'text-gray-400' : 'text-gray-900'}`}>
                    {getDisplayText()}
                </span>
                <div className="flex items-center gap-1">
                    {value.length > 0 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClear();
                            }}
                            className="p-0.5 hover:bg-gray-200 rounded"
                            title="Очистить"
                        >
                            <X size={14} className="text-gray-500" />
                        </button>
                    )}
                    <ChevronDown 
                        size={16} 
                        className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                </div>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-hidden">
                    {/* Search input */}
                    <div className="p-2 border-b bg-gray-50">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Поиск..."
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    
                    {/* Options list */}
                    <div className="max-h-48 overflow-y-auto">
                        {filteredOptions.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-gray-500 text-center">
                                Нет вариантов
                            </div>
                        ) : (
                            filteredOptions.map((option) => {
                                const isSelected = value.includes(option.value);
                                return (
                                    <div
                                        key={option.value}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggle(option.value);
                                        }}
                                        className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors ${
                                            isSelected ? 'bg-blue-50' : ''
                                        }`}
                                    >
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                                            isSelected 
                                                ? (exceptMode ? 'bg-red-500 border-red-500' : 'bg-blue-500 border-blue-500')
                                                : 'border-gray-300'
                                        }`}>
                                            {isSelected && <Check size={12} className="text-white" />}
                                        </div>
                                        <span className={`text-sm ${isSelected ? 'font-medium' : ''}`}>
                                            {option.label}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MultiSelectFilter;
