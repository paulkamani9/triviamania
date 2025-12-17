/**
 * Join Feature Types
 *
 * Type definitions for the room joining feature.
 */

/**
 * State for the join room flow
 */
export interface JoinState {
  /** Current room code input value */
  roomCode: string;
  /** Whether the room is being validated */
  isValidating: boolean;
  /** Whether the join operation is in progress */
  isJoining: boolean;
  /** Error message, if any */
  error: string | null;
}

/**
 * Props for JoinView component
 */
export interface JoinViewProps {
  /** Current room code value */
  roomCode: string;
  /** Handler for room code changes */
  onRoomCodeChange: (code: string) => void;
  /** Handler for join button click */
  onJoinRoom: () => void;
  /** Whether validation is in progress */
  isValidating: boolean;
  /** Whether join operation is in progress */
  isJoining: boolean;
  /** Error message to display */
  error: string | null;
}

/**
 * Props for RoomCodeInput component
 */
export interface RoomCodeInputProps {
  /** Current input value */
  value: string;
  /** Handler for value changes */
  onChange: (value: string) => void;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Error message to display */
  error?: string | null;
  /** Placeholder text */
  placeholder?: string;
  /** Auto-focus the input */
  autoFocus?: boolean;
}

/**
 * Room validation result
 */
export interface RoomValidationResult {
  /** Whether the room is valid */
  isValid: boolean;
  /** Error message if invalid */
  error?: string;
}
