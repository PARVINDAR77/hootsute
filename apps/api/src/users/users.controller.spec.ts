import { UsersController } from './users.controller';

describe('UsersController', () => {
  const mockUsersService = {
    findById: jest.fn(),
    updatePreferences: jest.fn(),
  };

  let controller: UsersController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new UsersController(mockUsersService as any);
  });

  it('returns default light theme when user preference is unset', async () => {
    mockUsersService.findById.mockResolvedValue({
      id: 'user-1',
      email: 'alex@example.com',
      themePreference: 'light',
    });

    const result = await controller.getPreferences({ id: 'user-1' } as any);
    expect(result).toEqual({ themePreference: 'light' });
  });

  it('persists updated dark theme preference', async () => {
    mockUsersService.updatePreferences.mockResolvedValue({
      id: 'user-1',
      email: 'alex@example.com',
      themePreference: 'dark',
    });

    const result = await controller.updatePreferences(
      { id: 'user-1' } as any,
      { themePreference: 'dark' },
    );

    expect(mockUsersService.updatePreferences).toHaveBeenCalledWith('user-1', {
      themePreference: 'dark',
    });
    expect(result.themePreference).toBe('dark');
  });
});
