import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { usePermissions } from '../hooks/usePermissions.js';
import { register, getUsers, createUser, updateUser, deleteUser, getRoles, createRole, updateRole, deleteRole, getSpecifications, createSpecification, updateSpecification, deleteSpecification, getSpecificationCategories, getSpecificationCategoriesTree, createSpecificationCategory, updateSpecificationCategory, deleteSpecificationCategory, getBidTypes, createBidType, updateBidType, deleteBidType, getBidStatuses, createBidStatus, updateBidStatus, deleteBidStatus, getBidStatusTransitions, createBidStatusTransition, deleteBidStatusTransition, bulkUploadClients, getClients, getBids, getClientObjects, bulkUploadClientObjects, getClientAttributes, getEnabledClientAttributes, createClientAttribute, updateClientAttribute, deleteClientAttribute, getBidAttributes, createBidAttribute, updateBidAttribute, deleteBidAttribute } from '../services/api';
import * as XLSX from 'xlsx';

const Settings = () => {
    const { user } = useAuth();
    const { hasPermission } = usePermissions();
    const { activeSettingsTab } = useOutletContext();
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        fullName: '',
        email: '',
        password: '',
        role: '',
    });
    const [showRoleForm, setShowRoleForm] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [roleFormData, setRoleFormData] = useState({
        name: '',
        description: '',
        permissions: {
            // Права пользователей
            user_create: false,
            user_edit: false,
            user_delete: false,

            // Права ролей
            role_create: false,
            role_edit: false,
            role_delete: false,

            // Права категорий спецификаций
            spec_category_create: false,
            spec_category_edit: false,
            spec_category_delete: false,

            // Права спецификаций
            spec_create: false,
            spec_edit: false,
            spec_delete: false,

            // Права типов заявок
            bid_type_create: false,
            bid_type_edit: false,
            bid_type_delete: false,

            // Права клиентов
            client_create: false,
            client_edit: false,
            client_delete: false,

            // Права объектов обслуживания
            client_object_create: false,
            client_object_edit: false,
            client_object_delete: false,

            // Права заявок
            bid_create: false,
            bid_edit: false,
            bid_delete: false,

            // Права оборудования в заявках
            bid_equipment_add: false,

            // Права оборудования
            equipment_create: false,
            equipment_edit: false,
            equipment_delete: false,

            // Права вкладок
            tab_warehouse: false,
            tab_salary: false,

            // Права видимости кнопок в настройках
            settings_user_button: false,
            settings_role_button: false,
            settings_spec_category_button: false,
            settings_spec_button: false,
            settings_bid_type_button: false,
        },
    });
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [editingUser, setEditingUser] = useState(null);
    const [notification, setNotification] = useState(null);
    const [loadingRoles, setLoadingRoles] = useState(false);
    const [specifications, setSpecifications] = useState([]);
    const [showSpecificationForm, setShowSpecificationForm] = useState(false);
    const [editingSpecification, setEditingSpecification] = useState(null);
    const [specificationFormData, setSpecificationFormData] = useState({
        categoryId: '',
        name: '',
        discount: '',
        cost: '',
    });
    const [clientAttributes, setClientAttributes] = useState([]);
    const [showClientAttributeForm, setShowClientAttributeForm] = useState(false);
    const [editingClientAttribute, setEditingClientAttribute] = useState(null);
    const [clientAttributeFormData, setClientAttributeFormData] = useState({
        name: '',
        type: 'string',
        options: [],
        isEnabled: true,
    });
    const [bidAttributes, setBidAttributes] = useState([]);
    const [showBidAttributeForm, setShowBidAttributeForm] = useState(false);
    const [editingBidAttribute, setEditingBidAttribute] = useState(null);
    const [bidAttributeFormData, setBidAttributeFormData] = useState({
        name: '',
        type: 'string',
        options: [],
        isEnabled: true,
    });
    const [activeAttributeTab, setActiveAttributeTab] = useState('client-attributes');
    const [specificationCategories, setSpecificationCategories] = useState([]);
    const [allSpecificationCategories, setAllSpecificationCategories] = useState([]);
    const [expandedCategories, setExpandedCategories] = useState(new Set());
    const [expandedSpecCategories, setExpandedSpecCategories] = useState(new Set());
    const [showSpecificationCategoryForm, setShowSpecificationCategoryForm] = useState(false);
    const [editingSpecificationCategory, setEditingSpecificationCategory] = useState(null);
    const [specificationCategoryFormData, setSpecificationCategoryFormData] = useState({
        name: '',
        description: '',
        parentId: '',
    });
    const [bidTypes, setBidTypes] = useState([]);
    const [showBidTypeForm, setShowBidTypeForm] = useState(false);
    const [editingBidType, setEditingBidType] = useState(null);
    const [bidTypeFormData, setBidTypeFormData] = useState({
        name: '',
        description: '',
        statuses: [],
        transitions: [],
        plannedReactionTimeMinutes: '',
        plannedDurationMinutes: '',
    });
    const [showBidStatusFormInEdit, setShowBidStatusFormInEdit] = useState(false);
    const [editingBidStatusInEdit, setEditingBidStatusInEdit] = useState(null);
    const [bidStatusFormDataInEdit, setBidStatusFormDataInEdit] = useState({
        name: '',
        position: '',
        allowedActions: [],
    });
    const [editingStatusPosition, setEditingStatusPosition] = useState(null);
    const [showClientUploadModal, setShowClientUploadModal] = useState(false);
    const [showClientObjectUploadModal, setShowClientObjectUploadModal] = useState(false);
    const fileInputRef = useRef(null);
    const clientObjectFileInputRef = useRef(null);

    const calculateNextPosition = (statuses) => {
        const existingPositions = statuses.map(s => s.position).sort((a, b) => a - b);
        let position = 2;
        while (existingPositions.includes(position) && position < 999) {
            position++;
        }
        return position < 999 ? position : null;
    };

    useEffect(() => {
        // Загружаем только данные для первой доступной вкладки
        const availableTabs = [
            { id: 'user', permission: 'settings_user_button' },
            { id: 'roles', permission: 'settings_role_button' },
            { id: 'client-attributes', permission: 'settings_client_attributes_button' },
            { id: 'bid-attributes', permission: 'settings_bid_attributes_button' },
            { id: 'specifications', permission: 'settings_spec_button' },
            { id: 'bid-types', permission: 'settings_bid_type_button' },
            { id: 'administration', permission: 'settings_administration_button' },
        ];

        const firstAvailableTab = availableTabs.find(tab => hasPermission(tab.permission));
        if (firstAvailableTab) {
            switch (firstAvailableTab.id) {
                case 'user':
                    fetchUsers();
                    if (hasPermission('user_create')) {
                        fetchRoles();
                    }
                    break;
                case 'roles':
                    fetchRoles();
                    break;
                case 'specifications':
                    fetchSpecifications();
                    break;
                case 'bid-types':
                    fetchBidTypes();
                    break;
            }
        }
    }, [hasPermission]);

    useEffect(() => {
        console.log('Debug: Current logged-in user information:', user);
    }, [user]);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    // Загрузка данных при переключении вкладки
    useEffect(() => {
        switch (activeSettingsTab) {
            case 'user':
                if (users.length === 0 && hasPermission('user_edit')) {
                    fetchUsers();
                }
                if (roles.length === 0 && hasPermission('user_create')) {
                    fetchRoles();
                }
                break;
            case 'roles':
                if (roles.length === 0 && hasPermission('role_create')) {
                    fetchRoles();
                }
                break;
            case 'specifications':
                if (specifications.length === 0 && hasPermission('settings_spec_button')) {
                    fetchSpecifications();
                }
                if (allSpecificationCategories.length === 0 && hasPermission('settings_spec_button')) {
                    fetchSpecificationCategories();
                }
                break;
            case 'bid-types':
                if (bidTypes.length === 0 && hasPermission('bid_type_create')) {
                    fetchBidTypes();
                }
                break;
            case 'attributes':
                fetchClientAttributes();
                fetchBidAttributes();
                break;
            case 'administration':
                // Административные функции - данные не требуются
                break;
            default:
                break;
        }
    }, [activeSettingsTab, hasPermission, users.length, roles.length, clientAttributes.length, bidAttributes.length, allSpecificationCategories.length, specifications.length, bidTypes.length]);

    const fetchUsers = async () => {
        try {
            const response = await getUsers();
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchRoles = async () => {
        if (loadingRoles) return; // Prevent multiple calls
        setLoadingRoles(true);
        try {
            const response = await getRoles();
            setRoles(response.data);
        } catch (error) {
            console.error('Error fetching roles:', error);
            setRoles([]);
        } finally {
            setLoadingRoles(false);
        }
    };

    const fetchSpecifications = async () => {
        try {
            const response = await getSpecifications();
            setSpecifications(response.data);
        } catch (error) {
            console.error('Error fetching specifications:', error);
        }
    };

    const fetchSpecificationCategories = async () => {
        try {
            const [treeResponse, flatResponse] = await Promise.all([
                getSpecificationCategoriesTree(),
                getSpecificationCategories()
            ]);
            setSpecificationCategories(treeResponse.data);
            setAllSpecificationCategories(flatResponse.data);
        } catch (error) {
            console.error('Error fetching specification categories:', error);
        }
    };

    const fetchBidTypes = async () => {
        try {
            const response = await getBidTypes();
            setBidTypes(response.data);
        } catch (error) {
            console.error('Error fetching bid types:', error);
        }
    };



    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingUser) {
                await updateUser(editingUser.id, formData);
                setNotification({ type: 'success', message: 'Пользователь обновлен успешно' });
            } else {
                await createUser(formData);
                setNotification({ type: 'success', message: 'Пользователь создан успешно' });
            }
            setFormData({ username: '', fullName: '', email: '', password: '', role: 'user' });
            setEditingUser(null);
            setShowForm(false);
            fetchUsers();
        } catch (error) {
            console.error('Error saving user:', error);
            setNotification({ type: 'error', message: 'Ошибка при сохранении пользователя' });
        }
    };

    const handleRoleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingRole) {
                await updateRole(editingRole.id, roleFormData);
                setNotification({ type: 'success', message: 'Роль обновлена успешно' });
            } else {
                await createRole(roleFormData);
                setNotification({ type: 'success', message: 'Роль создана успешно' });
            }
            setRoleFormData({
                name: '',
                description: '',
                permissions: {
                    // Права пользователей
                    user_create: false,
                    user_edit: false,
                    user_delete: false,

                    // Права ролей
                    role_create: false,
                    role_edit: false,
                    role_delete: false,

                    // Права категорий спецификаций
                    spec_category_create: false,
                    spec_category_edit: false,
                    spec_category_delete: false,

                    // Права спецификаций
                    spec_create: false,
                    spec_edit: false,
                    spec_delete: false,

                    // Права типов заявок
                    bid_type_create: false,
                    bid_type_edit: false,
                    bid_type_delete: false,

                    // Права клиентов
                    client_create: false,
                    client_edit: false,
                    client_delete: false,

                    // Права объектов обслуживания
                    client_object_create: false,
                    client_object_edit: false,
                    client_object_delete: false,

                    // Права заявок
                    bid_create: false,
                    bid_edit: false,
                    bid_delete: false,

                    // Права оборудования в заявках
                    bid_equipment_add: false,

                    // Права оборудования
                    equipment_create: false,
                    equipment_edit: false,
                    equipment_delete: false,

                    // Права вкладок
                    tab_warehouse: false,
                    tab_salary: false,

                    // Права видимости кнопок в настройках
                    settings_user_button: false,
                    settings_role_button: false,
                    settings_spec_category_button: false,
                    settings_spec_button: false,
                    settings_bid_type_button: false,
                }
            });
            setEditingRole(null);
            setShowRoleForm(false);
            fetchRoles();
        } catch (error) {
            console.error('Error saving role:', error);
            setNotification({ type: 'error', message: 'Ошибка при сохранении роли' });
        }
    };

    const handleEditRole = (role) => {
        setEditingRole(role);
        setRoleFormData({
            name: role.name,
            description: role.description,
            permissions: {
                // Права пользователей
                user_create: false,
                user_edit: false,
                user_delete: false,

                // Права ролей
                role_create: false,
                role_edit: false,
                role_delete: false,

                // Права категорий спецификаций
                spec_category_create: false,
                spec_category_edit: false,
                spec_category_delete: false,

                // Права спецификаций
                spec_create: false,
                spec_edit: false,
                spec_delete: false,

                // Права типов заявок
                bid_type_create: false,
                bid_type_edit: false,
                bid_type_delete: false,

                // Права клиентов
                client_create: false,
                client_edit: false,
                client_delete: false,

                // Права объектов обслуживания
                client_object_create: false,
                client_object_edit: false,
                client_object_delete: false,

                // Права заявок
                bid_create: false,
                bid_edit: false,
                bid_delete: false,

                // Права оборудования в заявках
                bid_equipment_add: false,

                // Права оборудования
                equipment_create: false,
                equipment_edit: false,
                equipment_delete: false,

                // Права вкладок
                tab_warehouse: false,
                tab_salary: false,

                // Права видимости кнопок в настройках
                settings_user_button: false,
                settings_role_button: false,
                settings_spec_category_button: false,
                settings_spec_button: false,
                settings_bid_type_button: false,

                // Объединяем с существующими правами роли
                ...(role.permissions || {}),
            }
        });
        setShowRoleForm(true);
    };

    const handleDeleteRole = async (id) => {
        if (window.confirm('Вы уверены, что хотите удалить эту роль?')) {
            try {
                await deleteRole(id);
                setNotification({ type: 'success', message: 'Роль удалена успешно' });
                fetchRoles();
            } catch (error) {
                console.error('Error deleting role:', error);
                setNotification({ type: 'error', message: 'Ошибка при удалении роли' });
            }
        }
    };

    const fetchClientAttributes = async () => {
        try {
            const response = await getClientAttributes();
            setClientAttributes(response.data);
        } catch (error) {
            console.error('Error fetching client attributes:', error);
        }
    };

    const handleClientAttributeSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingClientAttribute) {
                await updateClientAttribute(editingClientAttribute.id, clientAttributeFormData);
                setNotification({ type: 'success', message: 'Атрибут обновлен успешно' });
            } else {
                await createClientAttribute(clientAttributeFormData);
                setNotification({ type: 'success', message: 'Атрибут создан успешно' });
            }
            setClientAttributeFormData({
                name: '',
                type: 'string',
                options: [],
                isEnabled: true,
            });
            setEditingClientAttribute(null);
            setShowClientAttributeForm(false);
            fetchClientAttributes();
        } catch (error) {
            console.error('Error saving client attribute:', error);
            setNotification({ type: 'error', message: 'Ошибка при сохранении атрибута' });
        }
    };

    const handleDeleteClientAttribute = async (id) => {
        if (window.confirm('Вы уверены, что хотите удалить этот атрибут?')) {
            try {
                await deleteClientAttribute(id);
                setNotification({ type: 'success', message: 'Атрибут удален успешно' });
                fetchClientAttributes();
            } catch (error) {
                console.error('Error deleting client attribute:', error);
                setNotification({ type: 'error', message: 'Ошибка при удалении атрибута' });
            }
        }
    };

    const fetchBidAttributes = async () => {
        try {
            const response = await getBidAttributes();
            setBidAttributes(response.data);
        } catch (error) {
            console.error('Error fetching bid attributes:', error);
        }
    };

    const handleBidAttributeSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingBidAttribute) {
                await updateBidAttribute(editingBidAttribute.id, bidAttributeFormData);
                setNotification({ type: 'success', message: 'Атрибут заявки обновлен успешно' });
            } else {
                await createBidAttribute(bidAttributeFormData);
                setNotification({ type: 'success', message: 'Атрибут заявки создан успешно' });
            }
            setShowBidAttributeForm(false);
            fetchBidAttributes();
        } catch (error) {
            console.error('Error saving bid attribute:', error);
            setNotification({ type: 'error', message: 'Ошибка при сохранении атрибута' });
        }
    };

    const handleDeleteBidAttribute = async (id) => {
        if (window.confirm('Вы уверены, что хотите удалить этот атрибут?')) {
            try {
                await deleteBidAttribute(id);
                setNotification({ type: 'success', message: 'Атрибут заявки удален успешно' });
                fetchBidAttributes();
            } catch (error) {
                console.error('Error deleting bid attribute:', error);
                setNotification({ type: 'error', message: 'Ошибка при удалении атрибута' });
            }
        }
    };

    const handlePermissionChange = (permissionKey, value) => {
        setRoleFormData(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [permissionKey]: value
            }
        }));
    };

    const handleEditUser = (user) => {
        setEditingUser(user);
        setFormData({
            username: user.username,
            fullName: user.fullName,
            email: user.email,
            password: '',
            role: user.role,
        });
        setShowForm(true);
    };

    const handleDeleteUser = async (id) => {
        const userToDelete = users.find(u => u.id === id);
        if (userToDelete.role === 'Админ') {
            setNotification({ type: 'error', message: 'Нельзя удалить администратора' });
            return;
        }
        if (window.confirm('Вы уверены, что хотите удалить этого пользователя?')) {
            try {
                await deleteUser(id);
                setNotification({ type: 'success', message: 'Пользователь удален успешно' });
                fetchUsers();
            } catch (error) {
                console.error('Error deleting user:', error);
                setNotification({ type: 'error', message: 'Ошибка при удалении пользователя' });
            }
        }
    };

    const handleSpecificationSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingSpecification) {
                await updateSpecification(editingSpecification.id, specificationFormData);
                setNotification({ type: 'success', message: 'Спецификация обновлена успешно' });
            } else {
                await createSpecification(specificationFormData);
                setNotification({ type: 'success', message: 'Спецификация создана успешно' });
            }
            setSpecificationFormData({ categoryId: '', name: '', discount: '', cost: '' });
            setEditingSpecification(null);
            setShowSpecificationForm(false);
            fetchSpecifications();
        } catch (error) {
            console.error('Error saving specification:', error);
            setNotification({ type: 'error', message: 'Ошибка при сохранении спецификации' });
        }
    };

    const handleEditSpecification = (specification) => {
        setEditingSpecification(specification);
        setSpecificationFormData({
            categoryId: specification.categoryId.toString(),
            name: specification.name,
            discount: specification.discount.toString(),
            cost: specification.cost.toString(),
        });
        setShowSpecificationForm(true);
    };

    const handleDeleteSpecification = async (id) => {
        if (window.confirm('Вы уверены, что хотите удалить эту спецификацию?')) {
            try {
                await deleteSpecification(id);
                setNotification({ type: 'success', message: 'Спецификация удалена успешно' });
                fetchSpecifications();
            } catch (error) {
                console.error('Error deleting specification:', error);
                setNotification({ type: 'error', message: 'Ошибка при удалении спецификации' });
            }
        }
    };

    const handleSpecificationCategorySubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingSpecificationCategory) {
                await updateSpecificationCategory(editingSpecificationCategory.id, specificationCategoryFormData);
                setNotification({ type: 'success', message: 'Категория спецификаций обновлена успешно' });
            } else {
                await createSpecificationCategory(specificationCategoryFormData);
                setNotification({ type: 'success', message: 'Категория спецификаций создана успешно' });
            }
            setSpecificationCategoryFormData({ name: '', description: '' });
            setEditingSpecificationCategory(null);
            setShowSpecificationCategoryForm(false);
            fetchSpecificationCategories();
        } catch (error) {
            console.error('Error saving specification category:', error);
            setNotification({ type: 'error', message: 'Ошибка при сохранении категории спецификаций' });
        }
    };

    const handleEditSpecificationCategory = (category) => {
        setEditingSpecificationCategory(category);
        setSpecificationCategoryFormData({
            name: category.name,
            description: category.description || '',
            parentId: category.parentId ? category.parentId.toString() : '',
        });
        setShowSpecificationCategoryForm(true);
    };

    const handleDeleteSpecificationCategory = async (id) => {
        if (window.confirm('Вы уверены, что хотите удалить эту категорию спецификаций?')) {
            try {
                await deleteSpecificationCategory(id);
                setNotification({ type: 'success', message: 'Категория спецификаций удалена успешно' });
                fetchSpecificationCategories();
            } catch (error) {
                console.error('Error deleting specification category:', error);
                setNotification({ type: 'error', message: 'Ошибка при удалении категории спецификаций' });
            }
        }
    };

    const handleBidTypeSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingBidType) {
                await updateBidType(editingBidType.id, bidTypeFormData);
                setNotification({ type: 'success', message: 'Тип заявки обновлен успешно' });
            } else {
                await createBidType(bidTypeFormData);
                setNotification({ type: 'success', message: 'Тип заявки создан успешно' });
            }
            setBidTypeFormData({ name: '', description: '', statuses: [], transitions: [], plannedReactionTimeMinutes: '', plannedDurationMinutes: '' });
            setEditingBidType(null);
            setShowBidTypeForm(false);
            setShowBidStatusFormInEdit(false);
            setEditingBidStatusInEdit(null);
            setBidStatusFormDataInEdit({ name: '', position: '', allowedActions: [] });
            setEditingStatusPosition(null);
            fetchBidTypes();
        } catch (error) {
            console.error('Error saving bid type:', error);
            setNotification({ type: 'error', message: 'Ошибка при сохранении типа заявки' });
        }
    };

    const handleEditBidType = (bidType) => {
        setEditingBidType(bidType);
        setBidTypeFormData({
            name: bidType.name,
            description: bidType.description || '',
            statuses: (bidType.statuses || []).map(status => ({
                ...status,
                color: status.color || (status.position === 1 ? '#c75a5a' : status.position === 999 ? '#7a7777' : '#ffffff')
            })),
            transitions: bidType.transitions || [],
            plannedReactionTimeMinutes: bidType.plannedReactionTimeMinutes ? bidType.plannedReactionTimeMinutes.toString() : '',
            plannedDurationMinutes: bidType.plannedDurationMinutes ? bidType.plannedDurationMinutes.toString() : '',
        });
        setShowBidTypeForm(true);
        setShowBidStatusFormInEdit(false);
        setEditingBidStatusInEdit(null);
        setBidStatusFormDataInEdit({ name: '', position: '', allowedActions: [] });
        setEditingStatusPosition(null);
    };

    const handleDeleteBidType = async (id) => {
        if (window.confirm('Вы уверены, что хотите удалить этот тип заявки?')) {
            try {
                await deleteBidType(id);
                setNotification({ type: 'success', message: 'Тип заявки удален успешно' });
                fetchBidTypes();
            } catch (error) {
                console.error('Error deleting bid type:', error);
                setNotification({ type: 'error', message: 'Ошибка при удалении типа заявки' });
            }
        }
    };


    const handleBidStatusSubmitInEdit = (e) => {
        e.preventDefault();
        const statuses = [...bidTypeFormData.statuses];
        if (editingBidStatusInEdit) {
            const index = statuses.findIndex(s => s.position === editingBidStatusInEdit.position);
            if (index !== -1) {
                statuses[index] = { ...bidStatusFormDataInEdit, position: parseInt(bidStatusFormDataInEdit.position) };
            }
        } else {
            statuses.push({ ...bidStatusFormDataInEdit, position: parseInt(bidStatusFormDataInEdit.position) });
        }
        setBidTypeFormData({ ...bidTypeFormData, statuses });
        setBidStatusFormDataInEdit({ name: '', position: '', allowedActions: [] });
        setEditingBidStatusInEdit(null);
        setShowBidStatusFormInEdit(false);
    };

    const handleEditBidStatusInEdit = (bidStatus) => {
        setEditingBidStatusInEdit(bidStatus);
        setBidStatusFormDataInEdit({
            name: bidStatus.name,
            position: bidStatus.position.toString(),
            allowedActions: bidStatus.allowedActions || [],
        });
        setShowBidStatusFormInEdit(true);
    };

    const handleDeleteBidStatusInEdit = (status) => {
        const statuses = bidTypeFormData.statuses.filter(s => s.position !== status.position);
        setBidTypeFormData({ ...bidTypeFormData, statuses });
    };

    const handleCreateTransitionInEdit = (fromPosition, toPosition) => {
        const transitions = [...bidTypeFormData.transitions];
        if (!transitions.some(t => t.fromPosition === fromPosition && t.toPosition === toPosition)) {
            transitions.push({ fromPosition, toPosition });
            setBidTypeFormData({ ...bidTypeFormData, transitions });
        }
    };

    const handleDeleteTransitionInEdit = (fromPosition, toPosition) => {
        const transitions = bidTypeFormData.transitions.filter(t => !(t.fromPosition === fromPosition && t.toPosition === toPosition));
        setBidTypeFormData({ ...bidTypeFormData, transitions });
    };

    const handleStatusNameChange = (position, newName) => {
        const statuses = bidTypeFormData.statuses.map(s => s.position === position ? { ...s, name: newName } : s);
        setBidTypeFormData({ ...bidTypeFormData, statuses });
    };

    const toggleCategoryExpansion = (categoryId) => {
        setExpandedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(categoryId)) {
                newSet.delete(categoryId);
            } else {
                newSet.add(categoryId);
            }
            return newSet;
        });
    };

    const toggleSpecCategoryExpansion = (categoryId) => {
        setExpandedSpecCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(categoryId)) {
                newSet.delete(categoryId);
            } else {
                newSet.add(categoryId);
            }
            return newSet;
        });
    };

    const handleFileUpload = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            // Process the data - map Excel columns to client fields
            const clients = jsonData.map(row => ({
                name: row['Название'] || row['Name'] || '',
                inn: row['ИНН'] || row['INN'] || '',
                email: row['Электронная почта'] || row['Email'] || '',
                phone: row['Телефон'] || row['Phone'] || '',
                createdAt: row['Дата создания'] || row['Created Date'] || new Date().toISOString(),
                responsibleId: row['Пользователь'] || row['User'] || user?.id
            }));

            // Send the data to the backend API
            try {
                const response = await bulkUploadClients({ clients });
                setNotification({
                    type: 'success',
                    message: `Успешно загружено ${response.data.created} клиентов${response.data.errors > 0 ? `, ошибок: ${response.data.errors}` : ''}`
                });
                setShowClientUploadModal(false);
            } catch (error) {
                console.error('Bulk upload error:', error);
                setNotification({ type: 'error', message: 'Ошибка при загрузке клиентов' });
            }

        } catch (error) {
            console.error('Error processing file:', error);
            setNotification({ type: 'error', message: 'Ошибка при обработке файла' });
        }
    };

    const handleExportClients = async () => {
        try {
            // Fetch all clients without filters
            const response = await getClients();
            const clients = response.data;

            // Prepare data for Excel export
            const exportData = clients.map(client => ({
                'Название': client.name || '',
                'ИНН': client.inn || '',
                'Электронная почта': client.email || '',
                'Телефон': client.phone || '',
                'Дата создания': client.createdAt ? new Date(client.createdAt).toLocaleDateString('ru-RU') : '',
                'Пользователь': client.responsible ? (client.responsible.fullName || client.responsible.username) : 'Не назначен',
                'Количество заявок': client._count?.bids || 0,
                'Количество объектов': client._count?.clientObjects || 0
            }));

            // Create workbook and worksheet
            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Клиенты');

            // Generate filename with current date
            const currentDate = new Date().toISOString().split('T')[0];
            const filename = `клиенты_${currentDate}.xlsx`;

            // Save file
            XLSX.writeFile(workbook, filename);

            setNotification({
                type: 'success',
                message: `Экспорт завершен. Скачано ${clients.length} клиентов.`
            });
        } catch (error) {
            console.error('Export error:', error);
            setNotification({ type: 'error', message: 'Ошибка при экспорте клиентов' });
        }
    };

    const handleExportBids = async () => {
        try {
            // Fetch all bids
            const response = await getBids();
            const bids = response.data;

            // Prepare data for Excel export
            const exportData = bids.map(bid => ({
                'ID': bid.id || '',
                'Клиент': bid.client?.name || '',
                'Тип заявки': bid.bidType?.name || '',
                'Тема': bid.tema || '',
                'Сумма': bid.amount || '',
                'Статус': bid.status || '',
                'Описание': bid.description || '',
                'Объект обслуживания': bid.clientObject ? `${bid.clientObject.brandModel} ${bid.clientObject.stateNumber}` : '',
                'Адрес работы': bid.workAddress || '',
                'Контактное лицо': bid.contactFullName || '',
                'Контактный телефон': bid.contactPhone || '',
                'Дата создания': bid.createdAt ? new Date(bid.createdAt).toLocaleDateString('ru-RU') : '',
                'Создал': bid.createdByUser?.fullName || '',
            }));

            // Create workbook and worksheet
            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Заявки');

            // Generate filename with current date
            const currentDate = new Date().toISOString().split('T')[0];
            const filename = `заявки_${currentDate}.xlsx`;

            // Save file
            XLSX.writeFile(workbook, filename);

            setNotification({
                type: 'success',
                message: `Экспорт завершен. Скачано ${bids.length} заявок.`
            });
        } catch (error) {
            console.error('Export error:', error);
            setNotification({ type: 'error', message: 'Ошибка при экспорте заявок' });
        }
    };

    const handleExportClientObjects = async () => {
        try {
            // Fetch all client objects
            const response = await getClientObjects();
            const clientObjects = response.data;

            // Prepare data for Excel export
            const exportData = clientObjects.map(obj => ({
                'ID': obj.id || '',
                'Клиент': obj.client?.name || '',
                'Марка/Модель': obj.brandModel || '',
                'Государственный номер': obj.stateNumber || '',
                'Оборудование': obj.equipment || '',
                'Дата создания': obj.createdAt ? new Date(obj.createdAt).toLocaleDateString('ru-RU') : '',
            }));

            // Create workbook and worksheet
            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Объекты');

            // Generate filename with current date
            const currentDate = new Date().toISOString().split('T')[0];
            const filename = `объекты_${currentDate}.xlsx`;

            // Save file
            XLSX.writeFile(workbook, filename);

            setNotification({
                type: 'success',
                message: `Экспорт завершен. Скачано ${clientObjects.length} объектов.`
            });
        } catch (error) {
            console.error('Export error:', error);
            setNotification({ type: 'error', message: 'Ошибка при экспорте объектов' });
        }
    };

    const handleClientObjectFileUpload = () => {
        clientObjectFileInputRef.current?.click();
    };

    const handleClientObjectFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            // Process the data - map Excel columns to client object fields
            const clientObjects = jsonData.map(row => ({
                clientId: row['Клиент'] || row['Client'] || '',
                brandModel: row['Марка/Модель'] || row['Brand/Model'] || '',
                stateNumber: row['Государственный номер'] || row['State Number'] || '',
                equipment: row['Оборудование'] || row['Equipment'] || '',
                createdAt: row['Дата создания'] || row['Created Date'] || new Date().toISOString(),
            }));

            // Send the data to the backend API
            try {
                const response = await bulkUploadClientObjects({ clientObjects });
                setNotification({
                    type: 'success',
                    message: `Успешно загружено ${response.data.created} объектов${response.data.errors > 0 ? `, ошибок: ${response.data.errors}` : ''}`
                });
                setShowClientObjectUploadModal(false);
            } catch (error) {
                console.error('Bulk upload error:', error);
                setNotification({ type: 'error', message: 'Ошибка при загрузке объектов' });
            }

        } catch (error) {
            console.error('Error processing file:', error);
            setNotification({ type: 'error', message: 'Ошибка при обработке файла' });
        }
    };

    const handleBidImportClick = () => {
        setNotification({
            type: 'info',
            message: 'В разработке'
        });
    };

    const buildSpecificationsTree = (categories, specifications, level = 0) => {
        return categories.map(category => {
            const categorySpecs = specifications.filter(spec => spec.categoryId === category.id);
            const children = category.children ? buildSpecificationsTree(category.children, specifications, level + 1) : [];
            return {
                ...category,
                specifications: categorySpecs,
                children,
                level
            };
        });
    };

    const buildCategoryOptions = (categories, level = 0, excludeId = null) => {
        const options = [];
        categories.forEach(category => {
            if (category.id === excludeId) return;
            options.push({
                id: category.id,
                name: `${'  '.repeat(level)}${category.name}`,
                level
            });
            if (category.children) {
                options.push(...buildCategoryOptions(category.children, level + 1, excludeId));
            }
        });
        return options;
    };

    const CategoryTreeItem = ({ category, level = 0 }) => {
        const hasChildren = category.children && category.children.length > 0;
        const isExpanded = expandedCategories.has(category.id);

        return (
            <div>
                <div
                    className={`flex items-center py-2 px-4 hover:bg-gray-50 cursor-pointer ${level > 0 ? 'ml-6' : ''}`}
                    style={{ paddingLeft: `${16 + level * 24}px` }}
                >
                    {hasChildren && (
                        <button
                            onClick={() => toggleCategoryExpansion(category.id)}
                            className="mr-2 text-gray-500 hover:text-gray-700"
                        >
                            {isExpanded ? '▼' : '▶'}
                        </button>
                    )}
                    {!hasChildren && <span className="mr-2 w-4"></span>}
                    <div className="flex-1">
                        <span className="font-medium">{category.name}</span>
                        {category.description && (
                            <span className="text-gray-500 ml-2">({category.description})</span>
                        )}
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => handleEditSpecificationCategory(category)}
                            className="text-blue-600 hover:text-blue-900 text-sm"
                        >
                            Редактировать
                        </button>
                        <button
                            onClick={() => handleDeleteSpecificationCategory(category.id)}
                            className="text-red-600 hover:text-red-900 text-sm"
                        >
                            Удалить
                        </button>
                    </div>
                </div>
                {hasChildren && isExpanded && (
                    <div>
                        {category.children.map(child => (
                            <CategoryTreeItem key={child.id} category={child} level={level + 1} />
                        ))}
                    </div>
                )}
    

            </div>
        );
    };

    const SpecificationTreeItem = ({ category }) => {
        const hasChildren = category.children && category.children.length > 0;
        const hasSpecs = category.specifications && category.specifications.length > 0;
        const isExpanded = expandedSpecCategories.has(category.id);

        return (
            <div>
                <div
                    className="flex items-center py-2 px-4 hover:bg-gray-50 cursor-pointer"
                    style={{ paddingLeft: `${16 + category.level * 24}px` }}
                >
                    {(hasChildren || hasSpecs) && (
                        <button
                            onClick={() => toggleSpecCategoryExpansion(category.id)}
                            className="mr-2 text-gray-500 hover:text-gray-700 transition-transform transform"
                        >
                            {isExpanded ? '▼' : '▶'}
                        </button>
                    )}
                    {!(hasChildren || hasSpecs) && <span className="mr-2 w-4"></span>}
                    <div className="flex items-center flex-1">
                        <span className="text-lg mr-2">📁</span>
                        <div>
                            <span className="font-semibold text-gray-800">{category.name}</span>
                            {category.description && (
                                <span className="text-gray-500 ml-2 text-sm">({category.description})</span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center space-x-1">
                        <button
                            onClick={() => {
                                setShowSpecificationForm(true);
                                setShowSpecificationCategoryForm(false);
                                setEditingSpecification(null);
                                setSpecificationFormData({ categoryId: category.id, name: '', discount: '', cost: '' });
                            }}
                            className="p-1.5 text-green-600 hover:bg-green-100 rounded transition"
                            title="Добавить спецификацию"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </button>
                        <button
                            onClick={() => {
                                setShowSpecificationCategoryForm(true);
                                setShowSpecificationForm(false);
                                setEditingSpecificationCategory(null);
                                setSpecificationCategoryFormData({ name: '', description: '', parentId: category.id });
                            }}
                            className="p-1.5 text-yellow-600 hover:bg-yellow-100 rounded transition"
                            title="Добавить вложенную папку"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
                        </button>
                        <button
                            onClick={() => handleEditSpecificationCategory(category)}
                            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition"
                            title="Редактировать папку"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button
                            onClick={() => handleDeleteSpecificationCategory(category.id)}
                            className="p-1.5 text-red-600 hover:bg-red-100 rounded transition"
                            title="Удалить папку"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                </div>
                {isExpanded && (
                    <div>
                        {category.specifications.map((spec) => (
                            <div
                                key={spec.id}
                                className="flex items-center py-2 px-4 hover:bg-blue-50 border-l-2 border-transparent hover:border-blue-300 transition-colors"
                                style={{ paddingLeft: `${40 + category.level * 24}px` }}
                            >
                                <span className="text-gray-400 mr-2">📄</span>
                                <div className="flex-1 grid grid-cols-3 gap-4">
                                    <span className="font-medium text-gray-700">{spec.name}</span>
                                    <span className="text-orange-600 font-medium">{spec.discount}%</span>
                                    <span className="text-green-600 font-bold">{spec.cost} ₽</span>
                                </div>
                                <div className="flex space-x-1">
                                    <button
                                        onClick={() => handleEditSpecification(spec)}
                                        className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    </button>
                                    <button
                                        onClick={() => handleDeleteSpecification(spec.id)}
                                        className="p-1.5 text-red-600 hover:bg-red-100 rounded transition"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                        {category.children.map(child => (
                            <SpecificationTreeItem key={child.id} category={child} />
                        ))}
                    </div>
                )}
    
    
            </div>
        );
    };
    return (
        <div className="p-8 relative">
            {/* Toast Notification */}
            {notification && (
                <div className="fixed top-4 right-4 z-50 transition-all duration-300 ease-in-out opacity-100">
                    <div className={`max-w-sm p-4 rounded-lg shadow-lg ${
                        notification.type === 'success'
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                        <div className="flex items-center justify-between">
                            <span>{notification.message}</span>
                            <button
                                onClick={() => setNotification(null)}
                                className="ml-4 text-gray-500 hover:text-gray-700 focus:outline-none text-xl font-bold"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {activeSettingsTab === 'user' && (
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Управление пользователями</h2>
                        {hasPermission('settings_user_button') && hasPermission('user_create') && (
                            <button
                                onClick={() => {
                                    setShowForm(!showForm);
                                    setEditingUser(null);
                                    setFormData({ username: '', fullName: '', email: '', password: '', role: '' });
                                }}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                            >
                                {showForm ? 'Отмена' : '+ Добавить пользователя'}
                            </button>
                        )}
                    </div>

                    {!showForm && (
                        <>
                            <div className="bg-white rounded-lg shadow p-6 mb-6">
                                <h3 className="text-lg font-semibold mb-4">Текущий пользователь</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Имя пользователя</label>
                                        <p className="text-gray-900">{user?.username || 'Не указано'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <p className="text-gray-900">{user?.email || 'Не указано'}</p>
                                    </div>
                                </div>

                                {showBidStatusFormInEdit && (
                                    <div className="mt-4 bg-white rounded-lg shadow p-4">
                                        <h5 className="text-md font-semibold mb-4">
                                            {editingBidStatusInEdit ? 'Редактировать статус' : 'Добавить новый статус'}
                                        </h5>
                                        <form onSubmit={handleBidStatusSubmitInEdit} className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                                                    <input
                                                        type="text"
                                                        value={bidStatusFormDataInEdit.name}
                                                        onChange={(e) => setBidStatusFormDataInEdit({ ...bidStatusFormDataInEdit, name: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Позиция</label>
                                                    <input
                                                        type="number"
                                                        value={bidStatusFormDataInEdit.position}
                                                        onChange={(e) => setBidStatusFormDataInEdit({ ...bidStatusFormDataInEdit, position: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        min="1"
                                                        max="999"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Разрешенные действия</label>
                                                <input
                                                    type="text"
                                                    value={bidStatusFormDataInEdit.allowedActions.join(', ')}
                                                    onChange={(e) => setBidStatusFormDataInEdit({ ...bidStatusFormDataInEdit, allowedActions: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Действие1, Действие2"
                                                />
                                            </div>
                                            <div className="flex gap-2 pt-4">
                                                <button
                                                    type="submit"
                                                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition"
                                                >
                                                    {editingBidStatusInEdit ? 'Обновить' : 'Создать'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowBidStatusFormInEdit(false)}
                                                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition"
                                                >
                                                    Отмена
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}
                            </div>

                            {hasPermission('user_edit') && (
                                <div className="bg-white rounded-lg shadow overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200" style={{ tableLayout: 'fixed' }}>
                                    <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[120px]" style={{ resize: 'horizontal', overflow: 'auto' }}>Логин</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[120px]" style={{ resize: 'horizontal', overflow: 'auto' }}>ФИО</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[120px]" style={{ resize: 'horizontal', overflow: 'auto' }}>Почта</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[120px]" style={{ resize: 'horizontal', overflow: 'auto' }}>Роль</th>
                                        {hasPermission('user_create') && (
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[120px]" style={{ resize: 'horizontal', overflow: 'auto' }}>Действия</th>
                                        )}
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                    {users.map((u) => (
                                        <tr key={u.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">{u.username}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{u.fullName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{u.email}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {u.role === 'Админ' ? 'Администратор' :
                                                 u.role === 'Склад' ? 'Сотрудник склада' :
                                                 u.role === 'Менеджер' ? 'Менеджер' :
                                                 u.role === 'Технический специалист' ? 'Технический специалист' :
                                                 u.role === 'Бухгалтер' ? 'Бухгалтер' :
                                                 u.role === 'Монтажник' ? 'Монтажник' :
                                                 u.role === 'Пользователь' ? 'Пользователь' :
                                                 u.role}
                                            </td>
                                            {hasPermission('user_create') && (
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <button
                                                        onClick={() => handleEditUser(u)}
                                                        className="text-blue-600 hover:text-blue-900 mr-3"
                                                    >
                                                        Редактировать
                                                    </button>
                                                    {u.role !== 'Админ' && (
                                                        <button
                                                            onClick={() => handleDeleteUser(u.id)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            Удалить
                                                        </button>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                            )}
                        </>
                    )}

                    {showForm && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold mb-4">
                                {editingUser ? 'Редактировать пользователя' : 'Добавить нового пользователя'}
                            </h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Логин</label>
                                    <input
                                        type="text"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ФИО</label>
                                    <input
                                        type="text"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Почта</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Пароль {editingUser && <span className="text-gray-500">(оставьте пустым, чтобы не менять)</span>}
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required={!editingUser}
                                        placeholder={editingUser ? "Оставьте пустым, чтобы сохранить текущий пароль" : ""}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Роль</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required={!editingUser}
                                    >
                                        <option value="">Выберите роль</option>
                                        {roles.filter(role => role.name !== 'Пользователь').map((role) => (
                                            <option key={role.id} value={role.name}>
                                                {role.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex gap-2 pt-4">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition"
                                    >
                                        {editingUser ? 'Обновить' : 'Создать'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition"
                                    >
                                        Отмена
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            )}

            {activeSettingsTab === 'roles' && (
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Управление ролями</h2>
                        {hasPermission('settings_role_button') && hasPermission('role_create') && (
                            <button
                                onClick={() => {
                                    setShowRoleForm(!showRoleForm);
                                    setEditingRole(null);
                                    setRoleFormData({
                                        name: '',
                                        description: '',
                                        permissions: {
                                            // Права пользователей
                                            user_create: false,
                                            user_edit: false,
                                            user_delete: false,

                                            // Права ролей
                                            role_create: false,
                                            role_edit: false,
                                            role_delete: false,

                                            // Права категорий спецификаций
                                            spec_category_create: false,
                                            spec_category_edit: false,
                                            spec_category_delete: false,

                                            // Права спецификаций
                                            spec_create: false,
                                            spec_edit: false,
                                            spec_delete: false,

                                            // Права типов заявок
                                            bid_type_create: false,
                                            bid_type_edit: false,
                                            bid_type_delete: false,

                                            // Права клиентов
                                            client_create: false,
                                            client_edit: false,
                                            client_delete: false,

                                            // Права объектов обслуживания
                                            client_object_create: false,
                                            client_object_edit: false,
                                            client_object_delete: false,

                                            // Права заявок
                                            bid_create: false,
                                            bid_edit: false,
                                            bid_delete: false,

                                            // Права оборудования в заявках
                                            bid_equipment_add: false,

                                            // Права оборудования
                                            equipment_create: false,
                                            equipment_edit: false,
                                            equipment_delete: false,

                                            // Права вкладок
                                            tab_warehouse: false,
                                            tab_salary: false,

                                            // Права видимости кнопок в настройках
                                            settings_user_button: false,
                                            settings_role_button: false,
                                            settings_client_attributes_button: false,
                                            settings_bid_attributes_button: false,
                                            settings_spec_category_button: false,
                                            settings_spec_button: false,
                                            settings_bid_type_button: false,
                                            settings_administration_button: false,

                                            // Права бэкапов
                                            backup_create: false,
                                            backup_list: false,
                                            backup_download: false,
                                            backup_restore: false,
                                            backup_delete: false,
                                        }
                                    });
                                }}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                            >
                                {showRoleForm ? 'Отмена' : '+ Добавить роль'}
                            </button>
                        )}
                    </div>

                    {!showRoleForm && (
                        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Название</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Описание</th>
                                    {hasPermission('user_create') && (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
                                    )}
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {roles.map((role) => (
                                    <tr key={role.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">{role.name}</td>
                                        <td className="px-6 py-4">{role.description}</td>
                                        {hasPermission('user_create') && (
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => handleEditRole(role)}
                                                    className="text-blue-600 hover:text-blue-900 mr-3"
                                                >
                                                    Редактировать
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRole(role.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Удалить
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {showRoleForm && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold mb-4">
                                {editingRole ? 'Редактировать роль' : 'Добавить новую роль'}
                            </h3>
                            <form onSubmit={handleRoleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                                    <input
                                        type="text"
                                        value={roleFormData.name}
                                        onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                                    <textarea
                                        value={roleFormData.description}
                                        onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows="3"
                                        required
                                    />
                                </div>

                                <div className="mt-6">
                                    <h4 className="text-lg font-semibold mb-4">Права доступа</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                        {/* Права пользователей */}
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h5 className="font-medium mb-3 text-gray-800">Пользователи</h5>
                                            <div className="space-y-2">
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={roleFormData.permissions.user_create}
                                                        onChange={(e) => handlePermissionChange('user_create', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    Создание пользователей
                                                </label>
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={roleFormData.permissions.user_edit}
                                                        onChange={(e) => handlePermissionChange('user_edit', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    Редактирование пользователей
                                                </label>
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={roleFormData.permissions.user_delete}
                                                        onChange={(e) => handlePermissionChange('user_delete', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    Удаление пользователей
                                                </label>
                                            </div>
                                        </div>

                                        {/* Права ролей */}
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h5 className="font-medium mb-3 text-gray-800">Роли</h5>
                                            <div className="space-y-2">
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={roleFormData.permissions.role_create}
                                                        onChange={(e) => handlePermissionChange('role_create', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    Создание ролей
                                                </label>
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={roleFormData.permissions.role_edit}
                                                        onChange={(e) => handlePermissionChange('role_edit', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    Редактирование ролей
                                                </label>
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={roleFormData.permissions.role_delete}
                                                        onChange={(e) => handlePermissionChange('role_delete', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    Удаление ролей
                                                </label>
                                            </div>
                                        </div>

                                        {/* Права клиентов */}
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h5 className="font-medium mb-3 text-gray-800">Клиенты</h5>
                                            <div className="space-y-2">
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={roleFormData.permissions.client_create}
                                                        onChange={(e) => handlePermissionChange('client_create', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    Создание клиентов
                                                </label>
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={roleFormData.permissions.client_edit}
                                                        onChange={(e) => handlePermissionChange('client_edit', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    Редактирование клиентов
                                                </label>
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={roleFormData.permissions.client_delete}
                                                        onChange={(e) => handlePermissionChange('client_delete', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    Удаление клиентов
                                                </label>
                                            </div>
                                        </div>

                                        {/* Права объектов обслуживания */}
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h5 className="font-medium mb-3 text-gray-800">Объекты обслуживания</h5>
                                            <div className="space-y-2">
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={roleFormData.permissions.client_object_create}
                                                        onChange={(e) => handlePermissionChange('client_object_create', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    Создание объектов обслуживания
                                                </label>
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={roleFormData.permissions.client_object_edit}
                                                        onChange={(e) => handlePermissionChange('client_object_edit', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    Редактирование объектов обслуживания
                                                </label>
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={roleFormData.permissions.client_object_delete}
                                                        onChange={(e) => handlePermissionChange('client_object_delete', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    Удаление объектов обслуживания
                                                </label>
                                            </div>
                                        </div>

                                        {/* Права категорий спецификаций */}
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h5 className="font-medium mb-3 text-gray-800">Категории спецификаций</h5>
                                            <div className="space-y-2">
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={roleFormData.permissions.spec_category_create}
                                                        onChange={(e) => handlePermissionChange('spec_category_create', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    Создание категорий
                                                </label>
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={roleFormData.permissions.spec_category_edit}
                                                        onChange={(e) => handlePermissionChange('spec_category_edit', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    Редактирование категорий
                                                </label>
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={roleFormData.permissions.spec_category_delete}
                                                        onChange={(e) => handlePermissionChange('spec_category_delete', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    Удаление категорий
                                                </label>
                                            </div>
                                        </div>

                                        {/* Права спецификаций */}
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h5 className="font-medium mb-3 text-gray-800">Спецификации</h5>
                                            <div className="space-y-2">
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={roleFormData.permissions.spec_create}
                                                        onChange={(e) => handlePermissionChange('spec_create', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    Создание спецификаций
                                                </label>
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={roleFormData.permissions.spec_edit}
                                                        onChange={(e) => handlePermissionChange('spec_edit', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    Редактирование спецификаций
                                                </label>
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={roleFormData.permissions.spec_delete}
                                                        onChange={(e) => handlePermissionChange('spec_delete', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    Удаление спецификаций
                                                </label>
                                            </div>
                                        </div>

                                        {/* Права типов заявок */}
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h5 className="font-medium mb-3 text-gray-800">Типы заявок</h5>
                                            <div className="space-y-2">
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={roleFormData.permissions.bid_type_create}
                                                        onChange={(e) => handlePermissionChange('bid_type_create', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    Создание типов заявок
                                                </label>
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={roleFormData.permissions.bid_type_edit}
                                                        onChange={(e) => handlePermissionChange('bid_type_edit', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    Редактирование типов заявок
                                                </label>
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={roleFormData.permissions.bid_type_delete}
                                                        onChange={(e) => handlePermissionChange('bid_type_delete', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    Удаление типов заявок
                                                </label>
                                            </div>
                                        </div>

                                        {/* Права заявок */}
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h5 className="font-medium mb-3 text-gray-800">Заявки</h5>
                                            <div className="space-y-2">
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={roleFormData.permissions.bid_create}
                                                        onChange={(e) => handlePermissionChange('bid_create', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    Создание заявок
                                                </label>
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={roleFormData.permissions.bid_edit}
                                                        onChange={(e) => handlePermissionChange('bid_edit', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    Редактирование заявок
                                                </label>
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={roleFormData.permissions.bid_delete}
                                                        onChange={(e) => handlePermissionChange('bid_delete', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    Удаление заявок
                                                </label>
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={roleFormData.permissions.bid_equipment_add}
                                                        onChange={(e) => handlePermissionChange('bid_equipment_add', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    Добавление оборудования в заявку
                                                </label>
                                            </div>
                                        </div>

                                        {/* Права оборудования */}
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h5 className="font-medium mb-3 text-gray-800">Оборудование</h5>
                                            <div className="space-y-2">
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={roleFormData.permissions.equipment_create}
                                                        onChange={(e) => handlePermissionChange('equipment_create', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    Создание оборудования
                                                </label>
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={roleFormData.permissions.equipment_edit}
                                                        onChange={(e) => handlePermissionChange('equipment_edit', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    Редактирование оборудования
                                                </label>
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={roleFormData.permissions.equipment_delete}
                                                        onChange={(e) => handlePermissionChange('equipment_delete', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    Удаление оборудования
                                                </label>
                                            </div>
                                        </div>

                                        {/* Права вкладок */}
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h5 className="font-medium mb-3 text-gray-800">Вкладки интерфейса</h5>
                                            <div className="space-y-2">
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={roleFormData.permissions.tab_warehouse}
                                                        onChange={(e) => handlePermissionChange('tab_warehouse', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    Доступ к вкладке "Склад"
                                                </label>
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={roleFormData.permissions.tab_salary}
                                                        onChange={(e) => handlePermissionChange('tab_salary', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    Доступ к вкладке "З/П"
                                                </label>
                                            </div>
                                        </div>

                                        {/* Права видимости кнопок в настройках */}
                                        <div className="bg-blue-50 p-4 rounded-lg">
                                            <h5 className="font-medium mb-3 text-blue-800">Настройки</h5>
                                            <div className="space-y-2">
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={roleFormData.permissions.settings_user_button}
                                                        onChange={(e) => handlePermissionChange('settings_user_button', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    Видеть кнопку "Пользователь"
                                                </label>
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={roleFormData.permissions.settings_role_button}
                                                        onChange={(e) => handlePermissionChange('settings_role_button', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    Видеть кнопку "Роли"
                                                </label>
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={roleFormData.permissions.settings_client_attributes_button}
                                                        onChange={(e) => handlePermissionChange('settings_client_attributes_button', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    Видеть кнопку "Атрибуты"
                                                </label>
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={roleFormData.permissions.settings_bid_attributes_button}
                                                        onChange={(e) => handlePermissionChange('settings_bid_attributes_button', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    Видеть кнопку "Атрибуты заявок"
                                                </label>
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={roleFormData.permissions.settings_spec_category_button}
                                                        onChange={(e) => handlePermissionChange('settings_spec_category_button', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    Видеть кнопку "Категория спецификаций"
                                                </label>
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={roleFormData.permissions.settings_spec_button}
                                                        onChange={(e) => handlePermissionChange('settings_spec_button', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    Видеть кнопку "Спецификации"
                                                </label>
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={roleFormData.permissions.settings_bid_type_button}
                                                        onChange={(e) => handlePermissionChange('settings_bid_type_button', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    Видеть кнопку "Тип Заявки"
                                                </label>
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={roleFormData.permissions.settings_administration_button}
                                                        onChange={(e) => handlePermissionChange('settings_administration_button', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    Видеть кнопку "Администрирование"
                                                </label>
                                            </div>
                                        </div>

                                        {/* Права бэкапов */}
                                        <div className="bg-green-50 p-4 rounded-lg">
                                            <h5 className="font-medium mb-3 text-green-800">Бэкапы</h5>
                                            <div className="space-y-2">
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={roleFormData.permissions.backup_create}
                                                        onChange={(e) => handlePermissionChange('backup_create', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    Создание бэкапов
                                                </label>
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={roleFormData.permissions.backup_list}
                                                        onChange={(e) => handlePermissionChange('backup_list', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    Просмотр списка бэкапов
                                                </label>
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={roleFormData.permissions.backup_download}
                                                        onChange={(e) => handlePermissionChange('backup_download', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    Скачивание бэкапов
                                                </label>
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={roleFormData.permissions.backup_restore}
                                                        onChange={(e) => handlePermissionChange('backup_restore', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    Восстановление из бэкапов
                                                </label>
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={roleFormData.permissions.backup_delete}
                                                        onChange={(e) => handlePermissionChange('backup_delete', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    Удаление бэкапов
                                                </label>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                                <div className="flex gap-2 pt-4">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition"
                                    >
                                        {editingRole ? 'Обновить' : 'Создать'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowRoleForm(false);
                                            setEditingRole(null);
                                            setRoleFormData({
                                                name: '',
                                                description: '',
                                                permissions: {
                                                    // Права пользователей
                                                    user_create: false,
                                                    user_edit: false,
                                                    user_delete: false,

                                                    // Права ролей
                                                    role_create: false,
                                                    role_edit: false,
                                                    role_delete: false,

                                                    // Права категорий спецификаций
                                                    spec_category_create: false,
                                                    spec_category_edit: false,
                                                    spec_category_delete: false,

                                                    // Права спецификаций
                                                    spec_create: false,
                                                    spec_edit: false,
                                                    spec_delete: false,

                                                    // Права типов заявок
                                                    bid_type_create: false,
                                                    bid_type_edit: false,
                                                    bid_type_delete: false,

                                                    // Права клиентов
                                                    client_create: false,
                                                    client_edit: false,
                                                    client_delete: false,

                                                    // Права объектов обслуживания
                                                    client_object_create: false,
                                                    client_object_edit: false,
                                                    client_object_delete: false,

                                                    // Права заявок
                                                    bid_create: false,
                                                    bid_edit: false,
                                                    bid_delete: false,

                                                    // Права оборудования в заявках
                                                    bid_equipment_add: false,

                                                    // Права оборудования
                                                    equipment_create: false,
                                                    equipment_edit: false,
                                                    equipment_delete: false,

                                                    // Права вкладок
                                                    tab_warehouse: false,
                                                    tab_salary: false,

                                                    // Права видимости кнопок в настройках
                                                    settings_user_button: false,
                                                    settings_role_button: false,
                                                    settings_spec_category_button: false,
                                                    settings_spec_button: false,
                                                    settings_bid_type_button: false,
                                                }
                                            });
                                        }}
                                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition"
                                    >
                                        Отмена
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            )}

            {activeSettingsTab === 'bid-types' && (
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Управление типами заявок</h2>
                        {hasPermission('settings_bid_type_button') && (
                            <button
                                onClick={() => {
                                    setShowBidTypeForm(!showBidTypeForm);
                                    setEditingBidType(null);
                                    setBidTypeFormData({
                                        name: '', 
                                        description: '', 
                                        statuses: [
                                            { name: 'Открыта', position: 1, allowedActions: ['edit', 'assign_executor'], color: '#dcfce7' },
                                            { name: 'Закрыта', position: 999, allowedActions: [], color: '#f3f4f6' }
                                        ], 
                                        transitions: [
                                            { fromPosition: 1, toPosition: 999 }
                                        ]
                                    });
                                }}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                            >
                                {showBidTypeForm ? 'Отмена' : '+ Добавить тип заявки'}
                            </button>
                        )}
                    </div>

                    {!showBidTypeForm && (
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Название</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Описание</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {bidTypes.map((bidType) => (
                                    <tr key={bidType.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">{bidType.name}</td>
                                        <td className="px-6 py-4">{bidType.description}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => handleEditBidType(bidType)}
                                                className="text-blue-600 hover:text-blue-900 mr-3"
                                            >
                                                Редактировать
                                            </button>
                                            <button
                                                onClick={() => handleDeleteBidType(bidType.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Удалить
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}


                    {showBidTypeForm && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold mb-4">
                                {editingBidType ? 'Редактировать тип заявки' : 'Добавить новый тип заявки'}
                            </h3>
                            <form onSubmit={handleBidTypeSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                                    <input
                                        type="text"
                                        value={bidTypeFormData.name}
                                        onChange={(e) => setBidTypeFormData({ ...bidTypeFormData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                                    <textarea
                                        value={bidTypeFormData.description}
                                        onChange={(e) => setBidTypeFormData({ ...bidTypeFormData, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows="3"
                                    />
                                </div>
                                
                                {/* SLA настройки */}
                                <div className="border-t pt-4 mt-4">
                                    <h4 className="text-md font-semibold mb-3">Параметры SLA</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Плановое время реакции (минуты)</label>
                                            <input
                                                type="number"
                                                value={bidTypeFormData.plannedReactionTimeMinutes}
                                                onChange={(e) => setBidTypeFormData({ ...bidTypeFormData, plannedReactionTimeMinutes: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Например: 60"
                                                min="0"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Время на первичную реакцию по заявке</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Плановая продолжительность (минуты)</label>
                                            <input
                                                type="number"
                                                value={bidTypeFormData.plannedDurationMinutes}
                                                onChange={(e) => setBidTypeFormData({ ...bidTypeFormData, plannedDurationMinutes: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Например: 8"
                                                min="0"
                                                step="0.5"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Плановое время выполнения заявки (в минутах)</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-lg font-semibold">Управление статусами</h4>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (showBidStatusFormInEdit) {
                                                    // cancel
                                                    setShowBidStatusFormInEdit(false);
                                                    setEditingBidStatusInEdit(null);
                                                    setBidStatusFormDataInEdit({ name: '', position: '', allowedActions: [] });
                                                } else {
                                                    // add
                                                    const nextPos = calculateNextPosition(bidTypeFormData.statuses);
                                                    if (nextPos === null) {
                                                        alert('Нет доступной позиции для нового статуса');
                                                        return;
                                                    }
                                                    const newStatus = { name: 'Новый статус', position: nextPos, allowedActions: [], responsibleUserId: null, responsibleRoleId: null, color: '#ffffff' };
                                                    setBidTypeFormData({ ...bidTypeFormData, statuses: [...bidTypeFormData.statuses, newStatus] });
                                                }
                                            }}
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                                        >
                                            {showBidStatusFormInEdit ? 'Отмена' : '+ Добавить статус'}
                                        </button>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-100">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Название</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Позиция</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Цвет</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Роль</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Пользователь</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
                                            </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                            {(bidTypeFormData.statuses || []).sort((a, b) => a.position - b.position).map((status) => (
                                                <tr key={status.position} className="hover:bg-gray-50">
                                                    <td className="px-4 py-2 whitespace-nowrap">
                                                        {editingStatusPosition === status.position ? (
                                                            <input
                                                                type="text"
                                                                value={status.name}
                                                                onChange={(e) => handleStatusNameChange(status.position, e.target.value)}
                                                                onBlur={() => setEditingStatusPosition(null)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        setEditingStatusPosition(null);
                                                                    }
                                                                }}
                                                                className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                                autoFocus
                                                            />
                                                        ) : status.position === 1 || status.position === 999 ? (
                                                            <span className="px-1 py-1">
                                                                {status.name}
                                                            </span>
                                                        ) : (
                                                            <span
                                                                onClick={() => setEditingStatusPosition(status.position)}
                                                                className="cursor-pointer hover:underline px-1 py-1 rounded text-blue-600"
                                                            >
                                                                {status.name}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2 whitespace-nowrap">{status.position}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap">
                                                        <input
                                                            type="color"
                                                            value={status.color || '#ffffff'}
                                                            onChange={(e) => {
                                                                const newStatuses = bidTypeFormData.statuses.map(s => s.position === status.position ? { ...s, color: e.target.value } : s);
                                                                setBidTypeFormData({ ...bidTypeFormData, statuses: newStatuses });
                                                            }}
                                                            className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2 whitespace-nowrap">
                                                        <select
                                                            value={status.responsibleRoleId || ''}
                                                            onChange={(e) => {
                                                                const newStatuses = bidTypeFormData.statuses.map(s => s.position === status.position ? { ...s, responsibleRoleId: e.target.value || null } : s);
                                                                setBidTypeFormData({ ...bidTypeFormData, statuses: newStatuses });
                                                            }}
                                                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                        >
                                                            <option value="">Не выбрана</option>
                                                            {roles.map(role => (
                                                                <option key={role.id} value={role.id}>{role.name}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-2 whitespace-nowrap">
                                                        <select
                                                            value={status.responsibleUserId || ''}
                                                            onChange={(e) => {
                                                                const newStatuses = bidTypeFormData.statuses.map(s => s.position === status.position ? { ...s, responsibleUserId: e.target.value || null } : s);
                                                                setBidTypeFormData({ ...bidTypeFormData, statuses: newStatuses });
                                                            }}
                                                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                        >
                                                            <option value="">Не выбран</option>
                                                            {users.map(user => (
                                                                <option key={user.id} value={user.id}>{user.fullName}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-2 whitespace-nowrap">
                                                        {status.position !== 1 && status.position !== 999 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteBidStatusInEdit(status)}
                                                                className="text-red-600 hover:text-red-900 text-sm"
                                                            >
                                                                Удалить
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h5 className="text-md font-semibold mb-4">Переходы между статусами</h5>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {(bidTypeFormData.statuses || []).sort((a, b) => a.position - b.position).map((fromStatus) => (
                                                <div key={fromStatus.position} className="border rounded-lg p-4">
                                                    <h6 className="font-medium mb-2">Из: {fromStatus.name}</h6>
                                                    <div className="space-y-2">
                                                        {(bidTypeFormData.statuses || [])
                                                            .filter((toStatus) => toStatus.position !== fromStatus.position)
                                                            .sort((a, b) => a.position - b.position)
                                                            .map((toStatus) => {
                                                                const existingTransition = (bidTypeFormData.transitions || []).find(
                                                                    (t) => t.fromPosition === fromStatus.position && t.toPosition === toStatus.position
                                                                );
                                                                return (
                                                                    <div key={toStatus.position} className="flex items-center justify-between">
                                                                        <span>В: {toStatus.name}</span>
                                                                        {existingTransition ? (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleDeleteTransitionInEdit(fromStatus.position, toStatus.position)}
                                                                                className="text-red-600 hover:text-red-900 text-sm"
                                                                            >
                                                                                Удалить переход
                                                                            </button>
                                                                        ) : (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleCreateTransitionInEdit(fromStatus.position, toStatus.position)}
                                                                                className="text-green-600 hover:text-green-900 text-sm"
                                                                            >
                                                                                Добавить переход
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>


                                <div className="flex gap-2 pt-4">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition"
                                    >
                                        {editingBidType ? 'Обновить' : 'Создать'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowBidTypeForm(false);
                                            setShowBidStatusFormInEdit(false);
                                            setEditingBidStatusInEdit(null);
                                            setBidStatusFormDataInEdit({ name: '', position: '', allowedActions: [] });
                                            setEditingStatusPosition(null);
                                        }}
                                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition"
                                    >
                                        Отмена
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            )}

            {activeSettingsTab === 'specifications' && (
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Управление спецификациями</h2>
                        <div className="flex gap-2">
                            {hasPermission('settings_spec_button') && (
                                <button
                                    onClick={() => {
                                        setShowSpecificationForm(!showSpecificationForm);
                                        setShowSpecificationCategoryForm(false);
                                        setEditingSpecification(null);
                                        setSpecificationFormData({ categoryId: '', name: '', discount: '', cost: '' });
                                    }}
                                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    {showSpecificationForm ? 'Отмена' : '+ Новая спецификация'}
                                </button>
                            )}
                            {hasPermission('settings_spec_button') && (
                                <button
                                    onClick={() => {
                                        setShowSpecificationCategoryForm(!showSpecificationCategoryForm);
                                        setShowSpecificationForm(false);
                                        setEditingSpecificationCategory(null);
                                        setSpecificationCategoryFormData({ name: '', description: '', parentId: '' });
                                    }}
                                    className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
                                    {showSpecificationCategoryForm ? 'Отмена' : '+ Новая папка'}
                                </button>
                            )}
                        </div>
                    </div>

                    {showSpecificationCategoryForm && (
                        <div className="bg-white rounded-lg shadow p-6 mb-4">
                            <h3 className="text-lg font-semibold mb-4">
                                {editingSpecificationCategory ? 'Редактировать папку' : 'Добавить новую папку'}
                            </h3>
                            <form onSubmit={handleSpecificationCategorySubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Название папки</label>
                                    <input
                                        type="text"
                                        value={specificationCategoryFormData.name}
                                        onChange={(e) => setSpecificationCategoryFormData({ ...specificationCategoryFormData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Родительская папка</label>
                                    <select
                                        value={specificationCategoryFormData.parentId}
                                        onChange={(e) => setSpecificationCategoryFormData({ ...specificationCategoryFormData, parentId: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Нет родителя (корневая папка)</option>
                                        {allSpecificationCategories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex gap-2 pt-4">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition"
                                    >
                                        {editingSpecificationCategory ? 'Обновить' : 'Создать'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowSpecificationCategoryForm(false)}
                                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition"
                                    >
                                        Отмена
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {!showSpecificationForm && !showSpecificationCategoryForm && (
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="divide-y divide-gray-200">
                                {buildSpecificationsTree(specificationCategories, specifications).map((category) => (
                                    <SpecificationTreeItem key={category.id} category={category} />
                                ))}
                            </div>
                        </div>
                    )}

                    {showSpecificationForm && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold mb-4">
                                {editingSpecification ? 'Редактировать спецификацию' : 'Добавить новую спецификацию'}
                            </h3>
                            <form onSubmit={handleSpecificationSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
                                        <select
                                            value={specificationFormData.categoryId}
                                            onChange={(e) => setSpecificationFormData({ ...specificationFormData, categoryId: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            <option value="">Выберите категорию</option>
                                            {allSpecificationCategories.map((category) => (
                                                <option key={category.id} value={category.id}>
                                                    {category.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Наименование</label>
                                        <input
                                            type="text"
                                            value={specificationFormData.name}
                                            onChange={(e) => setSpecificationFormData({ ...specificationFormData, name: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Скидка (%)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={specificationFormData.discount}
                                            onChange={(e) => setSpecificationFormData({ ...specificationFormData, discount: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                            min="0"
                                            max="100"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Стоимость</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={specificationFormData.cost}
                                            onChange={(e) => setSpecificationFormData({ ...specificationFormData, cost: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                            min="0"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-4">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition"
                                    >
                                        {editingSpecification ? 'Обновить' : 'Создать'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowSpecificationForm(false)}
                                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition"
                                    >
                                        Отмена
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            )}
{activeSettingsTab === 'attributes' && (
    <div>
        <div className="mb-6">
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setActiveAttributeTab('client-attributes')}
                    className={`px-4 py-2 -mb-px border-b-2 font-medium text-sm ${
                        activeAttributeTab === 'client-attributes'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                    Атрибуты клиентов
                </button>
                <button
                    onClick={() => setActiveAttributeTab('bid-attributes')}
                    className={`px-4 py-2 -mb-px border-b-2 font-medium text-sm ${
                        activeAttributeTab === 'bid-attributes'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                    Атрибуты заявок
                </button>
            </div>
        </div>

        {activeAttributeTab === 'client-attributes' && (
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Атрибуты клиентов</h2>
                    <button
                        onClick={() => {
                            setClientAttributeFormData({ name: '', type: 'string', options: [], isEnabled: true });
                            setEditingClientAttribute(null);
                            setShowClientAttributeForm(true);
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                    >
                        + Добавить атрибут
                    </button>
                </div>
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Название</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Тип</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Включен</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {clientAttributes.map((attr) => (
                                <tr key={attr.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">{attr.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{attr.type}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{attr.isEnabled ? 'Да' : 'Нет'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => {
                                                setClientAttributeFormData({
                                                    name: attr.name,
                                                    type: attr.type,
                                                    options: attr.options || [],
                                                    isEnabled: attr.isEnabled,
                                                });
                                                setEditingClientAttribute(attr);
                                                setShowClientAttributeForm(true);
                                            }}
                                            className="text-blue-600 hover:text-blue-900 mr-2"
                                        >
                                            Редактировать
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClientAttribute(attr.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Удалить
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {showClientAttributeForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <h3 className="text-xl font-bold mb-4">
                                {editingClientAttribute ? 'Редактировать атрибут' : 'Добавить атрибут'}
                            </h3>
                            <form onSubmit={handleClientAttributeSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                                    <input
                                        type="text"
                                        value={clientAttributeFormData.name}
                                        onChange={(e) => setClientAttributeFormData({ ...clientAttributeFormData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Тип</label>
                                    <select
                                        value={clientAttributeFormData.type}
                                        onChange={(e) => setClientAttributeFormData({ ...clientAttributeFormData, type: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="string">Строка</option>
                                        <option value="number">Число</option>
                                        <option value="date">Дата</option>
                                        <option value="select">Выбор из списка</option>
                                        <option value="multiselect">Множественный выбор</option>
                                    </select>
                                </div>
                                {(clientAttributeFormData.type === 'select' || clientAttributeFormData.type === 'multiselect') && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Варианты (через запятую)</label>
                                        <input
                                            type="text"
                                            value={clientAttributeFormData.options ? clientAttributeFormData.options.join(', ') : ''}
                                            onChange={(e) => setClientAttributeFormData({ ...clientAttributeFormData, options: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Вариант 1, Вариант 2, Вариант 3"
                                        />
                                    </div>
                                )}
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={clientAttributeFormData.isEnabled}
                                        onChange={(e) => setClientAttributeFormData({ ...clientAttributeFormData, isEnabled: e.target.checked })}
                                        className="mr-2"
                                    />
                                    <span>Включен</span>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowClientAttributeForm(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        Отмена
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                    >
                                        Сохранить
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        )}

        {activeAttributeTab === 'bid-attributes' && (
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Атрибуты заявок</h2>
                    <button
                        onClick={() => {
                            setBidAttributeFormData({ name: '', type: 'string', options: [], isEnabled: true });
                            setEditingBidAttribute(null);
                            setShowBidAttributeForm(true);
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                    >
                        + Добавить атрибут
                    </button>
                </div>
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Название</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Тип</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Включен</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {bidAttributes.map((attr) => (
                                <tr key={attr.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">{attr.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{attr.type}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{attr.isEnabled ? 'Да' : 'Нет'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => {
                                                setBidAttributeFormData({
                                                    name: attr.name,
                                                    type: attr.type,
                                                    options: attr.options || [],
                                                    isEnabled: attr.isEnabled,
                                                });
                                                setEditingBidAttribute(attr);
                                                setShowBidAttributeForm(true);
                                            }}
                                            className="text-blue-600 hover:text-blue-900 mr-2"
                                        >
                                            Редактировать
                                        </button>
                                        <button
                                            onClick={() => handleDeleteBidAttribute(attr.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Удалить
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {showBidAttributeForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <h3 className="text-xl font-bold mb-4">
                                {editingBidAttribute ? 'Редактировать атрибут' : 'Добавить атрибут'}
                            </h3>
                            <form onSubmit={handleBidAttributeSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                                    <input
                                        type="text"
                                        value={bidAttributeFormData.name}
                                        onChange={(e) => setBidAttributeFormData({ ...bidAttributeFormData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Тип</label>
                                    <select
                                        value={bidAttributeFormData.type}
                                        onChange={(e) => setBidAttributeFormData({ ...bidAttributeFormData, type: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="string">Строка</option>
                                        <option value="number">Число</option>
                                        <option value="date">Дата</option>
                                        <option value="select">Выбор из списка</option>
                                        <option value="multiselect">Множественный выбор</option>
                                    </select>
                                </div>
                                {(bidAttributeFormData.type === 'select' || bidAttributeFormData.type === 'multiselect') && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Варианты (через запятую)</label>
                                        <input
                                            type="text"
                                            value={bidAttributeFormData.options ? bidAttributeFormData.options.join(', ') : ''}
                                            onChange={(e) => setBidAttributeFormData({ ...bidAttributeFormData, options: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Вариант 1, Вариант 2, Вариант 3"
                                        />
                                    </div>
                                )}
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={bidAttributeFormData.isEnabled}
                                        onChange={(e) => setBidAttributeFormData({ ...bidAttributeFormData, isEnabled: e.target.checked })}
                                        className="mr-2"
                                    />
                                    <span>Включен</span>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowBidAttributeForm(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        Отмена
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                    >
                                        Сохранить
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        )}
    </div>
)}

{activeSettingsTab === 'administration' && (

                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Администрирование</h2>
                    </div>

                    <div className="space-y-6">
                        {/* Client Upload/Export Card */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold mb-4">Управление клиентами</h3>
                            <div className="flex gap-4">
                                <button
                                    onClick={handleExportClients}
                                    className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition"
                                >
                                    Экспорт клиентов
                                </button>
                            </div>
                        </div>

                        {/* Object Management Card */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold mb-4">Управление Объектами</h3>
                            <div className="flex gap-4">
                                <button
                                    onClick={handleExportClientObjects}
                                    className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition"
                                >
                                    Экспорт объектов
                                </button>
                            </div>
                        </div>

                        {/* Bid Management Card */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold mb-4">Управление заявками</h3>
                            <div className="flex gap-4">
                                <button
                                    onClick={handleExportBids}
                                    className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition"
                                >
                                    Экспорт заявок
                                </button>
                            </div>
                        </div>


                    </div>
                </div>
            )}


        </div>
    );
};

export default Settings;