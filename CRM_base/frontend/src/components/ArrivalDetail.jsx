import { useState } from 'react';

const ArrivalDetail = ({ arrivalDocument, closeTab }) => {
    const [isEditing, setIsEditing] = useState(false);

    if (!arrivalDocument) {
        return <div>Накладная не найдена</div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Детали накладной</h2>
                <button
                    onClick={closeTab}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                >
                    Назад
                </button>
            </div>

            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">ID</label>
                        <p className="text-sm text-gray-900">{arrivalDocument.id}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Дата прихода</label>
                        <p className="text-sm text-gray-900">{new Date(arrivalDocument.date).toLocaleDateString('ru-RU')}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Поставщик</label>
                        <p className="text-sm text-gray-900">{arrivalDocument.supplier?.name || 'Не указан'}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Номер документа</label>
                        <p className="text-sm text-gray-900">{arrivalDocument.documentNumber}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Склад</label>
                        <p className="text-sm text-gray-900">{arrivalDocument.warehouse}</p>
                    </div>
                </div>

                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                    >
                        {isEditing ? 'Отмена редактирования' : 'Редактировать'}
                    </button>
                    {isEditing && (
                        <button
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition"
                        >
                            Сохранить изменения
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium mb-4">Элементы оборудования</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Оборудование</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IMEI</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Цена закупки</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {arrivalDocument.items.map((item) => (
                                <tr key={item.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {item.equipment?.name || 'Неизвестно'} (Код: {item.equipment?.productCode})
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {item.imei || 'Не указан'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {item.purchasePrice ? parseFloat(item.purchasePrice).toFixed(2) : 'Не указана'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {item.bidId ? 'Назначено на заявку' : 'Доступно'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ArrivalDetail;