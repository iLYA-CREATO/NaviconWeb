import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Clients from './Clients';
import { getClients, createClient, getUsers } from '../services/api';

// Mock the API functions
vi.mock('../services/api', () => ({
  getClients: vi.fn(),
  createClient: vi.fn(),
  getUsers: vi.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockClients = [
  {
    id: 1,
    name: 'Test Client 1',
    email: 'client1@example.com',
    phone: '+1234567890',
    responsible: { fullName: 'John Doe' },
    _count: { bids: 2, clientObjects: 1 }
  },
  {
    id: 2,
    name: 'Test Client 2',
    email: 'client2@example.com',
    phone: '+0987654321',
    responsible: null,
    _count: { bids: 0, clientObjects: 0 }
  }
];

const mockUsers = [
  { id: 1, username: 'johndoe', fullName: 'John Doe' },
  { id: 2, username: 'janedoe', fullName: 'Jane Doe' }
];

describe('Clients Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('');
    localStorageMock.setItem.mockImplementation(() => {});

    // Setup default mocks
    getClients.mockResolvedValue({ data: mockClients });
    getUsers.mockResolvedValue({ data: mockUsers });
  });

  const renderClients = () => {
    return render(
      <BrowserRouter>
        <Clients />
      </BrowserRouter>
    );
  };

  test('renders clients page title and add button', () => {
    renderClients();

    expect(screen.getByText('Клиенты')).toBeInTheDocument();
    expect(screen.getByText('+ Добавить клиента')).toBeInTheDocument();
  });

  test('renders search input', () => {
    renderClients();

    const searchInput = screen.getByPlaceholderText('Поиск по имени...');
    expect(searchInput).toBeInTheDocument();
  });

  test('renders filter button', () => {
    renderClients();

    expect(screen.getByText('Добавить фильтр')).toBeInTheDocument();
  });

  test('displays clients table with correct headers', async () => {
    renderClients();

    await waitFor(() => {
      expect(screen.getByText('Имя')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Телефон')).toBeInTheDocument();
      expect(screen.getByText('Ответственный')).toBeInTheDocument();
      expect(screen.getByText('Заявок')).toBeInTheDocument();
      expect(screen.getByText('Объектов')).toBeInTheDocument();
    });
  });

  test('displays client data in table', async () => {
    renderClients();

    await waitFor(() => {
      expect(screen.getByText('Test Client 1')).toBeInTheDocument();
      expect(screen.getByText('client1@example.com')).toBeInTheDocument();
      expect(screen.getByText('+1234567890')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // bids count
      expect(screen.getByText('1')).toBeInTheDocument(); // clientObjects count
    });
  });

  test('displays "Не назначен" for clients without responsible', async () => {
    renderClients();

    await waitFor(() => {
      expect(screen.getByText('Не назначен')).toBeInTheDocument();
    });
  });

  test('opens add client modal when button is clicked', async () => {
    renderClients();

    const addButton = screen.getByText('+ Добавить клиента');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Добавить нового клиента')).toBeInTheDocument();
    });
  });

  test('opens filter modal when filter button is clicked', async () => {
    renderClients();

    const filterButton = screen.getByText('Добавить фильтр');
    fireEvent.click(filterButton);

    await waitFor(() => {
      expect(screen.getByText('Выберите фильтр')).toBeInTheDocument();
      expect(screen.getByText('Ответственный')).toBeInTheDocument();
    });
  });

  test('calls getClients on component mount', async () => {
    renderClients();

    await waitFor(() => {
      expect(getClients).toHaveBeenCalledWith('', '');
    });
  });

  test('calls getClients with search query when search input changes', async () => {
    renderClients();

    const searchInput = screen.getByPlaceholderText('Поиск по имени...');
    fireEvent.change(searchInput, { target: { value: 'Test' } });

    // Wait for debounce
    await waitFor(() => {
      expect(getClients).toHaveBeenCalledWith('Test', '');
    }, { timeout: 500 });
  });

  test('navigates to client detail when client row is clicked', async () => {
    renderClients();

    await waitFor(() => {
      const clientRow = screen.getByText('Test Client 1').closest('tr');
      fireEvent.click(clientRow);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/clients/1');
  });

  test('shows responsible filter when enabled', async () => {
    // Mock localStorage to return visible filters
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'clientsVisibleFilters') {
        return JSON.stringify({ responsible: true });
      }
      return '';
    });

    renderClients();

    await waitFor(() => {
      expect(screen.getByText('Все ответственные')).toBeInTheDocument();
    });
  });

  test('submits create client form successfully', async () => {
    createClient.mockResolvedValue({ data: { id: 3 } });

    renderClients();

    // Open modal
    const addButton = screen.getByText('+ Добавить клиента');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Добавить нового клиента')).toBeInTheDocument();
    });

    // Fill form
    fireEvent.change(screen.getByLabelText('Имя'), { target: { value: 'New Client' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText('Телефон'), { target: { value: '+1111111111' } });

    // Submit form
    const submitButton = screen.getByText('Создать');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(createClient).toHaveBeenCalledWith({
        name: 'New Client',
        email: 'new@example.com',
        phone: '+1111111111',
        responsibleId: '',
      });
    });
  });
});