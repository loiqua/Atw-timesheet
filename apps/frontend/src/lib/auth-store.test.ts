import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from './auth-store';

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useAuthStore());
    act(() => {
      result.current.clear();
    });
  });

  it('should initialize with null user and tokens', () => {
    const { result } = renderHook(() => useAuthStore());
    
    expect(result.current.user).toBeNull();
    expect(result.current.accessToken).toBeNull();
    expect(result.current.refreshToken).toBeNull();
  });

  it('should set user and tokens on login', () => {
    const { result } = renderHook(() => useAuthStore());
    
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      username: null,
      fullName: 'Test User',
      role: 'EMPLOYEE' as const,
      domainId: null,
      domain: null,
    };

    act(() => {
      result.current.setUser(mockUser);
      result.current.setTokens({ accessToken: 'access-token', refreshToken: 'refresh-token' });
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.accessToken).toBe('access-token');
    expect(result.current.refreshToken).toBe('refresh-token');
  });

  it('should clear user and tokens on logout', () => {
    const { result } = renderHook(() => useAuthStore());
    
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      username: null,
      fullName: 'Test User',
      role: 'EMPLOYEE' as const,
      domainId: null,
      domain: null,
    };

    act(() => {
      result.current.setUser(mockUser);
      result.current.setTokens({ accessToken: 'access-token', refreshToken: 'refresh-token' });
    });

    expect(result.current.user).not.toBeNull();

    act(() => {
      result.current.clear();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.accessToken).toBeNull();
    expect(result.current.refreshToken).toBeNull();
  });

  it('should update access token', () => {
    const { result } = renderHook(() => useAuthStore());
    
    act(() => {
      result.current.setTokens({ accessToken: 'old-token', refreshToken: 'refresh-token' });
    });

    expect(result.current.accessToken).toBe('old-token');

    act(() => {
      result.current.setTokens({ accessToken: 'new-token', refreshToken: 'refresh-token' });
    });

    expect(result.current.accessToken).toBe('new-token');
  });

  it('should check if user is admin', () => {
    const { result } = renderHook(() => useAuthStore());
    
    const adminUser = {
      id: 'admin-123',
      email: 'admin@example.com',
      username: 'adminuser',
      fullName: 'Admin User',
      role: 'ADMIN' as const,
      domainId: null,
      domain: null,
    };

    act(() => {
      result.current.setUser(adminUser);
    });

    expect(result.current.user?.role).toBe('ADMIN');
  });

  it('should check if user is manager', () => {
    const { result } = renderHook(() => useAuthStore());
    
    const managerUser = {
      id: 'manager-123',
      email: 'manager@example.com',
      username: 'manageruser',
      fullName: 'Manager User',
      role: 'MANAGER' as const,
      domainId: null,
      domain: null,
    };

    act(() => {
      result.current.setUser(managerUser);
    });

    expect(result.current.user?.role).toBe('MANAGER');
  });

  it('should persist state across renders', () => {
    const { result: result1 } = renderHook(() => useAuthStore());
    
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      username: 'testuser',
      fullName: 'Test User',
      role: 'EMPLOYEE' as const,
      domainId: null,
      domain: null,
    };

    act(() => {
      result1.current.setUser(mockUser);
    });

    // Create new hook instance
    const { result: result2 } = renderHook(() => useAuthStore());
    
    expect(result2.current.user).toEqual(mockUser);
  });
});
