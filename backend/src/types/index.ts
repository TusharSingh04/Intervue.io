// Poll Types
export interface IPollOption {
  id: string;
  text: string;
  votes: number;
  isCorrect?: boolean;
}

export interface IPoll {
  _id?: unknown;
  id: string;
  question: string;
  options: IPollOption[];
  duration: number; // in seconds
  startTime: Date | null;
  endTime: Date | null;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVote {
  _id?: unknown;
  pollId: string;
  optionId: string;
  participantId: string;
  participantName: string;
  votedAt: Date;
}

export interface IParticipant {
  _id?: unknown;
  id: string;
  name: string;
  socketId: string;
  role: 'teacher' | 'student';
  joinedAt: Date;
  isActive: boolean;
}

// Socket Event Types
export interface CreatePollPayload {
  question: string;
  options: Array<{ text: string; isCorrect: boolean }> | string[];
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

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'teacher' | 'student';
  message: string;
  timestamp: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Socket Events
export enum SocketEvents {
  // Connection
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  
  // Participant
  JOIN = 'join',
  PARTICIPANT_JOINED = 'participant_joined',
  PARTICIPANT_LEFT = 'participant_left',
  UPDATE_PARTICIPANTS = 'update_participants',
  KICK_STUDENT = 'kick_student',
  KICKED = 'kicked',
  
  // Poll
  CREATE_POLL = 'create_poll',
  POLL_CREATED = 'poll_created',
  POLL_STATE = 'poll_state',
  VOTE = 'vote',
  VOTE_RECEIVED = 'vote_received',
  POLL_RESULTS = 'poll_results',
  POLL_ENDED = 'poll_ended',
  TIMER_SYNC = 'timer_sync',
  REQUEST_STATE = 'request_state',
  
  // Chat
  SEND_MESSAGE = 'send_message',
  NEW_MESSAGE = 'new_message',
  
  // Error
  ERROR = 'error'
}
