import { v4 as uuidv4 } from 'uuid';
import { Participant } from '../models';
import { IParticipant, JoinPayload } from '../types';
import { isDBConnected } from '../config/database';

// In-memory store for active participants
const activeParticipants: Map<string, IParticipant> = new Map();

class ParticipantService {
  async addParticipant(payload: JoinPayload, socketId: string): Promise<IParticipant> {
    const { name, role, participantId } = payload;
    
    // Use existing ID or generate new one (for reconnection)
    const id = participantId || uuidv4();
    
    const participant: IParticipant = {
      id,
      name,
      socketId,
      role,
      joinedAt: new Date(),
      isActive: true
    };

    // Store in memory for quick access
    activeParticipants.set(id, participant);

    if (isDBConnected()) {
      try {
        // Upsert participant
        await Participant.findOneAndUpdate(
          { id },
          { ...participant },
          { upsert: true, new: true }
        );
      } catch (error) {
        console.error('Error saving participant to DB:', error);
      }
    }

    return participant;
  }

  async removeParticipant(socketId: string): Promise<IParticipant | null> {
    // Find participant by socket ID
    let removedParticipant: IParticipant | null = null;

    for (const [id, participant] of activeParticipants.entries()) {
      if (participant.socketId === socketId) {
        participant.isActive = false;
        removedParticipant = participant;
        activeParticipants.delete(id);
        break;
      }
    }

    if (isDBConnected() && removedParticipant) {
      try {
        await Participant.findOneAndUpdate(
          { id: removedParticipant.id },
          { isActive: false }
        );
      } catch (error) {
        console.error('Error updating participant in DB:', error);
      }
    }

    return removedParticipant;
  }

  async kickParticipant(participantId: string): Promise<IParticipant | null> {
    const participant = activeParticipants.get(participantId);
    
    if (participant) {
      participant.isActive = false;
      activeParticipants.delete(participantId);

      if (isDBConnected()) {
        try {
          await Participant.findOneAndUpdate(
            { id: participantId },
            { isActive: false }
          );
        } catch (error) {
          console.error('Error kicking participant in DB:', error);
        }
      }

      return participant;
    }

    return null;
  }

  async getParticipantById(id: string): Promise<IParticipant | null> {
    // Check in-memory first
    const memParticipant = activeParticipants.get(id);
    if (memParticipant) return memParticipant;

    if (isDBConnected()) {
      try {
        const participant = await Participant.findOne({ id });
        if (participant) {
          return participant.toObject() as unknown as IParticipant;
        }
      } catch (error) {
        console.error('Error getting participant from DB:', error);
      }
    }

    return null;
  }

  async getParticipantBySocketId(socketId: string): Promise<IParticipant | null> {
    for (const participant of activeParticipants.values()) {
      if (participant.socketId === socketId) {
        return participant;
      }
    }

    if (isDBConnected()) {
      try {
        const participant = await Participant.findOne({ socketId, isActive: true });
        if (participant) {
          return participant.toObject() as unknown as IParticipant;
        }
      } catch (error) {
        console.error('Error getting participant by socket ID:', error);
      }
    }

    return null;
  }

  async getActiveParticipants(): Promise<IParticipant[]> {
    return Array.from(activeParticipants.values());
  }

  async getActiveStudents(): Promise<IParticipant[]> {
    return Array.from(activeParticipants.values()).filter(p => p.role === 'student');
  }

  async getActiveTeachers(): Promise<IParticipant[]> {
    return Array.from(activeParticipants.values()).filter(p => p.role === 'teacher');
  }

  async updateSocketId(participantId: string, newSocketId: string): Promise<IParticipant | null> {
    const participant = activeParticipants.get(participantId);
    
    if (participant) {
      participant.socketId = newSocketId;
      participant.isActive = true;
      activeParticipants.set(participantId, participant);

      if (isDBConnected()) {
        try {
          await Participant.findOneAndUpdate(
            { id: participantId },
            { socketId: newSocketId, isActive: true }
          );
        } catch (error) {
          console.error('Error updating socket ID in DB:', error);
        }
      }

      return participant;
    }

    return null;
  }

  async isNameTaken(name: string, excludeId?: string): Promise<boolean> {
    for (const participant of activeParticipants.values()) {
      if (participant.name.toLowerCase() === name.toLowerCase() && participant.id !== excludeId) {
        return true;
      }
    }
    return false;
  }

  getParticipantCount(): number {
    return activeParticipants.size;
  }

  getStudentCount(): number {
    return Array.from(activeParticipants.values()).filter(p => p.role === 'student').length;
  }
}

export const participantService = new ParticipantService();
