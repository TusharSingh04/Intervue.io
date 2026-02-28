import { Server, Socket } from 'socket.io';
import { pollService, participantService, chatService } from '../services';
import {
  SocketEvents,
  CreatePollPayload,
  VotePayload,
  JoinPayload,
  PollStatePayload,
  IParticipant
} from '../types';

export class SocketHandler {
  private io: Server;
  private timerIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(io: Server) {
    this.io = io;
    this.setupPollEndCallback();
  }

  private setupPollEndCallback(): void {
    pollService.setOnPollEnd(async (poll) => {
      // Clear any existing timer interval
      this.clearTimerInterval(poll.id);
      
      // Broadcast poll ended to all clients
      this.io.emit(SocketEvents.POLL_ENDED, {
        poll,
        results: poll.options
      });
    });
  }

  private clearTimerInterval(pollId: string): void {
    const interval = this.timerIntervals.get(pollId);
    if (interval) {
      clearInterval(interval);
      this.timerIntervals.delete(pollId);
    }
  }

  private startTimerBroadcast(pollId: string): void {
    // Clear any existing interval for this poll
    this.clearTimerInterval(pollId);

    const interval = setInterval(async () => {
      const poll = await pollService.getActivePoll();
      
      if (!poll || poll.id !== pollId || !poll.isActive) {
        this.clearTimerInterval(pollId);
        return;
      }

      const remainingTime = pollService.getRemainingTime(poll);
      
      if (remainingTime <= 0) {
        this.clearTimerInterval(pollId);
        return;
      }

      this.io.emit(SocketEvents.TIMER_SYNC, {
        pollId: poll.id,
        remainingTime,
        results: poll.options
      });
    }, 1000);

    this.timerIntervals.set(pollId, interval);
  }

  handleConnection(socket: Socket): void {
    console.log(`Client connected: ${socket.id}`);

    // Handle join
    socket.on(SocketEvents.JOIN, async (payload: JoinPayload) => {
      await this.handleJoin(socket, payload);
    });

    // Handle state request (for recovery)
    socket.on(SocketEvents.REQUEST_STATE, async (data: { participantId?: string }) => {
      await this.handleStateRequest(socket, data.participantId);
    });

    // Handle poll creation
    socket.on(SocketEvents.CREATE_POLL, async (payload: CreatePollPayload) => {
      await this.handleCreatePoll(socket, payload);
    });

    // Handle voting
    socket.on(SocketEvents.VOTE, async (payload: VotePayload) => {
      await this.handleVote(socket, payload);
    });

    // Handle kick student
    socket.on(SocketEvents.KICK_STUDENT, async (data: { participantId: string }) => {
      await this.handleKickStudent(socket, data.participantId);
    });

    // Handle chat message
    socket.on(SocketEvents.SEND_MESSAGE, async (data: { message: string }) => {
      await this.handleChatMessage(socket, data.message);
    });

    // Handle disconnection
    socket.on(SocketEvents.DISCONNECT, async () => {
      await this.handleDisconnect(socket);
    });
  }

  private async handleJoin(socket: Socket, payload: JoinPayload): Promise<void> {
    try {
      const { name, role, participantId } = payload;

      // Check if name is already taken (except for reconnection)
      if (!participantId) {
        const nameTaken = await participantService.isNameTaken(name);
        if (nameTaken) {
          socket.emit(SocketEvents.ERROR, { message: 'Name is already taken' });
          return;
        }
      }

      // Add or update participant
      const participant = await participantService.addParticipant(payload, socket.id);

      // Send confirmation to the joining user
      socket.emit(SocketEvents.PARTICIPANT_JOINED, { participant });

      // Broadcast to all other clients
      socket.broadcast.emit(SocketEvents.UPDATE_PARTICIPANTS, {
        participants: await participantService.getActiveParticipants()
      });

      // Send current poll state if exists
      await this.handleStateRequest(socket, participant.id);

      // Send recent chat messages
      const messages = await chatService.getRecentMessages();
      socket.emit(SocketEvents.NEW_MESSAGE, { messages, isHistory: true });

      console.log(`${role} joined: ${name} (${participant.id})`);
    } catch (error) {
      console.error('Error handling join:', error);
      socket.emit(SocketEvents.ERROR, { message: 'Failed to join' });
    }
  }

  private async handleStateRequest(socket: Socket, participantId?: string): Promise<void> {
    try {
      const poll = await pollService.getActivePoll();
      
      let statePayload: PollStatePayload = {
        poll: null,
        remainingTime: 0,
        hasVoted: false,
        results: []
      };

      if (poll) {
        const remainingTime = pollService.getRemainingTime(poll);
        let hasVoted = false;
        let userVoteOptionId: string | undefined;

        if (participantId) {
          const voteCheck = await pollService.hasUserVoted(poll.id, participantId);
          hasVoted = voteCheck.voted;
          userVoteOptionId = voteCheck.optionId;
        }

        statePayload = {
          poll,
          remainingTime,
          hasVoted,
          userVoteOptionId,
          results: poll.options
        };
      }

      socket.emit(SocketEvents.POLL_STATE, statePayload);

      // Also send participant list
      socket.emit(SocketEvents.UPDATE_PARTICIPANTS, {
        participants: await participantService.getActiveParticipants()
      });
    } catch (error) {
      console.error('Error handling state request:', error);
      socket.emit(SocketEvents.ERROR, { message: 'Failed to get state' });
    }
  }

