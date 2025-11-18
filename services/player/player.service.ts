import { supabase } from '@/lib/supabase';
import { Player, type Result, ok, err, isValidPlayerName } from '@/types';

/**
 * Player Service
 *
 * Manages player data, scoring, and real-time player list synchronization.
 * Handles player lifecycle from joining a room to leaving, including
 * host assignment and transfer logic.
 */

/**
 * Add a new player to a room
 *
 * Creates a new player record in the database. The first player to join
 * a room is automatically designated as the host.
 *
 * @param roomId - UUID of the room to join
 * @param name - Player's display name (1-20 chars, alphanumeric + spaces)
 * @returns Result containing the created Player or an Error
 *
 * @example
 * const result = await addPlayer('room-123', 'Alice');
 * if (result.success) {
 *   console.log(`Player added: ${result.data.name}`);
 *   if (result.data.is_host) {
 *     console.log('You are the host!');
 *   }
 * } else {
 *   showError(result.error.message);
 * }
 */
export async function addPlayer(
  roomId: string,
  name: string
): Promise<Result<Player>> {
  try {
    // Validate inputs
    if (!roomId || roomId.trim() === '') {
      return err('Room ID is required');
    }

    if (!name || name.trim() === '') {
      return err('Player name is required');
    }

    // Validate player name format
    if (!isValidPlayerName(name)) {
      return err(
        'Invalid player name. Must be 1-20 characters (letters, numbers, spaces only)'
      );
    }

    const trimmedName = name.trim();

    // Check if room exists
    const { data: room, error: roomError } = await supabase
      .from('games')
      .select('id, status')
      .eq('id', roomId)
      .single();

    if (roomError) {
      if (roomError.code === 'PGRST116') {
        return err('Room not found');
      }
      return err(`Failed to verify room: ${roomError.message}`);
    }

    if (!room) {
      return err('Room not found');
    }

    // Check if room is in waiting status
    if (room.status !== 'waiting') {
      return err('Cannot join room: game already in progress or finished');
    }

    // Check room capacity (max 8 players)
    const { count, error: countError } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomId);

    if (countError) {
      return err(`Failed to check room capacity: ${countError.message}`);
    }

    const MAX_PLAYERS = 8;
    if (count !== null && count >= MAX_PLAYERS) {
      return err('Room is full (maximum 8 players)');
    }

    // Determine if this player should be the host
    // First player in the room becomes host
    const isHost = count === 0;

    // Create player
    const { data: player, error: insertError } = await supabase
      .from('players')
      .insert({
        name: trimmedName,
        room_id: roomId,
        score: 0,
        is_host: isHost,
        joined_at: new Date().toISOString(),
        is_connected: true,
        last_active_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      return err(`Failed to add player: ${insertError.message}`);
    }

    if (!player) {
      return err('Player created but no data returned');
    }

    return ok(player as Player);
  } catch (error) {
    return err(
      error instanceof Error ? error : new Error('Unknown error adding player')
    );
  }
}

/**
 * Get all players in a room
 *
 * Fetches all players currently in a room, ordered by join time
 * (host appears first).
 *
 * @param roomId - UUID of the room
 * @returns Result containing array of Players or an Error
 *
 * @example
 * const result = await getPlayersInRoom('room-123');
 * if (result.success) {
 *   console.log(`${result.data.length} players in room`);
 *   result.data.forEach(p => {
 *     console.log(`${p.name}: ${p.score} points ${p.is_host ? '(host)' : ''}`);
 *   });
 * }
 */
export async function getPlayersInRoom(
  roomId: string
): Promise<Result<Player[]>> {
  try {
    if (!roomId || roomId.trim() === '') {
      return err('Room ID is required');
    }

    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', roomId)
      .order('joined_at', { ascending: true });

    if (error) {
      return err(`Failed to fetch players: ${error.message}`);
    }

    // Return empty array if no players (valid state)
    return ok((data || []) as Player[]);
  } catch (error) {
    return err(
      error instanceof Error
        ? error
        : new Error('Unknown error fetching players')
    );
  }
}

/**
 * Update a player's score
 *
 * Adds points to a player's current score. Points can be negative
 * for penalties, but the total score cannot go below 0.
 *
 * @param playerId - UUID of the player
 * @param points - Points to add (can be negative)
 * @returns Result containing updated Player or an Error
 *
 * @example
 * // Add points for correct answer
 * const result = await updatePlayerScore('player-123', 150);
 * if (result.success) {
 *   console.log(`New score: ${result.data.score}`);
 * }
 */
