import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Clients from './components/Clients';
import Bids from './components/Bids';
import ClientDetail from './components/ClientDetail';
import BidDetail from './components/BidDetail';
import './index.css';

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<Navigate to="/dashboard/clients" replace />} />
                        <Route path="clients" element={<Clients />} />
                        <Route path="clients/:id" element={<ClientDetail />} />
                        <Route path="bids" element={<Bids />} />
                        <Route path="bids/:id" element={<BidDetail />} />
                    </Route>

                    <Route path="/" element={<Navigate to="/dashboard/clients" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard/clients" replace />} />
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;