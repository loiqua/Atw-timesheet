import { OfflineStorageService } from './offline-storage';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

// Mock global pour Node.js
global.window = global.window || {};
Object.defineProperty(global.window, 'localStorage', {
  value: mockLocalStorage,
});

describe('OfflineStorageService', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(OfflineStorageService).toBeDefined();
  });

  it('should have saveTask method', () => {
    expect(typeof OfflineStorageService.saveTask).toBe('function');
  });

  it('should have getTasks method', () => {
    expect(typeof OfflineStorageService.getTasks).toBe('function');
  });

  it('should have deleteTask method', () => {
    expect(typeof OfflineStorageService.deleteTask).toBe('function');
  });
});
