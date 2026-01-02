import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Clients from './components/Clients';
import Bids from './components/Bids';
import ClientDetail from './components/ClientDetail';
import BidDetail from './components/BidDetail';
import ClientObjectDetail from './components/ClientObjectDetail';
import Objects from './components/Objects';
import Equipment from './components/Equipment';
import EquipmentDetail from './components/EquipmentDetail';
import EquipmentArrival from './components/EquipmentArrival';
import Settings from './components/Settings';
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
                        <Route path="client-objects/:id" element={<ClientObjectDetail />} />
                        <Route path="objects" element={<Objects />} />
                        <Route path="bids" element={<Bids />} />
                        <Route path="bids/:id" element={<BidDetail />} />
                        <Route path="equipment" element={<Equipment />} />
                        <Route path="equipment/:id" element={<EquipmentDetail />} />
                        <Route path="equipment/arrival" element={<EquipmentArrival />} />
                        <Route path="settings" element={<Settings />} />
                    </Route>

                    <Route path="/" element={<Navigate to="/dashboard/clients" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard/clients" replace />} />
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;