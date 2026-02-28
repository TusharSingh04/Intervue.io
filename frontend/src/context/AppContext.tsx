import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { AppState, AppAction, IParticipant, IPoll, ChatMessage, IPollOption } from '../types';

const initialState: AppState = {
  participant: null,
  poll: null,
  remainingTime: 0,
  hasVoted: false,
  userVoteOptionId: undefined,
  participants: [],
  messages: [],
  isConnected: false,
  isJoined: false,
  isKicked: false,
  error: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_PARTICIPANT':
      return { ...state, participant: action.payload };
    case 'SET_POLL':
      return { 
        ...state, 
        poll: action.payload,
        hasVoted: action.payload ? state.hasVoted : false,
        userVoteOptionId: action.payload ? state.userVoteOptionId : undefined
      };
    case 'SET_REMAINING_TIME':
      return { ...state, remainingTime: action.payload };
    case 'SET_HAS_VOTED':
      return { 
        ...state, 
        hasVoted: action.payload.hasVoted,
        userVoteOptionId: action.payload.optionId 
      };
    case 'SET_PARTICIPANTS':
      return { ...state, participants: action.payload };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };
    case 'SET_JOINED':
      return { ...state, isJoined: action.payload };
    case 'SET_KICKED':
      return { ...state, isKicked: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'UPDATE_POLL_RESULTS':
      if (!state.poll) return state;
      return {
        ...state,
        poll: { ...state.poll, options: action.payload }
      };
    case 'RESET_STATE':
      return { ...initialState, isConnected: state.isConnected, isKicked: state.isKicked };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  setParticipant: (participant: IParticipant) => void;
  setPoll: (poll: IPoll | null) => void;
  setRemainingTime: (time: number) => void;
  setHasVoted: (hasVoted: boolean, optionId?: string) => void;
  setParticipants: (participants: IParticipant[]) => void;
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setConnected: (connected: boolean) => void;
  setJoined: (joined: boolean) => void;
  setKicked: (kicked: boolean) => void;
  setError: (error: string | null) => void;
  updatePollResults: (results: IPollOption[]) => void;
  resetState: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const value: AppContextType = {
    state,
    dispatch,
    setParticipant: (participant) => dispatch({ type: 'SET_PARTICIPANT', payload: participant }),
    setPoll: (poll) => dispatch({ type: 'SET_POLL', payload: poll }),
    setRemainingTime: (time) => dispatch({ type: 'SET_REMAINING_TIME', payload: time }),
    setHasVoted: (hasVoted, optionId) => dispatch({ type: 'SET_HAS_VOTED', payload: { hasVoted, optionId } }),
    setParticipants: (participants) => dispatch({ type: 'SET_PARTICIPANTS', payload: participants }),
    addMessage: (message) => dispatch({ type: 'ADD_MESSAGE', payload: message }),
    setMessages: (messages) => dispatch({ type: 'SET_MESSAGES', payload: messages }),
    setConnected: (connected) => dispatch({ type: 'SET_CONNECTED', payload: connected }),
    setJoined: (joined) => dispatch({ type: 'SET_JOINED', payload: joined }),
    setKicked: (kicked) => dispatch({ type: 'SET_KICKED', payload: kicked }),
    setError: (error) => dispatch({ type: 'SET_ERROR', payload: error }),
    updatePollResults: (results) => dispatch({ type: 'UPDATE_POLL_RESULTS', payload: results }),
    resetState: () => dispatch({ type: 'RESET_STATE' }),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
