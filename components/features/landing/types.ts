/**
 * Landing Feature Types
 *
 * Type definitions for the landing page and room creation flow.
 */

/**
 * Player session data stored during landing flow
 */
export interface PlayerSession {
  /** Player's display name */
  name: string;
  /** Player ID (set after joining/creating room) */
  playerId?: string;
  /** Current room code (set after joining/creating room) */
  roomCode?: string;
}

/**
 * Props for LandingView component
 */
export interface LandingViewProps {
  /** Current player name input value */
  playerName: string;
  /** Handler for name input changes */
  onNameChange: (name: string) => void;
  /** Handler for create room button */
  onCreateRoom: () => void;
  /** Handler for join room button */
  onJoinRoom: () => void;
  /** Whether room creation is in progress */
  isCreating: boolean;
  /** Error message to display (null if no error) */
  error: string | null;
}

/**
 * Props for NameForm component
 */
export interface NameFormProps {
  /** Current name value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Error message (undefined if no error) */
  error?: string;
  /** Whether form is disabled */
  disabled?: boolean;
}

/**
 * Props for ActionButtons component
 */
export interface ActionButtonsProps {
  /** Handler for create room button */
  onCreateRoom: () => void;
  /** Handler for join room button */
  onJoinRoom: () => void;
  /** Whether buttons should be disabled */
  disabled: boolean;
  /** Whether creation is in progress */
  isCreating: boolean;
}

/**
 * Name validation result
 */
export interface NameValidationResult {
  /** Whether name is valid */
  valid: boolean;
  /** Error message if invalid */
  error?: string;
}

/**
 * Validation rules for player names
 */
export const NAME_VALIDATION = {
  MIN_LENGTH: 2,
  MAX_LENGTH: 20,
  PATTERN: /^[a-zA-Z0-9\s]+$/,
} as const;
