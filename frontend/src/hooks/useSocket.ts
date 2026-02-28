import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAppContext } from '../context/AppContext';
import {
  SocketEvents,
  CreatePollPayload,
  VotePayload,
  JoinPayload,
  IParticipant,
  IPoll,
  ChatMessage,
  IPollOption,
  PollStatePayload
} from '../types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const {
    state,
    setParticipant,
    setPoll,
    setRemainingTime,
    setHasVoted,
    setParticipants,
    addMessage,
    setMessages,
    setConnected,
    setJoined,
    setKicked,
    setError,
    updatePollResults,
    resetState
  } = useAppContext();

  // Initialize socket connection
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // Connection events
    socket.on(SocketEvents.CONNECT, () => {
      console.log('Connected to server');
      setConnected(true);
      setError(null);

      // Request state recovery if we have a participant ID stored
      const storedParticipantId = sessionStorage.getItem('participantId');
      if (storedParticipantId) {
        socket.emit(SocketEvents.REQUEST_STATE, { participantId: storedParticipantId });
      }
    });

    socket.on(SocketEvents.DISCONNECT, () => {
      console.log('Disconnected from server');
      setConnected(false);
      toast.error('Connection lost. Reconnecting...');
    });

    // Participant events
    socket.on(SocketEvents.PARTICIPANT_JOINED, (data: { participant: IParticipant }) => {
      setParticipant(data.participant);
      setJoined(true);
      sessionStorage.setItem('participantId', data.participant.id);
      sessionStorage.setItem('participantName', data.participant.name);
      sessionStorage.setItem('participantRole', data.participant.role);
      toast.success('Successfully joined!');
    });

    socket.on(SocketEvents.UPDATE_PARTICIPANTS, (data: { participants: IParticipant[] }) => {
      setParticipants(data.participants);
    });

    socket.on(SocketEvents.KICKED, (data: { message: string }) => {
      toast.error(data.message);
      sessionStorage.clear();
      setKicked(true);
      resetState();
      setJoined(false);
    });

    // Poll events
    socket.on(SocketEvents.POLL_STATE, (data: PollStatePayload) => {
      setPoll(data.poll);
      setRemainingTime(data.remainingTime);
      setHasVoted(data.hasVoted, data.userVoteOptionId);
    });

    socket.on(SocketEvents.POLL_CREATED, (data: { poll: IPoll; remainingTime: number }) => {
      setPoll(data.poll);
      setRemainingTime(data.remainingTime);
      setHasVoted(false);
      toast.success('New poll started!');
    });

    socket.on(SocketEvents.VOTE_RECEIVED, (data: { success: boolean; optionId: string }) => {
      if (data.success) {
        setHasVoted(true, data.optionId);
        toast.success('Vote submitted!');
      }
    });

    socket.on(SocketEvents.POLL_RESULTS, (data: { pollId: string; results: IPollOption[] }) => {
      updatePollResults(data.results);
    });

    socket.on(SocketEvents.POLL_ENDED, (data: { poll: IPoll; results: IPollOption[] }) => {
      setPoll({ ...data.poll, isActive: false });
      updatePollResults(data.results);
      setRemainingTime(0);
      toast('Poll has ended!', { icon: '⏱️' });
    });

    socket.on(SocketEvents.TIMER_SYNC, (data: { pollId: string; remainingTime: number; results: IPollOption[] }) => {
      setRemainingTime(data.remainingTime);
      updatePollResults(data.results);
    });

    // Chat events
    socket.on(SocketEvents.NEW_MESSAGE, (data: { message?: ChatMessage; messages?: ChatMessage[]; isHistory?: boolean }) => {
      if (data.isHistory && data.messages) {
        setMessages(data.messages);
      } else if (data.message) {
        addMessage(data.message);
      }
    });

    // Error handling
    socket.on(SocketEvents.ERROR, (data: { message: string }) => {
      setError(data.message);
      toast.error(data.message);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Join session
  const join = useCallback((payload: JoinPayload) => {
    if (socketRef.current) {
      socketRef.current.emit(SocketEvents.JOIN, payload);
    }
  }, []);

  // Create poll (teacher only)
  const createPoll = useCallback((payload: CreatePollPayload) => {
    if (socketRef.current) {
      socketRef.current.emit(SocketEvents.CREATE_POLL, payload);
    }
  }, []);

  // Submit vote
  const vote = useCallback((pollId: string, optionId: string) => {
    if (socketRef.current && state.participant) {
      const payload: VotePayload = {
        pollId,
        optionId,
        participantId: state.participant.id,
        participantName: state.participant.name
      };
      socketRef.current.emit(SocketEvents.VOTE, payload);
    }
  }, [state.participant]);

  // Kick student (teacher only)
  const kickStudent = useCallback((participantId: string) => {
    if (socketRef.current) {
      socketRef.current.emit(SocketEvents.KICK_STUDENT, { participantId });
    }
  }, []);

  // Send chat message
  const sendMessage = useCallback((message: string) => {
    if (socketRef.current) {
      socketRef.current.emit(SocketEvents.SEND_MESSAGE, { message });
    }
  }, []);

  // Request current state (for recovery)
  const requestState = useCallback(() => {
    if (socketRef.current) {
      const participantId = sessionStorage.getItem('participantId');
      socketRef.current.emit(SocketEvents.REQUEST_STATE, { participantId });
    }
  }, []);

  // Rejoin after reconnection
  const rejoin = useCallback(() => {
    const storedName = sessionStorage.getItem('participantName');
    const storedRole = sessionStorage.getItem('participantRole') as 'teacher' | 'student';
    const storedId = sessionStorage.getItem('participantId');

    if (storedName && storedRole && socketRef.current) {
      socketRef.current.emit(SocketEvents.JOIN, {
        name: storedName,
        role: storedRole,
        participantId: storedId
      });
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected: state.isConnected,
    join,
    createPoll,
    vote,
    kickStudent,
    sendMessage,
    requestState,
    rejoin
  };
}
