export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'driver' | 'customer';
  createdAt: string;
}

export interface DashboardStats {
  totalDrivers: number;
  totalCustomers: number;
  totalRides: number;
  activeRides: number;
  revenue: number;
  pendingApprovals: number;
}

export interface ActivityItem {
  id: string;
  type?: 'driver' | 'ride' | 'customer' | 'payment' | 'system';
  action: string;
  time: string;
  icon?: string;
  color: string;
  read?: boolean;
}

export interface MenuItem {
  id: string;
  icon: React.ComponentType;
  label: string;
  color: string;
  badge?: number;
  path?: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  timestamp: string;
}
