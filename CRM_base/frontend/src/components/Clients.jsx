/**
 * Clients Component
 *
 * Этот компонент управляет отображением и созданием клиентов.
 * Показывает список клиентов, позволяет искать и фильтровать, а также добавлять новых клиентов.
 * Сохраняет настройки поиска и фильтров в localStorage.
 */

// Импорт хуков React для управления состоянием и эффектами
import { useState, useEffect } from 'react';
// Импорт хука для навигации между маршрутами
import { useNavigate } from 'react-router-dom';
// Импорт функций API для работы с клиентами и пользователями
import { getClients, createClient, getUsers } from '../services/api';
// Импорт хука для проверки разрешений
import { usePermissions } from '../hooks/usePermissions';

const Clients = () => {
    // Хук для навигации
    const navigate = useNavigate();
    // Хук для проверки разрешений
    const { hasPermission } = usePermissions();

    // Состояние для списка клиентов
    const [clients, setClients] = useState([]);
    // Состояние для списка пользователей (для выбора ответственного)
    const [users, setUsers] = useState([]);
    // Состояние для показа модального окна создания клиента
    const [showModal, setShowModal] = useState(false);
    // Состояние для данных формы создания клиента
    const [formData, setFormData] = useState({
        name: '',         // Имя клиента
        email: '',        // Email клиента
        phone: '',        // Телефон клиента
        responsibleId: '', // ID ответственного пользователя
    });
    // Состояние для поискового запроса (сохранение в localStorage)
    const [searchQuery, setSearchQuery] = useState(localStorage.getItem('clientsSearchQuery') || '');
    // Состояние для фильтра по ответственному (сохранение в localStorage)
    const [responsibleFilter, setResponsibleFilter] = useState(localStorage.getItem('clientsResponsibleFilter') || '');
    // Состояние для видимых фильтров (сохранение в localStorage)
    const [visibleFilters, setVisibleFilters] = useState(() => {
        const saved = localStorage.getItem('clientsVisibleFilters');
        return saved ? JSON.parse(saved) : { responsible: false }; // По умолчанию фильтр ответственного скрыт
    });
    // Состояние для показа модального окна выбора фильтров
    const [showFilterModal, setShowFilterModal] = useState(false);

    // useEffect для загрузки клиентов с debounce при изменении поиска или фильтра
    useEffect(() => {
        const timeout = setTimeout(() => fetchClients(searchQuery, responsibleFilter), 300); // Задержка 300мс для оптимизации
        return () => clearTimeout(timeout); // Очистка таймера при изменении зависимостей
    }, [searchQuery, responsibleFilter]); // Зависимости: поиск и фильтр

    // useEffect для загрузки списка пользователей при монтировании компонента
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await getUsers(); // Получение пользователей с сервера
                setUsers(response.data); // Сохранение в состояние
            } catch (error) {
                console.error('Error fetching users:', error); // Логирование ошибки
            }
        };
        fetchUsers(); // Вызов функции
    }, []); // Пустой массив зависимостей - выполняется один раз при монтировании

    // Функция для загрузки клиентов с параметрами поиска и фильтра
    const fetchClients = async (search = '', responsibleId = '') => {
        console.log('Fetching clients...'); // Логирование начала загрузки
        try {
            const response = await getClients(search, responsibleId); // Вызов API с параметрами
            console.log('Clients response:', response); // Логирование ответа
            setClients(response.data); // Сохранение данных в состояние
            console.log('Clients set:', response.data); // Логирование установки данных
        } catch (error) {
            console.error('Error fetching clients:', error); // Логирование ошибки
            console.error('Error details:', error.response); // Детали ошибки
        }
    };

    // Обработчик отправки формы создания клиента
    const handleSubmit = async (e) => {
        e.preventDefault(); // Предотвращение перезагрузки страницы
        try {
            await createClient(formData); // Отправка данных на сервер
            fetchClients(); // Перезагрузка списка клиентов
            resetForm(); // Сброс формы
        } catch (error) {
            console.error('Error saving client:', error); // Логирование ошибки
        }
    };

    // Обработчик клика по клиенту для просмотра деталей
    const handleView = (client) => {
        navigate(`/dashboard/clients/${client.id}`); // Переход на страницу деталей клиента
    };

    // Функция сброса формы к начальному состоянию
    const resetForm = () => {
        setFormData({ // Сброс данных формы
            name: '',
            email: '',
            phone: '',
            responsibleId: '',
        });
        setShowModal(false); // Скрытие модального окна
    };

    return (
        <div>
            {/* Заголовок страницы с кнопкой добавления клиента */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Клиенты</h2>
                {hasPermission('client_create') && (
                    <button
                        onClick={() => setShowModal(true)} // Открытие модального окна создания клиента
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                    >
                        + Добавить клиента
                    </button>
                )}
            </div>

            {/* Панель поиска и фильтров */}
            <div className="mb-4 flex gap-4">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Поиск по имени..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)} // Обновление поискового запроса
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <button
                    onClick={() => setShowFilterModal(true)} // Открытие модального окна выбора фильтров
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                >
                    Добавить фильтр
                </button>
            </div>

            {/* Фильтр по ответственному, показывается если включен */}
            {visibleFilters.responsible && (
                <div className="mb-4 flex items-center gap-2">
                    <select
                        value={responsibleFilter}
                        onChange={(e) => setResponsibleFilter(e.target.value)} // Обновление фильтра
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Все ответственные</option>
                        {users.map((user) => (
                            <option key={user.id} value={user.id}>
                                {user.fullName || user.username} {/* Отображение полного имени или username */}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={() => {
                            setVisibleFilters({ ...visibleFilters, responsible: false }); // Скрытие фильтра
                            setResponsibleFilter(''); // Сброс фильтра
                        }}
                        className="text-red-500 hover:text-red-700"
                    >
                        X {/* Кнопка удаления фильтра */}
                    </button>
                </div>
            )}

            {/* Таблица с клиентами */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Имя</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Телефон</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ответственный</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Заявок</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Объектов</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {/* Отображение списка клиентов */}
                    {clients.map((client) => (
                        <tr key={client.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleView(client)}><td className="px-6 py-4 whitespace-nowrap">{client.name}</td><td className="px-6 py-4 whitespace-nowrap">{client.email}</td><td className="px-6 py-4 whitespace-nowrap">{client.phone}</td><td className="px-6 py-4 whitespace-nowrap">{client.responsible ? client.responsible.fullName || client.responsible.email : 'Не назначен'}</td><td className="px-6 py-4 whitespace-nowrap">{client._count?.bids || 0}</td><td className="px-6 py-4 whitespace-nowrap">{client._count?.clientObjects || 0}</td></tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Модальное окно выбора фильтров */}
            {showFilterModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Выберите фильтр</h3>
                        <div className="space-y-2">
                            <button
                                onClick={() => {
                                    setVisibleFilters({ ...visibleFilters, responsible: true }); // Включение фильтра по ответственному
                                    setShowFilterModal(false); // Закрытие модального окна
                                }}
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition"
                            >
                                Ответственный
                            </button>
                        </div>
                        <div className="flex gap-2 pt-4">
                            <button
                                onClick={() => setShowFilterModal(false)} // Закрытие модального окна
                                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition"
                            >
                                Закрыть
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Модальное окно создания нового клиента */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">
                            Добавить нового клиента
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4"> {/* Форма с обработчиком отправки */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ответственный</label>
                                <select
                                    value={formData.responsibleId}
                                    onChange={(e) => setFormData({ ...formData, responsibleId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Не выбран</option>
                                    {users.map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {user.fullName || user.username}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-2 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition"
                                >
                                    Создать
                                </button>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition"
                                >
                                    Отмена
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Clients;