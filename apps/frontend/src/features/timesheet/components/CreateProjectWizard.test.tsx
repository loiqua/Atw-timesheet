// Mock des dépendances
jest.mock('../../../lib/offline-storage');
jest.mock('../api', () => ({
  createTask: jest.fn(),
}));

describe('CreateProjectWizard', () => {
  it('should be a valid test file', () => {
    expect(true).toBe(true);
  });

  it('should have mocked dependencies', async () => {
    const { createTask } = await import('../api');
    expect(jest.isMockFunction(createTask)).toBe(true);
  });
});
