// Serviço centralizado para comunicação com API
// TODO: Implementar quando conectar ao PostgreSQL

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiService {
  private static instance: ApiService;
  private config: ApiConfig;

  private constructor() {
    this.config = {
      // TODO: Configurar baseUrl quando tiver backend
      baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
      timeout: 10000
    };
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.config.baseUrl}${endpoint}`;
      const token = localStorage.getItem('auth_token');
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const config: RequestInit = {
        ...options,
        headers,
        signal: AbortSignal.timeout(this.config.timeout)
      };

      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || response.statusText
        };
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro de conexão'
      };
    }
  }

  // Métodos de autenticação
  public async login(username: string, password: string): Promise<ApiResponse<{ user: any; token: string }>> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  }

  public async logout(): Promise<ApiResponse> {
    return this.request('/auth/logout', {
      method: 'POST'
    });
  }

  // Métodos de artigos
  public async getArticles(limit?: number, offset?: number): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    
    return this.request(`/articles?${params.toString()}`);
  }

  public async getArticleById(id: string): Promise<ApiResponse<any>> {
    return this.request(`/articles/${id}`);
  }

  public async createArticle(article: any): Promise<ApiResponse<any>> {
    return this.request('/articles', {
      method: 'POST',
      body: JSON.stringify(article)
    });
  }

  public async updateArticle(id: string, updates: any): Promise<ApiResponse<any>> {
    return this.request(`/articles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  public async deleteArticle(id: string): Promise<ApiResponse> {
    return this.request(`/articles/${id}`, {
      method: 'DELETE'
    });
  }

  // Métodos de usuários
  public async getUsers(): Promise<ApiResponse<any[]>> {
    return this.request('/users');
  }

  public async createUser(user: any): Promise<ApiResponse<any>> {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(user)
    });
  }

  public async updateUser(id: string, updates: any): Promise<ApiResponse<any>> {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  public async deleteUser(id: string): Promise<ApiResponse> {
    return this.request(`/users/${id}`, {
      method: 'DELETE'
    });
  }

  // Métodos de mensagens de contato
  public async getContactMessages(): Promise<ApiResponse<any[]>> {
    return this.request('/contact');
  }

  public async createContactMessage(message: any): Promise<ApiResponse<any>> {
    return this.request('/contact', {
      method: 'POST',
      body: JSON.stringify(message)
    });
  }

  public async markContactMessageAsRead(id: string): Promise<ApiResponse> {
    return this.request(`/contact/${id}/read`, {
      method: 'PUT'
    });
  }

  public async deleteContactMessage(id: string): Promise<ApiResponse> {
    return this.request(`/contact/${id}`, {
      method: 'DELETE'
    });
  }

  // Métodos de programação de rádio
  public async getPrograms(): Promise<ApiResponse<any[]>> {
    return this.request('/programs');
  }

  public async createProgram(program: any): Promise<ApiResponse<any>> {
    return this.request('/programs', {
      method: 'POST',
      body: JSON.stringify(program)
    });
  }

  public async updateProgram(id: string, updates: any): Promise<ApiResponse<any>> {
    return this.request(`/programs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  public async deleteProgram(id: string): Promise<ApiResponse> {
    return this.request(`/programs/${id}`, {
      method: 'DELETE'
    });
  }

  // Métodos de banners
  public async getBanners(): Promise<ApiResponse<any[]>> {
    return this.request('/banners');
  }

  public async updateBanner(id: string, updates: any): Promise<ApiResponse<any>> {
    return this.request(`/banners/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  // Upload de arquivos
  public async uploadFile(file: File, type: 'article' | 'banner' | 'avatar'): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return this.request('/upload', {
      method: 'POST',
      body: formData,
      headers: {} // Remove Content-Type para FormData
    });
  }
}

export default ApiService.getInstance();