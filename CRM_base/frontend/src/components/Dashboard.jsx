/**
 * Dashboard Component
 *
 * Основной компонент дашборда с боковой навигацией.
 * Отображает боковую панель с меню и основную область для дочерних компонентов.
 * Включает специальный режим для страницы настроек.
 */

// Импорт компонентов и хуков из React Router
import { NavLink, Outlet, useLocation } from 'react-router-dom';
// Импорт хука состояния
import { useState, useEffect } from 'react';
// Импорт хука аутентификации
import { useAuth } from '../context/AuthContext.jsx';
// Импорт хука прав доступа
import { usePermissions } from '../hooks/usePermissions.js';

const Dashboard = () => {
    // Получение данных пользователя и функции выхода из контекста аутентификации
    const { user, logout } = useAuth();
    // Хук для проверки прав доступа
    const { canAccessTab, hasPermission } = usePermissions();
    // Хук для получения текущего пути
    const location = useLocation();
    // Проверка, находится ли пользователь на странице настроек
    const isSettings = location.pathname === '/dashboard/settings';
    // Состояние для активной вкладки в настройках
    const [activeSettingsTab, setActiveSettingsTab] = useState('user');

    // Определение доступных вкладок настроек
    const availableSettingsTabs = [
        { id: 'user', permission: 'settings_user_button', label: 'Пользователь' },
        { id: 'roles', permission: 'settings_role_button', label: 'Роли' },
        { id: 'specification-categories', permission: 'settings_spec_category_button', label: 'Категории спецификаций' },
        { id: 'specifications', permission: 'settings_spec_button', label: 'Спецификации' },
        { id: 'bid-types', permission: 'settings_bid_type_button', label: 'Тип Заявки' },
    ];

    // Установка активной вкладки на первую доступную при входе на страницу настроек
    useEffect(() => {
        if (isSettings && activeSettingsTab === 'user') { // Только если мы еще не переключались
            const firstAvailableTab = availableSettingsTabs.find(tab => hasPermission(tab.permission));
            if (firstAvailableTab && firstAvailableTab.id !== 'user') {
                setActiveSettingsTab(firstAvailableTab.id);
            }
        }
    }, [isSettings, activeSettingsTab]);

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Боковая панель: ширина зависит от того, на странице настроек ли пользователь */}
            <aside className={`${isSettings ? 'w-48 px-4 py-6 bg-white fixed left-0 top-0 h-screen' : 'w-64 bg-white shadow-lg flex flex-col fixed left-0 top-0 h-screen'}`}>
                {/* Условный рендеринг: если на странице настроек */}
                {isSettings ? (
                    <div>
                        {/* Кнопка возврата на предыдущую страницу */}
                        <button
                            onClick={() => window.history.back()}
                            className="mb-4 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition"
                        >
                            ← Вернуться
                        </button>
                        {/* Навигация по вкладкам настроек */}
                        <nav className="space-y-2">
                            {availableSettingsTabs
                                .filter(tab => hasPermission(tab.permission))
                                .map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveSettingsTab(tab.id)}
                                        className={`w-full text-left px-4 py-2 rounded-lg font-medium transition ${
                                            activeSettingsTab === tab.id
                                                ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-500' // Активная вкладка
                                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' // Неактивная
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                        </nav>
                    </div>
                ) : (
                    <>
                        {/* Логотип в верхней части боковой панели */}
                        <div className="p-6 border-b border-gray-200">
                            <h1 className="text-2xl font-bold text-blue-600" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>Navicon</h1>
                        </div>

                        {/* Основная навигация */}
                        <nav className="flex-1 px-4 py-6">
                            <div className="space-y-2">
                                {/* Ссылка на страницу заявок */}
                                <NavLink
                                    to="/dashboard/bids"
                                    className={({ isActive }) =>
                                        `${
                                            isActive
                                                ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-500' // Активная ссылка
                                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' // Неактивная
                                        } block px-4 py-2 rounded-lg font-medium transition`
                                    }
                                >
                                    Заявки
                                </NavLink>
                                {/* Ссылка на страницу клиентов */}
                                <NavLink
                                    to="/dashboard/clients"
                                    className={({ isActive }) =>
                                        `${
                                            isActive
                                                ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-500'
                                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                        } block px-4 py-2 rounded-lg font-medium transition`
                                    }
                                >
                                    Клиенты
                                </NavLink>
                                {/* Ссылка на страницу договоров */}
                                <NavLink
                                    to="/dashboard/contracts"
                                    className={({ isActive }) =>
                                        `${
                                            isActive
                                                ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-500'
                                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                        } block px-4 py-2 rounded-lg font-medium transition`
                                    }
                                >
                                    Договоры
                                </NavLink>
                                {/* Ссылка на страницу объектов */}
                                <NavLink
                                    to="/dashboard/objects"
                                    className={({ isActive }) =>
                                        `${
                                            isActive
                                                ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-500'
                                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                        } block px-4 py-2 rounded-lg font-medium transition`
                                    }
                                >
                                    Объекты
                                </NavLink>
                                {/* Ссылка на страницу оборудования */}
                                {canAccessTab('warehouse') && (
                                    <NavLink
                                        to="/dashboard/equipment"
                                        className={({ isActive }) =>
                                            `${
                                                isActive
                                                    ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-500'
                                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                            } block px-4 py-2 rounded-lg font-medium transition`
                                        }
                                    >
                                        Склад
                                    </NavLink>
                                )}
                                {/* Ссылка на страницу зарплаты */}
                                {canAccessTab('salary') && (
                                    <NavLink
                                        to="/dashboard/salary"
                                        className={({ isActive }) =>
                                            `${
                                                isActive
                                                    ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-500'
                                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                            } block px-4 py-2 rounded-lg font-medium transition`
                                        }
                                    >
                                        З/П
                                    </NavLink>
                                )}
                            </div>
                        </nav>

                        {/* Нижняя часть боковой панели с настройками и выходом */}
                        <div className="p-4 border-t border-gray-200">
                            {/* Ссылка на настройки */}
                            <NavLink
                                to="/dashboard/settings"
                                className={({ isActive }) =>
                                    `${isActive ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-500' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'} block px-4 py-2 rounded-lg font-medium transition mb-4`
                                }
                            >
                                Настройки
                            </NavLink>
                            {/* Кнопка выхода */}
                            <button
                                onClick={logout} // Вызов функции выхода из контекста
                                className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
                            >
                                Выйти
                            </button>
                        </div>
                    </>
                )}
            </aside>

            {/* Основная область для отображения дочерних компонентов */}
            <main className={`${isSettings ? 'ml-48' : 'ml-64'} p-8`}>
                <Outlet key={activeSettingsTab} context={{ activeSettingsTab }} /> {/* Передача контекста дочерним маршрутам */}
            </main>
        </div>
    );
};

export default Dashboard;