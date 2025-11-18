import { supabase } from '@/lib/supabase';
import { Room, GameState, type Result, ok, err } from '@/types';
import { generateRoomCode } from '../utils/roomCodeGenerator';

/**
 * Room Service
 *
 * Manages trivia room lifecycle including creation, joining,
 * state management, and real-time subscriptions.
 */

/**
 * Create a new trivia room with a unique code
 *
 * Generates a unique 8-character room code, creates a new room in the database,
 * and returns the room data. The room starts in 'waiting' status.
 *
 * @param hostPlayerId - UUID of the player who will host the room
 * @returns Result containing the created Room or an Error
 *
 * @example
 * const result = await createRoom('player-123');
 * if (result.success) {
 *   console.log(`Room created with code: ${result.data.code}`);
 *   navigate(`/room/${result.data.code}`);
 * } else {
 *   console.error(`Failed to create room: ${result.error.message}`);
 * }
 */
export async function createRoom(hostPlayerId: string): Promise<Result<Room>> {
  try {
    // Validate input
    if (!hostPlayerId || hostPlayerId.trim() === '') {
      return err('Host player ID is required');
    }

    // Generate unique room code
    const code = await generateRoomCode();

    // Create room in database
    const { data, error } = await supabase
      .from('games')
      .insert({
        code,
        host_id: hostPlayerId,
        status: GameState.WAITING,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return err(`Failed to create room: ${error.message}`);
    }

    if (!data) {
      return err('Room created but no data returned');
    }

    return ok(data as Room);
  } catch (error) {
    return err(
      error instanceof Error ? error : new Error('Unknown error creating room')
    );
  }
}

/**
 * Join an existing room using its room code
 *
 * Validates the room code, checks if the room exists and is joinable,
 * verifies capacity constraints, and returns the room data.
 *
 * @param code - The 8-character room code
 * @param playerId - UUID of the player joining the room
 * @returns Result containing the Room or an Error
 *
 * @example
 * const result = await joinRoom('ABCD1234', 'player-456');
 * if (result.success) {
 *   console.log(`Joined room: ${result.data.code}`);
 * } else {
 *   // Handle error (room not found, full, already started, etc.)
 *   showError(result.error.message);
 * }
 */
export async function joinRoom(
  code: string,
  playerId: string
): Promise<Result<Room>> {
  try {
    // Validate inputs
    if (!code || code.trim() === '') {
      return err('Room code is required');
    }

    if (!playerId || playerId.trim() === '') {
      return err('Player ID is required');
    }

    // Normalize room code to uppercase
    const normalizedCode = code.trim().toUpperCase();

    // Fetch room from database
    const { data: room, error: roomError } = await supabase
      .from('games')
      .select('*')
      .eq('code', normalizedCode)
      .single();

    if (roomError) {
      if (roomError.code === 'PGRST116') {
        // No rows returned
        return err('Room not found');
      }
      return err(`Failed to fetch room: ${roomError.message}`);
    }

    if (!room) {
      return err('Room not found');
    }

    // Check if room is in waiting status
    if (room.status !== GameState.WAITING) {
      return err('Cannot join room: game already in progress or finished');
    }

    // Check room capacity (max 8 players)
    const { count, error: countError } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', room.id);

    if (countError) {
      return err(`Failed to check room capacity: ${countError.message}`);
    }

    const MAX_PLAYERS = 8;
    if (count !== null && count >= MAX_PLAYERS) {
      return err('Room is full');
    }

    return ok(room as Room);
  } catch (error) {
    return err(
      error instanceof Error ? error : new Error('Unknown error joining room')
    );
  }
}

/**
 * Get the current state of a room by ID
 *
 * Fetches the latest room data from the database including metadata.
 *
 * @param roomId - UUID of the room
 * @returns Result containing the Room or an Error
 *
 * @example
 * const result = await getRoomState('room-uuid-123');
 * if (result.success) {
 *   console.log(`Room status: ${result.data.status}`);
 * }
 */
export async function getRoomState(roomId: string): Promise<Result<Room>> {
  try {
    if (!roomId || roomId.trim() === '') {
      return err('Room ID is required');
    }

    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', roomId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return err('Room not found');
      }
      return err(`Failed to fetch room: ${error.message}`);
    }

    if (!data) {
      return err('Room not found');
    }

    return ok(data as Room);
  } catch (error) {
    return err(
      error instanceof Error ? error : new Error('Unknown error fetching room')
    );
  }
}

/**
 * Update a room's status
 *
 * Transitions a room between states (waiting → active → finished).
 * This broadcasts the change via Supabase Realtime.
 *
 * @param roomId - UUID of the room to update
 * @param status - New status for the room
 * @returns Result indicating success or failure
 *
 * @example
 * // Start the game
 * const result = await updateRoomStatus('room-123', GameState.ACTIVE);
 * if (result.success) {
 *   console.log('Game started!');
 * }
 */
export async function updateRoomStatus(
  roomId: string,
  status: GameState
): Promise<Result<void>> {
  try {
    if (!roomId || roomId.trim() === '') {
      return err('Room ID is required');
    }

    // Validate status is a valid GameState
    if (!Object.values(GameState).includes(status)) {
      return err('Invalid game status');
    }

    const { error } = await supabase
      .from('games')
      .update({ status })
      .eq('id', roomId);

    if (error) {
      return err(`Failed to update room status: ${error.message}`);
    }

    return ok(undefined);
  } catch (error) {
    return err(
      error instanceof Error
        ? error
        : new Error('Unknown error updating room status')
    );
  }
}

/**
 * Subscribe to real-time updates for a room
 *
 * Sets up a Supabase Realtime subscription to listen for changes
 * to a specific room. The callback is invoked whenever the room data changes.
 *
 * **Important**: The caller is responsible for unsubscribing when done.
 *
 * @param roomId - UUID of the room to subscribe to
 * @param callback - Function called when room data changes
 * @returns Realtime channel for cleanup (call channel.unsubscribe())
 *
 * @example
 * const channel = subscribeToRoom('room-123', (updatedRoom) => {
 *   console.log('Room updated:', updatedRoom.status);
 *   setRoom(updatedRoom);
 * });
 *
 * // Clean up on unmount
 * return () => {
 *   channel.unsubscribe();
 * };
 */
export function subscribeToRoom(
  roomId: string,
  callback: (room: Room) => void
): ReturnType<typeof supabase.channel> {
  const channel = supabase
    .channel(`room-${roomId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'games',
        filter: `id=eq.${roomId}`,
      },
      (payload) => {
        if (payload.new) {
          callback(payload.new as Room);
        }
      }
    )
    .subscribe();

  return channel;
}
