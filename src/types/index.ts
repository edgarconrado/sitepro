/**
 * SitePro — Tipos de Datos
 */

// ─── Usuario ──────────────────────────────────────────────────
export type UserRole =
  | 'Gerente de Proyecto'
  | 'Electricista'
  | 'Plomero'
  | 'Inspector'
  | 'Acabados'
  | 'Arquitecto'
  | 'Ingeniero';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  initials: string;        // Ej: "JP"
  phone?: string;
  isOnline: boolean;
  activeTasks: number;
  avatarUrl?: string;
}

// ─── Proyecto ─────────────────────────────────────────────────
export type ProjectStatus =
  | 'En Progreso'
  | 'En Revisión'
  | 'Completado'
  | 'En Pausa';

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  progress: number;        // 0–100
  startDate: string;       // ISO date
  deadline: string;        // ISO date
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  urgentTasks: number;
  teamCount: number;
}

// ─── Tarea ────────────────────────────────────────────────────
export type TaskStatus =
  | 'Urgente'
  | 'En Progreso'
  | 'Pendiente'
  | 'Completada';

export type TaskPriority = 'Alta' | 'Media' | 'Baja';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: User;
  location: string;        // Ej: "Piso 5"
  createdAt: string;       // ISO datetime
  deadline: string;        // ISO date
  completedAt?: string;    // ISO datetime
  photos?: Photo[];
  comments?: Comment[];
}

// ─── Foto ─────────────────────────────────────────────────────
export interface Photo {
  id: string;
  projectId: string;
  taskId?: string;
  uri: string;             // Local URI o URL remota
  location: string;        // Ej: "Piso 5 - Zona A"
  uploadedBy: User;
  capturedAt: string;      // ISO datetime
  latitude?: number;
  longitude?: number;
  notes?: string;
  tags?: string[];
}

// ─── Mensaje ──────────────────────────────────────────────────
export type MessageStatus = 'sending' | 'sent' | 'read';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  sentAt: string;          // ISO datetime
  status: MessageStatus;
  attachments?: string[];
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage: string;
  lastMessageAt: string;   // ISO datetime
  unreadCount: number;
  isGroup: boolean;
  groupName?: string;
}

// ─── Notificación ─────────────────────────────────────────────
export type NotificationType = 'task' | 'message' | 'system' | 'photo';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  createdAt: string;       // ISO datetime
  isRead: boolean;
  resourceId?: string;     // ID del recurso relacionado
  resourceType?: 'task' | 'photo' | 'message' | 'project';
}

// ─── Auth ─────────────────────────────────────────────────────
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// ─── Comentario ───────────────────────────────────────────────
export interface Comment {
  id: string;
  taskId: string;
  author: User;
  text: string;
  createdAt: string;
}

// ─── Actividad reciente ───────────────────────────────────────
export type ActivityType = 'task_completed' | 'photo_uploaded' | 'task_assigned' | 'comment_added';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  actor: User;
}

// ─── API Response ─────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
