import { loadTasks, saveTasks, loadFocus, saveFocus } from '../src/utils/storage';
import { Task, FocusSession } from '../src/utils/types';

describe('Storage Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should save and load tasks', async () => {
    const mockTasks: Task[] = [
      {
        id: '1',
        title: 'Test Task',
        done: false,
        createdAt: Date.now(),
      }
    ];

    await saveTasks(mockTasks);
    const loaded = await loadTasks();
    expect(loaded).toBeDefined();
  });

  it('should save and load focus sessions', async () => {
    const mockSessions: FocusSession[] = [
      {
        id: '1',
        seconds: 1500,
        endedAt: Date.now(),
        productivity: 8,
      }
    ];

    await saveFocus(mockSessions);
    const loaded = await loadFocus();
    expect(loaded).toBeDefined();
  });
});