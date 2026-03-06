export interface ApiCustomer {
  id: number;
  name: string;
  email: string;
  phone: string;
  created_at: string;
}

export interface ApiStore {
  id: number;
  name: string;
  code: string;
  store_type: 'main' | 'addon';
  parent: number | null;
  is_active: boolean;
  created_at: string;
}

export interface ApiEmployee {
  id: number;
  name: string;
  role: 'Manager' | 'Salesman' | 'Technician' | 'Staff';
  store: string;
  login_username?: string;
  email: string;
  phone: string;
  sales_count: number;
  join_date: string | null;
  created_at: string;
}

export interface ApiProduct {
  id: number;
  sku: string;
  name: string;
  category?: 'new_phone' | 'used_phone' | 'accessories' | 'services';
  description: string;
  price: string;
  stock_quantity: number;
  active: boolean;
}

export interface CreateProductPayload {
  sku: string;
  name: string;
  category: 'new_phone' | 'used_phone' | 'accessories' | 'services';
  description?: string;
  price: string;
  stock_quantity: number;
  active?: boolean;
}

export interface ApiSaleItem {
  id?: number;
  product: number;
  quantity: number;
  unit_price: string;
  line_total?: string;
}

export interface ApiSale {
  id: number;
  customer: number | null;
  store_ref?: number | null;
  sold_at: string;
  notes: string;
  items: ApiSaleItem[];
  total_amount: string;
}

export interface ApiBuyback {
  id: number;
  imei: string;
  brand: string;
  model: string;
  color: string;
  store_ref?: number | null;
  condition: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  market_value: string;
  negotiated_price: string;
  status: 'Pending' | 'Accepted' | 'Processed' | 'Rejected';
  created_at: string;
}

export interface ApiRepairTicket {
  id: number;
  ticket_no: string;
  customer_name: string;
  store_ref?: number | null;
  device_model: string;
  technician_name: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Delivered';
  parts: Array<{ name: string; qty: number; unitCost: number; status: 'Pending' | 'Purchased' }>;
  labor_cost: string;
  warranty: '3 months' | '6 months' | '12 months';
  estimated_completion: string | null;
  notes: string;
  created_at: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Staff';
  createdAt: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface CreateSalePayload {
  customer: number | null;
  notes: string;
  items: ApiSaleItem[];
}

export interface CreateBuybackPayload {
  imei: string;
  brand: string;
  model: string;
  color: string;
  condition: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  market_value: string;
  negotiated_price: string;
  status?: 'Pending' | 'Accepted' | 'Processed' | 'Rejected';
}

export interface CreateRepairPayload {
  ticket_no: string;
  customer_name: string;
  device_model: string;
  technician_name: string;
  status?: 'Pending' | 'In Progress' | 'Completed' | 'Delivered';
  parts?: Array<{ name: string; qty: number; unitCost: number; status: 'Pending' | 'Purchased' }>;
  labor_cost?: string;
  warranty?: '3 months' | '6 months' | '12 months';
  estimated_completion?: string | null;
  notes?: string;
}

export interface CreateEmployeePayload {
  name: string;
  role: 'Manager' | 'Salesman' | 'Technician' | 'Staff';
  store: string;
  email: string;
  phone: string;
  username?: string;
  password?: string;
  sales_count?: number;
  join_date?: string | null;
}

export interface BriefReportParams {
  from?: string;
  to?: string;
  month?: string;
  store?: string;
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
const TOKEN_KEY = 'quality-mobiles-token';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Token ${token}` } : {}),
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let message = `API request failed: ${response.status}`;
    try {
      const data = await response.json();
      message = data?.detail || JSON.stringify(data);
    } catch {
      // Ignore JSON parsing errors on non-JSON responses.
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function login(payload: { username: string; password: string }) {
  return apiRequest<LoginResponse>('/auth/login/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function logout() {
  return apiRequest<{ detail: string }>('/auth/logout/', { method: 'POST' });
}

export function listStores() {
  return apiRequest<ApiStore[]>('/stores/');
}

export function listCustomers() {
  return apiRequest<ApiCustomer[]>('/customers/');
}

export function createCustomer(payload: Pick<ApiCustomer, 'name' | 'email' | 'phone'>) {
  return apiRequest<ApiCustomer>('/customers/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function listEmployees() {
  return apiRequest<ApiEmployee[]>('/employees/');
}

export function createEmployee(payload: CreateEmployeePayload) {
  return apiRequest<ApiEmployee>('/employees/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function listProducts() {
  return apiRequest<ApiProduct[]>('/products/');
}

export function createProduct(payload: CreateProductPayload) {
  return apiRequest<ApiProduct>('/products/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function listSales() {
  return apiRequest<ApiSale[]>('/sales/');
}

export function createSale(payload: CreateSalePayload) {
  return apiRequest<ApiSale>('/sales/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function listBuybacks() {
  return apiRequest<ApiBuyback[]>('/buybacks/');
}

export function createBuyback(payload: CreateBuybackPayload) {
  return apiRequest<ApiBuyback>('/buybacks/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function listRepairs() {
  return apiRequest<ApiRepairTicket[]>('/repairs/');
}

export function createRepair(payload: CreateRepairPayload) {
  return apiRequest<ApiRepairTicket>('/repairs/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateRepair(id: number, payload: Partial<CreateRepairPayload>) {
  return apiRequest<ApiRepairTicket>(`/repairs/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function downloadBriefReportCSV(params: BriefReportParams) {
  const token = getAuthToken();
  const query = new URLSearchParams();
  if (params.from) query.set('from', params.from);
  if (params.to) query.set('to', params.to);
  if (params.month) query.set('month', params.month);
  if (params.store) query.set('store', params.store);

  const response = await fetch(`${API_BASE}/reports/brief/download/?${query.toString()}`, {
    headers: {
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
  });

  if (!response.ok) {
    let message = `API request failed: ${response.status}`;
    try {
      const data = await response.json();
      message = data?.detail || JSON.stringify(data);
    } catch {
      // Ignore JSON parsing errors on non-JSON responses.
    }
    throw new Error(message);
  }

  return response.blob();
}
