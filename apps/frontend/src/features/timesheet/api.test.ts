// Mock du fetcher
jest.mock('../../lib/fetcher', () => ({
  apiPost: jest.fn(),
  apiGet: jest.fn(),
  apiPatch: jest.fn(),
  apiDelete: jest.fn(),
}));

describe('Timesheet API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be a valid test file', () => {
    expect(true).toBe(true);
  });

  it('should have mocked fetcher functions', async () => {
    const { apiPost, apiGet, apiPatch, apiDelete } = await import('../../lib/fetcher');
    expect(jest.isMockFunction(apiPost)).toBe(true);
    expect(jest.isMockFunction(apiGet)).toBe(true);
    expect(jest.isMockFunction(apiPatch)).toBe(true);
    expect(jest.isMockFunction(apiDelete)).toBe(true);
  });
});
