import { Context } from 'telegraf';
import { prisma } from '../../prisma';
import { subscribe } from './command';
import { list } from '../list';

// Helper to create context with minimal mocking
const createTestContext = (
  messageText: string,
  chatId: number = 123,
): Partial<Context> => ({
  // @ts-ignore
  chat: { id: chatId },
  // @ts-ignore
  message: { text: messageText },
  reply: jest.fn(),
  replyWithMarkdownV2: jest.fn(),
});

describe('subscribe command - system tests', () => {
  let testCtx: Partial<Context>;

  // Clean up database before each test
  beforeEach(async () => {
    await prisma.subscriptions.deleteMany({});
  });

  // Clean up after all tests
  afterAll(async () => {
    await prisma.subscriptions.deleteMany({});
    await prisma.$disconnect();
  });

  it('should handle simplified subscription format', async () => {
    // Arrange
    testCtx = createTestContext('/subscribe bob.eth');

    // Act
    await subscribe()(testCtx as Context);

    // Assert
    const subscriptions = await prisma.subscriptions.findMany();
    expect(subscriptions).toHaveLength(1);
    expect(subscriptions[0]).toMatchObject({
      groupId: '123',
      to: 'bob.eth',
      from: null,
      status: 'success',
    });
    expect(testCtx.reply).toHaveBeenCalledWith('Subscription created');
  });

  it('should store subscription in database with basic parameters', async () => {
    // Arrange
    testCtx = createTestContext('/subscribe to:bob.eth');

    // Act
    await subscribe()(testCtx as Context);

    // Assert
    const subscriptions = await prisma.subscriptions.findMany();
    expect(subscriptions).toHaveLength(1);
    expect(subscriptions[0]).toMatchObject({
      groupId: '123',
      to: 'bob.eth',
      from: null,
      status: 'success',
    });
    expect(testCtx.reply).toHaveBeenCalledWith('Subscription created');
  });

  it('should store subscription with all parameters', async () => {
    // Arrange
    testCtx = createTestContext(
      '/subscribe to:bob.eth from:alice.eth status:final',
    );

    // Act
    await subscribe()(testCtx as Context);

    // Assert
    const subscriptions = await prisma.subscriptions.findMany();
    expect(subscriptions).toHaveLength(1);
    expect(subscriptions[0]).toMatchObject({
      groupId: '123',
      to: 'bob.eth',
      from: 'alice.eth',
      status: 'final',
    });
  });

  it('should not store anything for invalid status', async () => {
    // Arrange
    testCtx = createTestContext('/subscribe to:bob.eth status:invalid');

    // Act
    await subscribe()(testCtx as Context);

    // Assert
    const subscriptions = await prisma.subscriptions.findMany();
    expect(subscriptions).toHaveLength(0);
    expect(testCtx.reply).toHaveBeenCalledWith(
      'Invalid status. Must be one of: success, semifinal, final',
    );
  });

  it('should handle multiple subscriptions for same group', async () => {
    // Arrange
    const ctx1 = createTestContext('/subscribe to:bob.eth');
    const ctx2 = createTestContext('/subscribe to:alice.eth', 123);

    // Act
    await subscribe()(ctx1 as Context);
    await subscribe()(ctx2 as Context);

    // Assert
    const subscriptions = await prisma.subscriptions.findMany({
      orderBy: { to: 'asc' },
    });
    expect(subscriptions).toHaveLength(2);
    expect(subscriptions[0].to).toBe('alice.eth');
    expect(subscriptions[1].to).toBe('bob.eth');
  });

  it('should handle multiple subscriptions for same group', async () => {
    // Arrange
    const ctx1 = createTestContext('/subscribe to:bob.eth', 123);
    const ctx2 = createTestContext('/subscribe to:alice.eth', 123);
    const ctxList = createTestContext('/list', 123);

    // Act
    await subscribe()(ctx1 as Context);
    await subscribe()(ctx2 as Context);
    await list()(ctxList as Context);

    // Assert
    expect(ctxList.reply).toHaveBeenCalledWith(
      expect.stringContaining('alice.eth'),
    );
    expect(ctxList.reply).toHaveBeenCalledWith(
      expect.stringContaining('bob.eth'),
    );
  });

  it('should lowercase all commands', async () => {
    // Arrange
    const ctx1 = createTestContext('/subscribe to:BoB.eth', 123);
    const ctx2 = createTestContext('/subscribe aliCe.eth', 123);
    const ctxList = createTestContext('/list', 123);

    // Act
    await subscribe()(ctx1 as Context);
    await subscribe()(ctx2 as Context);
    await list()(ctxList as Context);

    // Assert
    expect(ctxList.reply).toHaveBeenCalledWith(
      expect.stringContaining('to:alice.eth'),
    );
    expect(ctxList.reply).toHaveBeenCalledWith(
      expect.stringContaining('to:bob.eth'),
    );
  });
});
