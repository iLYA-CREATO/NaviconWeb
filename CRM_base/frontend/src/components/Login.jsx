import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginAPI } from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';
import Button from './Button';
import Input from './Input';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [credentials, setCredentials] = useState({
        username: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await loginAPI(credentials);
            login(response.data.user, response.data.token);
            navigate('/dashboard/clients');
        } catch (err) {
            setError(err.response?.data?.message || 'Вход не удался');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
                <h1 className="text-3xl font-bold text-blue-600 mb-6 text-center" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
                    Navicon
                </h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    <Input
                        type="text"
                        value={credentials.username}
                        onChange={(e) =>
                            setCredentials({ ...credentials, username: e.target.value })
                        }
                        placeholder="Введите имя пользователя"
                        label="Имя пользователя"
                        required
                    />

                    <Input
                        type="password"
                        value={credentials.password}
                        onChange={(e) =>
                            setCredentials({ ...credentials, password: e.target.value })
                        }
                        placeholder="Введите пароль"
                        label="Пароль"
                        required
                    />

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        loading={loading}
                        className="w-full"
                    >
                        {loading ? 'Вход...' : 'Войти'}
                    </Button>
                </form>


            </div>
        </div>
    );
};

export default Login;