  private async handleCreatePoll(socket: Socket, payload: CreatePollPayload): Promise<void> {
    try {
      const participant = await participantService.getParticipantBySocketId(socket.id);
      
      if (!participant || participant.role !== 'teacher') {
        socket.emit(SocketEvents.ERROR, { message: 'Only teachers can create polls' });
        return;
      }

      // Check if can create new poll
      const { canCreate, reason } = await pollService.canCreateNewPoll();
      if (!canCreate) {
        socket.emit(SocketEvents.ERROR, { message: reason });
        return;
      }

      const poll = await pollService.createPoll(payload, participant.id);
      const remainingTime = pollService.getRemainingTime(poll);

      // Start timer broadcast
      this.startTimerBroadcast(poll.id);

      // Broadcast to all clients
      this.io.emit(SocketEvents.POLL_CREATED, {
        poll,
        remainingTime
      });

      console.log(`Poll created: ${poll.question}`);
    } catch (error) {
      console.error('Error creating poll:', error);
      socket.emit(SocketEvents.ERROR, { message: 'Failed to create poll' });
    }
  }

  private async handleVote(socket: Socket, payload: VotePayload): Promise<void> {
    try {
      const participant = await participantService.getParticipantBySocketId(socket.id);
      
      if (!participant) {
        socket.emit(SocketEvents.ERROR, { message: 'You must join first' });
        return;
      }

      // Ensure the vote is from the correct participant (prevent spoofing)
      const votePayload: VotePayload = {
        ...payload,
        participantId: participant.id,
        participantName: participant.name
      };

      const result = await pollService.vote(votePayload);

      if (!result.success) {
        socket.emit(SocketEvents.ERROR, { message: result.message });
        return;
      }

      // Confirm vote to the user
      socket.emit(SocketEvents.VOTE_RECEIVED, {
        success: true,
        optionId: payload.optionId
      });

      // Broadcast updated results to all clients
      if (result.poll) {
        this.io.emit(SocketEvents.POLL_RESULTS, {
          pollId: result.poll.id,
          results: result.poll.options
        });
      }

      console.log(`Vote received from ${participant.name}`);
    } catch (error) {
      console.error('Error handling vote:', error);
      socket.emit(SocketEvents.ERROR, { message: 'Failed to record vote' });
    }
  }

  private async handleKickStudent(socket: Socket, participantId: string): Promise<void> {
    try {
      const teacher = await participantService.getParticipantBySocketId(socket.id);
      
      if (!teacher || teacher.role !== 'teacher') {
        socket.emit(SocketEvents.ERROR, { message: 'Only teachers can kick students' });
        return;
      }

      const kicked = await participantService.kickParticipant(participantId);
      
      if (kicked) {
        // Notify the kicked student
        this.io.to(kicked.socketId).emit(SocketEvents.KICKED, {
          message: 'You have been removed from the session'
        });

        // Broadcast updated participant list
        this.io.emit(SocketEvents.UPDATE_PARTICIPANTS, {
          participants: await participantService.getActiveParticipants()
        });

        console.log(`Student kicked: ${kicked.name}`);
      }
    } catch (error) {
      console.error('Error kicking student:', error);
      socket.emit(SocketEvents.ERROR, { message: 'Failed to kick student' });
    }
  }

  private async handleChatMessage(socket: Socket, message: string): Promise<void> {
    try {
      const participant = await participantService.getParticipantBySocketId(socket.id);
      
      if (!participant) {
        socket.emit(SocketEvents.ERROR, { message: 'You must join first' });
        return;
      }

      const chatMessage = await chatService.addMessage(
        participant.id,
        participant.name,
        participant.role,
        message
      );

      // Broadcast to all clients
      this.io.emit(SocketEvents.NEW_MESSAGE, { message: chatMessage });

      console.log(`Chat message from ${participant.name}: ${message}`);
    } catch (error) {
      console.error('Error handling chat message:', error);
      socket.emit(SocketEvents.ERROR, { message: 'Failed to send message' });
    }
  }

  private async handleDisconnect(socket: Socket): Promise<void> {
    try {
      const participant = await participantService.removeParticipant(socket.id);
      
      if (participant) {
        // Broadcast updated participant list
        this.io.emit(SocketEvents.UPDATE_PARTICIPANTS, {
          participants: await participantService.getActiveParticipants()
        });

        console.log(`Client disconnected: ${participant.name}`);
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  }
}
