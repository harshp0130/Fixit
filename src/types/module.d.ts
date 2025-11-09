declare module '@/lib/api' {
  import { 
    ApiResponse,
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    CreateTicketRequest,
    UpdateTicketRequest,
    TicketListResponse,
    TicketResponse,
    UpdateTicketResponse,
    DepartmentListResponse,
  } from './types/api';

  class ApiClient {
    setToken(token: string): void;
    clearToken(): void;
    request<T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, data?: unknown): Promise<ApiResponse<T>>;
    login(data: LoginRequest): Promise<ApiResponse<LoginResponse>>;
    register(data: RegisterRequest): Promise<ApiResponse<RegisterResponse>>;
    getTickets(page?: number, limit?: number, filters?: { status?: string; department?: string }): Promise<ApiResponse<TicketListResponse>>;
    createTicket(data: CreateTicketRequest): Promise<ApiResponse<TicketResponse>>;
    updateTicket(ticketId: string, data: UpdateTicketRequest): Promise<ApiResponse<UpdateTicketResponse>>;
    getTicketById(ticketId: string): Promise<ApiResponse<TicketResponse>>;
    getDepartments(): Promise<ApiResponse<DepartmentListResponse>>;
  }

  export const apiClient: ApiClient;
}