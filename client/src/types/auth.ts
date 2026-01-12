export interface User {
  _id: string; // MongoDB _id for business logic
  uid: string; // Firebase uid for authentication
  email: string | null;
  displayName: string | null;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface AuthForms {
  email: string;
  password: string;
  confirmPassword?: string;
}