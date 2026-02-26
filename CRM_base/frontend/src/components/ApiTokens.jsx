import { useState, useEffect } from 'react';
import { getApiTokens, createApiToken, updateApiToken, deleteApiToken, regenerateApiToken } from '../services/api';
import Button from './Button';
import Input from './Input';

const ApiTokens = () => {
    const [tokens, setTokens] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [newToken, setNewToken] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        expiresInDays: '',
        permissions: {
            clients: true,
            objects: true,
            bids: true,
        }
    });
    const [notification, setNotification] = useState(null);
    const [copiedToken, setCopiedToken] = useState(null);
    const [expandedSection, setExpandedSection] = useState('clients');
    const [showTokenId, setShowTokenId] = useState(null); // ID токена для отображения
    const [visibleTokens, setVisibleTokens] = useState({}); // Хранит реальные токены по ID

    useEffect(() => {
        fetchTokens();
    }, []);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const fetchTokens = async () => {
        try {
            const response = await getApiTokens();
            setTokens(response.data);
        } catch (error) {
            console.error('Error fetching API tokens:', error);
            setNotification({ type: 'error', message: 'Ошибка при загрузке токенов' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = {
                name: formData.name,
                expiresInDays: formData.expiresInDays ? parseInt(formData.expiresInDays) : undefined,
                permissions: formData.permissions,
            };
            const response = await createApiToken(data);
            setNewToken(response.data);
            setNotification({ type: 'success', message: 'Токен успешно создан!' });
            
            // Сохраняем токен в видимых
            setVisibleTokens({ ...visibleTokens, [response.data.id]: response.data.token });
            setShowTokenId(response.data.id);
            
            fetchTokens();
            setFormData({
                name: '',
                expiresInDays: '',
                permissions: {
                    clients: true,
                    objects: true,
                    bids: true,
                }
            });
            setShowForm(false);
        } catch (error) {
            console.error('Error creating API token:', error);
            setNotification({ type: 'error', message: 'Ошибка при создании токена' });
        }
    };

    const handleToggleActive = async (token) => {
        try {
            await updateApiToken(token.id, { isActive: !token.isActive });
            setNotification({ type: 'success', message: `Токен ${token.isActive ? 'деактивирован' : 'активирован'}` });
            fetchTokens();
        } catch (error) {
            console.error('Error toggling token:', error);
            setNotification({ type: 'error', message: 'Ошибка при изменении статуса токена' });
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Вы уверены, что хотите удалить этот токен? Действие необратимо.')) {
            try {
                await deleteApiToken(id);
                setNotification({ type: 'success', message: 'Токен удален' });
                // Удаляем из видимых
                const newVisible = { ...visibleTokens };
                delete newVisible[id];
                setVisibleTokens(newVisible);
                if (showTokenId === id) setShowTokenId(null);
                fetchTokens();
            } catch (error) {
                console.error('Error deleting token:', error);
                setNotification({ type: 'error', message: 'Ошибка при удалении токена' });
            }
        }
    };

    const handleRegenerate = async (id) => {
        if (window.confirm('Вы уверены, что хотите перегенерировать этот токен? Старый токен перестанет работать.')) {
            try {
                const response = await regenerateApiToken(id, formData.expiresInDays ? parseInt(formData.expiresInDays) : undefined);
                setNewToken(response.data);
                setNotification({ type: 'success', message: 'Токен обновлен!' });
                
                // Сохраняем новый токен в видимых
                setVisibleTokens({ ...visibleTokens, [response.data.id]: response.data.token });
                setShowTokenId(response.data.id);
                
                fetchTokens();
            } catch (error) {
                console.error('Error regenerating token:', error);
                setNotification({ type: 'error', message: 'Ошибка при перегенерации токена' });
            }
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopiedToken(text);
        setTimeout(() => setCopiedToken(null), 2000);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Без срока действия';
        return new Date(dateString).toLocaleString('ru-RU');
    };

    const toggleSection = (section) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    const toggleShowToken = (token) => {
        if (showTokenId === token.id) {
            setShowTokenId(null);
        } else {
            // Проверяем, есть ли токен в видимых
            if (visibleTokens[token.id]) {
                setShowTokenId(token.id);
            } else {
                // Токен не доступен - предлагаем перегенерировать
                setNotification({ type: 'error', message: 'Токен недоступен. Используйте "Обновить" для получения нового токена.' });
            }
        }
    };

    // API Documentation sections
    const apiSections = [
        {
            id: 'clients',
            title: 'Клиенты',
            color: 'blue',
            endpoints: [
                { method: 'GET', path: '/api/external/clients', desc: 'Получить список клиентов', example: 'curl -X GET http://localhost:5000/api/external/clients -H "X-API-Token: YOUR_TOKEN"' },
                { method: 'GET', path: '/api/external/clients/:id', desc: 'Получить клиента по ID', example: 'curl -X GET http://localhost:5000/api/external/clients/1 -H "X-API-Token: YOUR_TOKEN"' },
                { method: 'POST', path: '/api/external/clients', desc: 'Создать нового клиента', example: `curl -X POST http://localhost:5000/api/external/clients \\\n  -H "X-API-Token: YOUR_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d '{"name": "ООО Ромашка", "email": "info@romashka.ru", "phone": "+7 999 123-45-67"}'` },
                { method: 'PUT', path: '/api/external/clients/:id', desc: 'Обновить клиента', example: `curl -X PUT http://localhost:5000/api/external/clients/1 \\\n  -H "X-API-Token: YOUR_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d '{"name": "ООО Ромашка", "phone": "+7 999 987-65-43"}'` },
            ]
        },
        {
            id: 'objects',
            title: 'Объекты клиентов',
            color: 'green',
            endpoints: [
                { method: 'GET', path: '/api/external/client-objects', desc: 'Получить список объектов', example: 'curl -X GET "http://localhost:5000/api/external/client-objects?clientId=1" -H "X-API-Token: YOUR_TOKEN"' },
                { method: 'GET', path: '/api/external/client-objects/:id', desc: 'Получить объект по ID', example: 'curl -X GET http://localhost:5000/api/external/client-objects/1 -H "X-API-Token: YOUR_TOKEN"' },
                { method: 'POST', path: '/api/external/client-objects', desc: 'Создать новый объект', example: `curl -X POST http://localhost:5000/api/external/client-objects \\\n  -H "X-API-Token: YOUR_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d '{"clientId": 1, "brandModel": "ГАЗель NEXT", "stateNumber": "А777АА77"}'` },
                { method: 'PUT', path: '/api/external/client-objects/:id', desc: 'Обновить объект', example: `curl -X PUT http://localhost:5000/api/external/client-objects/1 \\\n  -H "X-API-Token: YOUR_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d '{"brandModel": "ГАЗель Бизнес", "stateNumber": "В555ВВ77"}'` },
                { method: 'DELETE', path: '/api/external/client-objects/:id', desc: 'Удалить объект', example: 'curl -X DELETE http://localhost:5000/api/external/client-objects/1 -H "X-API-Token: YOUR_TOKEN"' },
            ]
        },
        {
            id: 'bids',
            title: 'Заявки',
            color: 'purple',
            endpoints: [
                { method: 'GET', path: '/api/external/bids', desc: 'Получить список заявок', example: 'curl -X GET "http://localhost:5000/api/external/bids?clientId=1&status=new" -H "X-API-Token: YOUR_TOKEN"' },
                { method: 'GET', path: '/api/external/bids/:id', desc: 'Получить заявку по ID', example: 'curl -X GET http://localhost:5000/api/external/bids/1 -H "X-API-Token: YOUR_TOKEN"' },
                { method: 'POST', path: '/api/external/bids', desc: 'Создать новую заявку', example: `curl -X POST http://localhost:5000/api/external/bids \\\n  -H "X-API-Token: YOUR_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d '{"clientId": 1, "bidTypeId": 1, "tema": "Ремонт оборудования", "amount": 15000, "description": "Требуется ремонт"}'` },
                { method: 'PUT', path: '/api/external/bids/:id', desc: 'Обновить заявку', example: `curl -X PUT http://localhost:5000/api/external/bids/1 \\\n  -H "X-API-Token: YOUR_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d '{"status": "В работе", "amount": 20000}'` },
                { method: 'GET', path: '/api/external/bids/meta/types', desc: 'Получить типы заявок', example: 'curl -X GET http://localhost:5000/api/external/bids/meta/types -H "X-API-Token: YOUR_TOKEN"' },
            ]
        }
    ];

    const getMethodColor = (method) => {
        switch (method) {
            case 'GET': return 'bg-green-100 text-green-700';
            case 'POST': return 'bg-blue-100 text-blue-700';
            case 'PUT': return 'bg-orange-100 text-orange-700';
            case 'DELETE': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    if (loading) {
        return <div className="p-4">Загрузка...</div>;
    }

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Управление API токенами</h2>
                <Button onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Отмена' : 'Создать токен'}
                </Button>
            </div>

            {notification && (
                <div className={`p-3 mb-4 rounded ${notification.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {notification.message}
                </div>
            )}

            {newToken && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
                    <h3 className="font-bold text-yellow-800 mb-2">✅ Токен создан!</h3>
                    <p className="text-yellow-700 mb-2">Скопируйте токен - он понадобится для API запросов:</p>
                    <div className="flex items-center gap-2">
                        <code className="bg-white px-3 py-2 rounded border flex-1 font-mono text-sm break-all">
                            {newToken.token}
                        </code>
                        <Button 
                            onClick={() => copyToClipboard(newToken.token)}
                            className="whitespace-nowrap"
                        >
                            {copiedToken === newToken.token ? 'Скопировано!' : 'Копировать'}
                        </Button>
                    </div>
                    <button 
                        onClick={() => { setNewToken(null); }}
                        className="mt-2 text-sm text-yellow-700 underline"
                    >
                        Закрыть
                    </button>
                </div>
            )}

            {showForm && (
                <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded mb-4">
                    <h3 className="font-bold mb-3">Создание нового API токена</h3>
                    <div className="mb-3">
                        <label className="block text-sm font-medium mb-1">Название токена *</label>
                        <Input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Например: Мобильное приложение"
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label className="block text-sm font-medium mb-1">Срок действия (дней)</label>
                        <Input
                            type="number"
                            value={formData.expiresInDays}
                            onChange={(e) => setFormData({ ...formData, expiresInDays: e.target.value })}
                            placeholder="Оставьте пустым для безграничного срока"
                            min="1"
                        />
                    </div>
                    <div className="mb-3">
                        <label className="block text-sm font-medium mb-2">Права доступа</label>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.permissions.clients}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        permissions: { ...formData.permissions, clients: e.target.checked }
                                    })}
                                />
                                <span>Клиенты (создание, чтение, обновление)</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.permissions.objects}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        permissions: { ...formData.permissions, objects: e.target.checked }
                                    })}
                                />
                                <span>Объекты клиентов (создание, чтение, обновление, удаление)</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.permissions.bids}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        permissions: { ...formData.permissions, bids: e.target.checked }
                                    })}
                                />
                                <span>Заявки (создание, чтение, обновление)</span>
                            </label>
                        </div>
                    </div>
                    <Button type="submit">Создать токен</Button>
                </form>
            )}

            <div className="bg-white rounded shadow overflow-hidden mb-6">
                {tokens.length === 0 ? (
                    <div className="p-4 text-gray-500">У вас пока нет API токенов</div>
                ) : (
                    <table className="min-w-full">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-2 text-left text-sm font-medium">Название</th>
                                <th className="px-4 py-2 text-left text-sm font-medium">Токен</th>
                                <th className="px-4 py-2 text-left text-sm font-medium">Права</th>
                                <th className="px-4 py-2 text-left text-sm font-medium">Статус</th>
                                <th className="px-4 py-2 text-left text-sm font-medium">Срок действия</th>
                                <th className="px-4 py-2 text-left text-sm font-medium">Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tokens.map((token) => (
                                <tr key={token.id} className="border-t">
                                    <td className="px-4 py-2">{token.name}</td>
                                    <td className="px-4 py-2">
                                        {showTokenId === token.id && visibleTokens[token.id] ? (
                                            <div className="flex items-center gap-2">
                                                <code className="text-xs bg-gray-100 px-2 py-1 rounded break-all">
                                                    {visibleTokens[token.id]}
                                                </code>
                                                <button
                                                    onClick={() => copyToClipboard(visibleTokens[token.id])}
                                                    className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                                                >
                                                    Копировать
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 text-sm">••••••••••••••••</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-2">
                                        <div className="flex gap-1 flex-wrap">
                                            {token.permissions?.clients && (
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">Клиенты</span>
                                            )}
                                            {token.permissions?.objects && (
                                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">Объекты</span>
                                            )}
                                            {token.permissions?.bids && (
                                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">Заявки</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2">
                                        <span className={`px-2 py-1 text-xs rounded ${token.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                            {token.isActive ? 'Активен' : 'Деактивирован'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                        {formatDate(token.expiresAt)}
                                    </td>
                                    <td className="px-4 py-2">
                                        <div className="flex gap-2 flex-col">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleToggleActive(token)}
                                                    className="text-sm text-blue-600 hover:underline"
                                                >
                                                    {token.isActive ? 'Деактивировать' : 'Активировать'}
                                                </button>
                                                <button
                                                    onClick={() => toggleShowToken(token)}
                                                    className="text-sm text-gray-600 hover:underline"
                                                >
                                                    {showTokenId === token.id ? 'Скрыть' : 'Показать'}
                                                </button>
                                                <button
                                                    onClick={() => handleRegenerate(token.id)}
                                                    className="text-sm text-orange-600 hover:underline"
                                                >
                                                    Обновить
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => handleDelete(token.id)}
                                                className="text-sm text-red-600 hover:underline text-left"
                                            >
                                                Удалить
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* API Documentation Section */}
            <div className="bg-white rounded shadow">
                <div className="p-4 border-b">
                    <h2 className="text-xl font-bold">Документация API</h2>
                    <p className="text-gray-600 text-sm mt-1">Нажмите на раздел, чтобы увидеть доступные endpoints и примеры использования</p>
                </div>
                
                <div className="p-4">
                    {apiSections.map((section) => (
                        <div key={section.id} className="mb-2 border rounded-lg">
                            <button
                                onClick={() => toggleSection(section.id)}
                                className={`w-full px-4 py-3 flex items-center justify-between text-left font-medium rounded-t-lg ${
                                    expandedSection === section.id 
                                        ? `bg-${section.color}-50 border-b` 
                                        : 'bg-gray-50 hover:bg-gray-100'
                                }`}
                            >
                                <span className={`text-${section.color}-700`}>{section.title}</span>
                                <svg 
                                    className={`w-5 h-5 text-gray-500 transform transition-transform ${expandedSection === section.id ? 'rotate-180' : ''}`}
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            
                            {expandedSection === section.id && (
                                <div className="p-4 bg-white">
                                    {section.endpoints.map((endpoint, idx) => (
                                        <div key={idx} className="mb-4 last:mb-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-0.5 text-xs font-bold rounded ${getMethodColor(endpoint.method)}`}>
                                                    {endpoint.method}
                                                </span>
                                                <code className="text-sm text-gray-700">{endpoint.path}</code>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-2 ml-12">{endpoint.desc}</p>
                                            <div className="ml-12">
                                                <code className="block bg-gray-800 text-gray-100 p-3 rounded text-xs overflow-x-auto whitespace-pre-wrap">
                                                    {endpoint.example}
                                                </code>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                
                <div className="px-4 pb-4">
                    <div className="flex flex-wrap gap-4 text-sm">
                        <span className="flex items-center gap-1">
                            <span className="w-3 h-3 bg-green-500 rounded"></span> GET - получение данных
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-3 h-3 bg-blue-500 rounded"></span> POST - создание
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-3 h-3 bg-orange-500 rounded"></span> PUT - обновление
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-3 h-3 bg-red-500 rounded"></span> DELETE - удаление
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApiTokens;
