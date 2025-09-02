import { POST } from './route';
import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

// Mock the supabase-server module
jest.mock('@/lib/supabase-server', () => ({
  getSupabaseServer: jest.fn(),
}));

interface MockSupabase {
  from: jest.Mock<any, any>;
  select: jest.Mock<any, any>;
  eq: jest.Mock<any, any>;
  single: jest.Mock<any, any>;
  insert: jest.Mock<any, any>;
}

const mockSupabase: MockSupabase = {
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  single: jest.fn(),
  insert: jest.fn(() => mockSupabase),
};

// Helper to create a mock request object
const createMockRequest = (body: any) => ({
  json: async () => body,
});

describe('POST /api/polls/[id]/vote', () => {
  const pollId = 'test-poll-id';
  const optionId = 'test-option-id';
  const userId = 'test-user-id';

  beforeEach(() => {
    jest.clearAllMocks();
    (getSupabaseServer as jest.Mock).mockReturnValue(mockSupabase);
  });

  // Unit Tests
  describe('Unit Tests', () => {
    it('should successfully record a vote and return 201 (Happy Path)', async () => {
      // Mock option verification
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({ data: { poll_id: pollId }, error: null });

      // Mock vote insertion
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.insert.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({ data: { id: 'vote-id-123' }, error: null });

      const request = createMockRequest({ optionId, userId });
      const response = await POST(request as Request, { params: Promise.resolve({ id: pollId }) });

      expect(response.status).toBe(201);
      await expect(response.json()).resolves.toEqual({ success: true, voteId: 'vote-id-123' });

      expect(mockSupabase.from).toHaveBeenCalledWith('poll_options');
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', optionId);
      expect(mockSupabase.from).toHaveBeenCalledWith('votes');
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        poll_id: pollId,
        option_id: optionId,
        voter_fingerprint: userId,
      });
    });

    it('should return 400 if optionId is missing in the request body', async () => {
      const request = createMockRequest({});
      const response = await POST(request as Request, { params: Promise.resolve({ id: pollId }) });

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: 'Option ID is required' });
    });

    it('should return 400 if option does not belong to the poll', async () => {
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({ data: { poll_id: 'other-poll-id' }, error: null });

      const request = createMockRequest({ optionId, userId });
      const response = await POST(request as Request, { params: Promise.resolve({ id: pollId }) });

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: 'Invalid option for this poll' });
    });

    it('should return 409 if the user has already voted on this poll (duplicate vote)', async () => {
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({ data: { poll_id: pollId }, error: null });

      const duplicateVoteError = { code: '23505', message: 'duplicate key error' };
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.insert.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: duplicateVoteError });

      const request = createMockRequest({ optionId, userId });
      const response = await POST(request as Request, { params: Promise.resolve({ id: pollId }) });

      expect(response.status).toBe(409);
      await expect(response.json()).resolves.toEqual({ error: 'You have already voted on this poll' });
    });

    it('should return 500 for a generic database error during vote insertion', async () => {
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({ data: { poll_id: pollId }, error: null });

      const genericError = { message: 'Database connection lost', code: '50000' };
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.insert.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: genericError });

      const request = createMockRequest({ optionId, userId });
      const response = await POST(request as Request, { params: Promise.resolve({ id: pollId }) });

      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toEqual({ error: genericError.message });
    });

    it('should return 400 for invalid JSON body', async () => {
      // This test simulates an error in request.json() parsing
      const malformedRequest = {
        json: async () => {
          throw new Error('Unexpected token \'<\' in JSON at position 0');
        },
      };

      const response = await POST(malformedRequest as any as Request, { params: Promise.resolve({ id: pollId }) });

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: 'Invalid JSON body' });
    });
  });

  // Integration Test
  describe('Integration Test', () => {
    it('should successfully record a vote and return 201', async () => {
      // Mock option verification
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({ data: { poll_id: pollId }, error: null });

      // Mock vote insertion
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.insert.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({ data: { id: 'vote-id-123' }, error: null });

      const request = createMockRequest({ optionId, userId });
      const response = await POST(request as Request, { params: Promise.resolve({ id: pollId }) });

      expect(response.status).toBe(201);
      await expect(response.json()).resolves.toEqual({ success: true, voteId: 'vote-id-123' });

      expect(mockSupabase.from).toHaveBeenCalledWith('poll_options');
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', optionId);
      expect(mockSupabase.from).toHaveBeenCalledWith('votes');
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        poll_id: pollId,
        option_id: optionId,
        voter_fingerprint: userId,
      });
    });
  });
});
