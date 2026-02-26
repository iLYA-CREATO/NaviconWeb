import React from 'react';
import Button from './Button';
import Select from './Select';

/**
 * Переиспользуемый компонент таблицы с пагинацией
 * 
 * @param {Array} columns - Массив колонок {key, label, render, width, align}
 * @param {Array} data - Массив данных
 * @param {Function} onRowClick - Обработчик клика по строке
 * @param {Object} pagination - Объект пагинации {page, limit, total, totalPages}
 * @param {Function} onPageChange - Обработчик смены страницы
 * @param {Function} onLimitChange - Обработчик смены количества записей
 * @param {boolean} loading - Состояние загрузки
 * @param {string} emptyMessage - Сообщение при отсутствии данных
 * @param {Array} limitOptions - Варианты количества записей
 */
const Table = ({
    columns = [],
    data = [],
    onRowClick,
    pagination = { page: 1, limit: 20, total: 0, totalPages: 1 },
    onPageChange,
    onLimitChange,
    loading = false,
    emptyMessage = 'Нет данных',
    limitOptions = [
        { value: 20, label: '20' },
        { value: 50, label: '50' },
        { value: 100, label: '100' },
    ],
}) => {
    const { page, limit, total, totalPages } = pagination;

    // Вычисляем минимальную ширину таблицы
    const minWidth = columns.length * 120;

    return (
        <div className="flex flex-col h-full">
            {/* Контейнер таблицы с прокруткой */}
            <div className="overflow-x-auto table-container flex-1 min-h-0">
                <table 
                    className="divide-y divide-gray-200" 
                    style={{ minWidth: `${minWidth}px` }}
                >
                    {/* Заголовок таблицы */}
                    <thead className="bg-gray-50">
                        <tr>
                            {columns.map((column) => (
                                <th 
                                    key={column.key} 
                                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'}`}
                                    style={{ width: column.width }}
                                >
                                    {column.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    
                    {/* Тело таблицы */}
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500">
                                    Загрузка...
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500">
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            data.map((row, rowIndex) => (
                                <tr 
                                    key={row.id || rowIndex} 
                                    className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
                                    onClick={() => onRowClick && onRowClick(row)}
                                >
                                    {columns.map((column) => (
                                        <td 
                                            key={column.key} 
                                            className={`px-6 py-4 ${column.noWrap !== false ? 'whitespace-nowrap' : ''} ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'}`}
                                        >
                                            {column.render ? column.render(row[column.key], row) : row[column.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Пагинация */}
            {total > 0 && (
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200 flex-none">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Записей на странице:</span>
                        <Select
                            value={limit}
                            onChange={(e) => onLimitChange && onLimitChange(parseInt(e.target.value))}
                            options={limitOptions}
                            className="w-20"
                        />
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                            Страница {page} из {totalPages || 1} ({total} записей)
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onPageChange && onPageChange(page - 1)}
                            disabled={page <= 1}
                        >
                            Назад
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onPageChange && onPageChange(page + 1)}
                            disabled={page >= totalPages}
                        >
                            Вперёд
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Table;
