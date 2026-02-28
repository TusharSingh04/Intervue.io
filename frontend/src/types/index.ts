// Poll Types
export interface IPollOption {
  id: string;
  text: string;
  votes: number;
  isCorrect?: boolean;
}

export interface IPoll {
  _id?: string;
  id: string;
  question: string;
  options: IPollOption[];
  duration: number;
  startTime: Date | string | null;
  endTime: Date | string | null;
  isActive: boolean;
  createdBy: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IVote {
  pollId: string;
  optionId: string;
  participantId: string;
  participantName: string;
  votedAt: Date | string;
}

export interface IParticipant {
  id: string;
  name: string;
  socketId: string;
  role: 'teacher' | 'student';
  joinedAt: Date | string;
  isActive: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'teacher' | 'student';
  message: string;
  timestamp: Date | string;
}

// Payloads
export interface CreatePollPayload {
  question: string;
  options: Array<{ text: string; isCorrect: boolean }>;
  duration: number;
}

export interface VotePayload {
  pollId: string;
  optionId: string;
  participantId: string;
  participantName: string;
}

export interface JoinPayload {
  name: string;
  role: 'teacher' | 'student';
  participantId?: string;
}

export interface PollStatePayload {
  poll: IPoll | null;
  remainingTime: number;
  hasVoted: boolean;
  userVoteOptionId?: string;
  results: IPollOption[];
}

// Socket Events
export enum SocketEvents {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  JOIN = 'join',
  PARTICIPANT_JOINED = 'participant_joined',
  PARTICIPANT_LEFT = 'participant_left',
  UPDATE_PARTICIPANTS = 'update_participants',
  KICK_STUDENT = 'kick_student',
  KICKED = 'kicked',
  CREATE_POLL = 'create_poll',
  POLL_CREATED = 'poll_created',
  POLL_STATE = 'poll_state',
  VOTE = 'vote',
  VOTE_RECEIVED = 'vote_received',
  POLL_RESULTS = 'poll_results',
  POLL_ENDED = 'poll_ended',
  TIMER_SYNC = 'timer_sync',
  REQUEST_STATE = 'request_state',
  SEND_MESSAGE = 'send_message',
  NEW_MESSAGE = 'new_message',
  ERROR = 'error'
}

// Context Types
export interface AppState {
  participant: IParticipant | null;
  poll: IPoll | null;
  remainingTime: number;
  hasVoted: boolean;
  userVoteOptionId?: string;
  participants: IParticipant[];
  messages: ChatMessage[];
  isConnected: boolean;
  isJoined: boolean;
  isKicked: boolean;
  error: string | null;
}

export type AppAction =
  | { type: 'SET_PARTICIPANT'; payload: IParticipant }
  | { type: 'SET_POLL'; payload: IPoll | null }
  | { type: 'SET_REMAINING_TIME'; payload: number }
  | { type: 'SET_HAS_VOTED'; payload: { hasVoted: boolean; optionId?: string } }
  | { type: 'SET_PARTICIPANTS'; payload: IParticipant[] }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_MESSAGES'; payload: ChatMessage[] }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_JOINED'; payload: boolean }
  | { type: 'SET_KICKED'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_POLL_RESULTS'; payload: IPollOption[] }
  | { type: 'RESET_STATE' };
