import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const Dashboard = () => {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-gray-100 flex">
            <aside className="w-64 bg-white shadow-lg flex flex-col">
                <div className="p-6 border-b border-gray-200">
                    <h1 className="text-2xl font-bold text-blue-600" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>Navicon</h1>
                </div>

                <nav className="flex-1 px-4 py-6">
                    <div className="space-y-2">
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
                    </div>
                </nav>

                <div className="p-4 border-t border-gray-200">
                    <button className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition mb-4">
                        Настройки
                    </button>
                    <button
                        onClick={logout}
                        className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
                    >
                        Выйти
                    </button>
                </div>
            </aside>

            <main className="flex-1 p-8">
                <Outlet />
            </main>
        </div>
    );
};

export default Dashboard;