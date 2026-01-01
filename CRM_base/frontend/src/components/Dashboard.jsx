import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const isSettings = location.pathname === '/dashboard/settings';
    const [activeSettingsTab, setActiveSettingsTab] = useState('user');

    return (
        <div className="min-h-screen bg-gray-100 flex">
            <aside className={`${isSettings ? 'w-48 px-4 py-6' : 'w-64 bg-white shadow-lg flex flex-col'}`}>
                {isSettings ? (
                    <div>
                        <button
                            onClick={() => window.history.back()}
                            className="mb-4 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition"
                        >
                            ← Вернуться
                        </button>
                        <nav className="space-y-2">
                            <button
                                onClick={() => setActiveSettingsTab('user')}
                                className={`w-full text-left px-4 py-2 rounded-lg font-medium transition ${
                                    activeSettingsTab === 'user'
                                        ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-500'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                }`}
                            >
                                Пользователь
                            </button>
                            <button
                                onClick={() => setActiveSettingsTab('roles')}
                                className={`w-full text-left px-4 py-2 rounded-lg font-medium transition ${
                                    activeSettingsTab === 'roles'
                                        ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-500'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                }`}
                            >
                                Роли
                            </button>
                        </nav>
                    </div>
                ) : (
                    <>
                        <div className="p-6 border-b border-gray-200">
                            <h1 className="text-2xl font-bold text-blue-600" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>Navicon</h1>
                        </div>

                        <nav className="flex-1 px-4 py-6">
                            <div className="space-y-2">
                                <NavLink
                                    to="/dashboard/bids"
                                    className={({ isActive }) =>
                                        `${
                                            isActive
                                                ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-500'
                                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                        } block px-4 py-2 rounded-lg font-medium transition`
                                    }
                                >
                                    Заявки
                                </NavLink>
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
                                    Оборудование
                                </NavLink>
                                <NavLink
                                    to="/dashboard/knowledge"
                                    className={({ isActive }) =>
                                        `${
                                            isActive
                                                ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-500'
                                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                        } block px-4 py-2 rounded-lg font-medium transition`
                                    }
                                >
                                    База знаний
                                </NavLink>
                                <NavLink
                                    to="/dashboard/employees"
                                    className={({ isActive }) =>
                                        `${
                                            isActive
                                                ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-500'
                                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                        } block px-4 py-2 rounded-lg font-medium transition`
                                    }
                                >
                                    Сотрудники
                                </NavLink>
                            </div>
                        </nav>

                        <div className="p-4 border-t border-gray-200">
                            <NavLink
                                to="/dashboard/settings"
                                className={({ isActive }) =>
                                    `${isActive ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-500' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'} block px-4 py-2 rounded-lg font-medium transition mb-4`
                                }
                            >
                                Настройки
                            </NavLink>
                            <button
                                onClick={logout}
                                className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
                            >
                                Выйти
                            </button>
                        </div>
                    </>
                )}
            </aside>

            <main className="flex-1 p-8">
                <Outlet context={{ activeSettingsTab }} />
            </main>
        </div>
    );
};

export default Dashboard;