export async function updatePlayerScore(
  playerId: string,
  points: number
): Promise<Result<Player>> {
  try {
    if (!playerId || playerId.trim() === '') {
      return err('Player ID is required');
    }

    if (typeof points !== 'number' || !isFinite(points)) {
      return err('Points must be a valid number');
    }

    // Fetch current player data
    const { data: currentPlayer, error: fetchError } = await supabase
      .from('players')
      .select('score')
      .eq('id', playerId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return err('Player not found');
      }
      return err(`Failed to fetch player: ${fetchError.message}`);
    }

    if (!currentPlayer) {
      return err('Player not found');
    }

    // Calculate new score (ensure it doesn't go below 0)
    const newScore = Math.max(0, currentPlayer.score + points);

    // Update player score
    const { data: updatedPlayer, error: updateError } = await supabase
      .from('players')
      .update({
        score: newScore,
        last_active_at: new Date().toISOString(),
      })
      .eq('id', playerId)
      .select()
      .single();

    if (updateError) {
      return err(`Failed to update player score: ${updateError.message}`);
    }

    if (!updatedPlayer) {
      return err('Player updated but no data returned');
    }

    return ok(updatedPlayer as Player);
  } catch (error) {
    return err(
      error instanceof Error
        ? error
        : new Error('Unknown error updating player score')
    );
  }
}

/**
 * Subscribe to real-time player updates for a room
 *
 * Sets up a Supabase Realtime subscription to listen for player changes
 * (joins, leaves, score updates) in a specific room. The callback is invoked
 * with the complete updated player list whenever any change occurs.
 *
 * **Important**: The caller is responsible for unsubscribing when done.
 *
 * @param roomId - UUID of the room to subscribe to
 * @param callback - Function called with updated player list
 * @returns Realtime channel for cleanup (call channel.unsubscribe())
 *
 * @example
 * const channel = subscribeToPlayers('room-123', (players) => {
 *   console.log(`${players.length} players in room`);
 *   setPlayers(players);
 * });
 *
 * // Clean up on unmount
 * return () => {
 *   channel.unsubscribe();
 * };
 */
export function subscribeToPlayers(
  roomId: string,
  callback: (players: Player[]) => void
): ReturnType<typeof supabase.channel> {
  const channel = supabase
    .channel(`players-${roomId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'players',
        filter: `room_id=eq.${roomId}`,
      },
      async () => {
        // Fetch updated player list whenever any change occurs
        const { data } = await supabase
          .from('players')
          .select('*')
          .eq('room_id', roomId)
          .order('joined_at', { ascending: true });

        if (data) {
          callback(data as Player[]);
        }
      }
    )
    .subscribe();

  return channel;
}

/**
 * Remove a player from a room
 *
 * Deletes a player record from the database. If the player being removed
 * is the host, automatically transfers host privileges to the next oldest
 * player in the room (by join time).
 *
 * @param playerId - UUID of the player to remove
 * @returns Result indicating success or failure
 *
 * @example
 * const result = await removePlayer('player-123');
 * if (result.success) {
 *   console.log('Player removed');
 * } else {
 *   console.error('Failed to remove player:', result.error.message);
 * }
 */
export async function removePlayer(playerId: string): Promise<Result<void>> {
  try {
    if (!playerId || playerId.trim() === '') {
      return err('Player ID is required');
    }

    // Fetch player data before deletion (to check if host and get room_id)
    const { data: player, error: fetchError } = await supabase
      .from('players')
      .select('id, room_id, is_host')
      .eq('id', playerId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return err('Player not found');
      }
      return err(`Failed to fetch player: ${fetchError.message}`);
    }

    if (!player) {
      return err('Player not found');
    }

    const wasHost = player.is_host;
    const roomId = player.room_id;

    // Delete the player
    const { error: deleteError } = await supabase
      .from('players')
      .delete()
      .eq('id', playerId);

    if (deleteError) {
      return err(`Failed to remove player: ${deleteError.message}`);
    }

    // If the removed player was the host, transfer host to next player
    if (wasHost) {
      // Get the next oldest player (earliest join time)
      const { data: nextPlayers, error: nextError } = await supabase
        .from('players')
        .select('id')
        .eq('room_id', roomId)
        .order('joined_at', { ascending: true })
        .limit(1);

      if (nextError) {
        // Log error but don't fail the operation - player is already removed
        console.error('Failed to transfer host:', nextError.message);
      } else if (nextPlayers && nextPlayers.length > 0) {
        // Transfer host to the next player
        const { error: updateError } = await supabase
          .from('players')
          .update({ is_host: true })
          .eq('id', nextPlayers[0].id);

        if (updateError) {
          console.error('Failed to update new host:', updateError.message);
        }
      }
      // If no other players, no host transfer needed (room is empty)
    }

    return ok(undefined);
  } catch (error) {
    return err(
      error instanceof Error
        ? error
        : new Error('Unknown error removing player')
    );
  }
}
