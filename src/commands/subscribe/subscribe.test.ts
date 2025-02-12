import { prisma } from '../../prisma';
import { subscribe } from './command';
import { MyContext } from '../../types';
import { getSuccessMessage } from './helpers';

// Mock prisma client
jest.mock('../../prisma', () => ({
  prisma: {
    subscriptions: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

// Helper to create mock context
const createMockContext = (
  messageText: string,
  chatId: number = 123,
): Partial<MyContext> => ({
  // @ts-ignore
  chat: { id: chatId },
  // @ts-ignore
  message: { text: messageText },
  reply: jest.fn(),
  replyWithMarkdownV2: jest.fn(),
});

describe('subscribe command', () => {
  let mockCtx: Partial<MyContext>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a subscription with "to" parameter', async () => {
    mockCtx = createMockContext('/subscribe to:bob.eth');

    await subscribe()(mockCtx as MyContext);

    expect(prisma.subscriptions.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        groupId: '123',
        to: 'bob.eth',
        from: null,
        status: 'success',
      }),
    });
    expect(mockCtx.reply).toHaveBeenCalledWith(
      getSuccessMessage('success', 'bob.eth'),
    );
  });

  it('should create a subscription with implicit "to" parameter', async () => {
    mockCtx = createMockContext('/subscribe bob.eth');

    await subscribe()(mockCtx as MyContext);

    expect(prisma.subscriptions.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        groupId: '123',
        to: 'bob.eth',
        from: null,
        status: 'success',
      }),
    });
    expect(mockCtx.reply).toHaveBeenCalledWith(
      getSuccessMessage('success', 'bob.eth'),
    );
  });

  it('should create a subscription with all parameters', async () => {
    mockCtx = createMockContext(
      '/subscribe to:bob.eth from:alice.eth status:final',
    );

    await subscribe()(mockCtx as MyContext);

    expect(prisma.subscriptions.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        groupId: '123',
        to: 'bob.eth',
        from: 'alice.eth',
        status: 'final',
      }),
    });
    expect(mockCtx.reply).toHaveBeenCalledWith(
      getSuccessMessage('final', 'bob.eth', 'alice.eth'),
    );
  });

  it('should reject invalid status parameter', async () => {
    mockCtx = createMockContext('/subscribe to:bob.eth status:invalid');

    await subscribe()(mockCtx as MyContext);

    expect(prisma.subscriptions.create).not.toHaveBeenCalled();
    expect(mockCtx.reply).toHaveBeenCalledWith(
      'Invalid status. Must be one of: success, semifinal, final',
    );
  });

  it('should handle missing parameters', async () => {
    mockCtx = createMockContext('/subscribe');

    await subscribe()(mockCtx as MyContext);

    expect(prisma.subscriptions.create).not.toHaveBeenCalled();
    expect(mockCtx.reply).toHaveBeenCalledWith(
      'Please provide subscription parameters. Example: /subscribe to:bob.eth',
    );
  });

  it('should handle prisma errors', async () => {
    mockCtx = createMockContext('/subscribe to:bob.eth');
    (prisma.subscriptions.create as jest.Mock).mockRejectedValueOnce(
      new Error('DB Error'),
    );

    await subscribe()(mockCtx as MyContext);

    expect(mockCtx.reply).toHaveBeenCalledWith(
      'Error creating subscription. Please try again.',
    );
  });
});
