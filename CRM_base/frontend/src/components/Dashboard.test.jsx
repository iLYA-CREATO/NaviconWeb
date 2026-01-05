import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AuthProvider } from '../context/AuthContext';
import Dashboard from './Dashboard';

// Mock the useAuth hook
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'testuser', fullName: 'Test User' },
    logout: vi.fn(),
  }),
  AuthProvider: ({ children }) => <div>{children}</div>,
}));

const renderDashboard = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Dashboard />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Dashboard Component', () => {
  test('renders Navicon logo', () => {
    renderDashboard();
    const logoElement = screen.getByText('Navicon');
    expect(logoElement).toBeInTheDocument();
  });

  test('renders navigation links', () => {
    renderDashboard();
    expect(screen.getByText('Заявки')).toBeInTheDocument();
    expect(screen.getByText('Клиенты')).toBeInTheDocument();
    expect(screen.getByText('Договоры')).toBeInTheDocument();
    expect(screen.getByText('Объекты')).toBeInTheDocument();
    expect(screen.getByText('Склад')).toBeInTheDocument();
    expect(screen.getByText('З/П')).toBeInTheDocument();
  });

  test('renders settings link', () => {
    renderDashboard();
    expect(screen.getByText('Настройки')).toBeInTheDocument();
  });

  test('renders logout button', () => {
    renderDashboard();
    expect(screen.getByText('Выйти')).toBeInTheDocument();
  });

  test('renders main content area', () => {
    renderDashboard();
    // The main element should be present
    const mainElement = document.querySelector('main');
    expect(mainElement).toBeInTheDocument();
  });
});