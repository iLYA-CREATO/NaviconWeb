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
    // Состояние для свернутой/развернутой боковой панели
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Определение доступных вкладок настроек
    const availableSettingsTabs = [
        { id: 'user', permission: 'settings_user_button', label: 'Пользователь' },
        { id: 'roles', permission: 'settings_role_button', label: 'Роли' },
        { id: 'client-attributes', permission: 'settings_client_attributes_button', label: 'Атрибуты клиентов' },
        { id: 'specification-categories', permission: 'settings_spec_category_button', label: 'Категории спецификаций' },
        { id: 'specifications', permission: 'settings_spec_button', label: 'Спецификации' },
        { id: 'bid-types', permission: 'settings_bid_type_button', label: 'Тип Заявки' },
        { id: 'administration', permission: 'settings_administration_button', label: 'Администрирование' },
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

    // Функция для получения иконки для вкладки настроек
    const getSettingsIcon = (tabId) => {
        const icons = {
            'user': '👤',
            'roles': '🔐',
            'client-attributes': '🏷️',
            'specification-categories': '📂',
            'specifications': '📋',
            'bid-types': '🎯',
            'administration': '⚙️'
        };
        return icons[tabId] || '⚙️';
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Боковая панель: ширина зависит от состояния свернутости и страницы настроек */}
            <aside className={`${isSettings ? `${isSidebarCollapsed ? 'w-16' : 'w-48'} px-4 py-6 bg-white fixed left-0 top-0 h-screen transition-all duration-300` : `${isSidebarCollapsed ? 'w-16' : 'w-64'} bg-white shadow-lg flex flex-col fixed left-0 top-0 h-screen transition-all duration-300`}`}>
                {/* Условный рендеринг: если на странице настроек */}
                {isSettings ? (
                    <div>
                        {/* Кнопка сворачивания/разворачивания боковой панели */}
                        <button
                            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            className={`mb-4 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition font-medium ${isSidebarCollapsed ? 'flex justify-center items-center w-full p-2 text-lg' : 'px-4 py-2 w-full'}`}
                            title={isSidebarCollapsed ? "Развернуть панель" : "Свернуть панель"}
                        >
                            {isSidebarCollapsed ? '→' : '← Свернуть панель'}
                        </button>
                        {/* Кнопка возврата на предыдущую страницу */}
                        <button
                            onClick={() => window.history.back()}
                            className={`mb-4 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition font-medium ${isSidebarCollapsed ? 'flex justify-center items-center w-full p-2 text-lg' : 'px-4 py-2 w-full'}`}
                            title="Вернуться"
                        >
                            🚪
                        </button>
                        {/* Навигация по вкладкам настроек */}
                        <nav className="space-y-2">
                            {availableSettingsTabs
                                .filter(tab => hasPermission(tab.permission) || user?.role === 'Админ')
                                .map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveSettingsTab(tab.id)}
                                        className={`${isSidebarCollapsed ? 'flex justify-center px-2 py-2' : 'w-full text-left px-4 py-2'} rounded-lg font-medium transition ${
                                            activeSettingsTab === tab.id
                                                ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-500' // Активная вкладка
                                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' // Неактивная
                                        }`}
                                        title={isSidebarCollapsed ? tab.label : ""}
                                    >
                                        {isSidebarCollapsed ? getSettingsIcon(tab.id) : tab.label}
                                    </button>
                                ))}
                        </nav>
                    </div>
                ) : (
                    <>
                        {/* Логотип в верхней части боковой панели */}
                        <div className={`p-6 border-b border-gray-200 ${isSidebarCollapsed && !isSettings ? 'flex justify-center' : ''}`}>
                            {!isSidebarCollapsed && <h1 className="text-2xl font-bold text-blue-600" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>Navicon</h1>}
                            {!isSettings && (
                                <button
                                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                                    className={`text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-all p-2 rounded font-bold text-lg ${isSidebarCollapsed ? '' : 'float-right'}`}
                                    title={isSidebarCollapsed ? "Развернуть" : "Свернуть"}
                                >
                                    {isSidebarCollapsed ? '→' : '←'}
                                </button>
                            )}
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
                                        } ${isSidebarCollapsed ? 'flex justify-center' : ''} block px-4 py-2 rounded-lg font-medium transition`
                                    }
                                    title={isSidebarCollapsed ? "Заявки" : ""}
                                >
                                    {isSidebarCollapsed ? '📋' : 'Заявки'}
                                </NavLink>
                                {/* Ссылка на страницу клиентов */}
                                <NavLink
                                    to="/dashboard/clients"
                                    className={({ isActive }) =>
                                        `${
                                            isActive
                                                ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-500'
                                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                        } ${isSidebarCollapsed ? 'flex justify-center' : ''} block px-4 py-2 rounded-lg font-medium transition`
                                    }
                                    title={isSidebarCollapsed ? "Клиенты" : ""}
                                >
                                    {isSidebarCollapsed ? '👥' : 'Клиенты'}
                                </NavLink>
                                {/* Ссылка на страницу договоров */}
                                <NavLink
                                    to="/dashboard/contracts"
                                    className={({ isActive }) =>
                                        `${
                                            isActive
                                                ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-500'
                                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                        } ${isSidebarCollapsed ? 'flex justify-center' : ''} block px-4 py-2 rounded-lg font-medium transition`
                                    }
                                    title={isSidebarCollapsed ? "Договоры" : ""}
                                >
                                    {isSidebarCollapsed ? '📄' : 'Договоры'}
                                </NavLink>
                                {/* Ссылка на страницу объектов */}
                                <NavLink
                                    to="/dashboard/objects"
                                    className={({ isActive }) =>
                                        `${
                                            isActive
                                                ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-500'
                                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                        } ${isSidebarCollapsed ? 'flex justify-center' : ''} block px-4 py-2 rounded-lg font-medium transition`
                                    }
                                    title={isSidebarCollapsed ? "Объекты" : ""}
                                >
                                    {isSidebarCollapsed ? '🏢' : 'Объекты'}
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
                                            } ${isSidebarCollapsed ? 'flex justify-center' : ''} block px-4 py-2 rounded-lg font-medium transition`
                                        }
                                        title={isSidebarCollapsed ? "Оборудование" : ""}
                                    >
                                        {isSidebarCollapsed ? '📦' : 'Оборудование'}
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
                                            } ${isSidebarCollapsed ? 'flex justify-center' : ''} block px-4 py-2 rounded-lg font-medium transition`
                                        }
                                        title={isSidebarCollapsed ? "Зарплата" : ""}
                                    >
                                        {isSidebarCollapsed ? '💰' : 'З/П'}
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
                                    `${isActive ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-500' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'} ${isSidebarCollapsed ? 'flex justify-center' : ''} block px-4 py-2 rounded-lg font-medium transition mb-4`
                                }
                                title={isSidebarCollapsed ? "Настройки" : ""}
                            >
                                {isSidebarCollapsed ? '⚙️' : 'Настройки'}
                            </NavLink>
                            {/* Кнопка выхода */}
                            <button
                                onClick={logout} // Вызов функции выхода из контекста
                                className={`${isSidebarCollapsed ? 'flex justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2 rounded transition-all' : 'w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition'}`}
                                title={isSidebarCollapsed ? "Выйти" : ""}
                            >
                                {isSidebarCollapsed ? '🚪' : 'Выйти'}
                            </button>
                        </div>
                    </>
                )}
            </aside>

            {/* Основная область для отображения дочерних компонентов */}
            <main className={`${isSettings ? (isSidebarCollapsed ? 'ml-16' : 'ml-48') : isSidebarCollapsed ? 'ml-16' : 'ml-64'} p-8 transition-all duration-300`}>
                <Outlet key={activeSettingsTab} context={{ activeSettingsTab }} /> {/* Передача контекста дочерним маршрутам */}
            </main>
        </div>
    );
};

export default Dashboard;