import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const Dashboard = () => {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-gray-800">Система CRM</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-600">Добро пожаловать, {user?.username}</span>
                            <button
                                onClick={logout}
                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
                            >
                                Выйти
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            <NavLink
                                to="/dashboard/clients"
                                className={({ isActive }) =>
                                    `${
                                        isActive
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition`
                                }
                            >
                                Клиенты
                            </NavLink>
                            <NavLink
                                to="/dashboard/bids"
                                className={({ isActive }) =>
                                    `${
                                        isActive
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition`
                                }
                            >
                                Заявки
                            </NavLink>
                        </nav>
                    </div>
                </div>

                <div className="mt-6">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;