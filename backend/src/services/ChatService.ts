import { v4 as uuidv4 } from 'uuid';
import { ChatMessageModel } from '../models';
import { ChatMessage } from '../types';
import { isDBConnected } from '../config/database';

// In-memory store for chat messages
const chatMessages: ChatMessage[] = [];
const MAX_MESSAGES = 100;

class ChatService {
  async addMessage(
    senderId: string,
    senderName: string,
    senderRole: 'teacher' | 'student',
    message: string
  ): Promise<ChatMessage> {
    const chatMessage: ChatMessage = {
      id: uuidv4(),
      senderId,
      senderName,
      senderRole,
      message,
      timestamp: new Date()
    };

    // Store in memory
    chatMessages.push(chatMessage);
    if (chatMessages.length > MAX_MESSAGES) {
      chatMessages.shift();
    }

    if (isDBConnected()) {
      try {
        const dbMessage = new ChatMessageModel(chatMessage);
        await dbMessage.save();
      } catch (error) {
        console.error('Error saving chat message to DB:', error);
      }
    }

    return chatMessage;
  }

  async getRecentMessages(limit: number = 50): Promise<ChatMessage[]> {
    if (isDBConnected()) {
      try {
        const messages = await ChatMessageModel.find()
          .sort({ timestamp: -1 })
          .limit(limit);
        return messages.map(m => ({
          id: m.id,
          senderId: m.senderId,
          senderName: m.senderName,
          senderRole: m.senderRole,
          message: m.message,
          timestamp: m.timestamp
        })).reverse();
      } catch (error) {
        console.error('Error getting messages from DB:', error);
      }
    }

    // Return in-memory messages
    return chatMessages.slice(-limit);
  }

  async clearMessages(): Promise<void> {
    chatMessages.length = 0;

    if (isDBConnected()) {
      try {
        await ChatMessageModel.deleteMany({});
      } catch (error) {
        console.error('Error clearing messages from DB:', error);
      }
    }
  }
}

export const chatService = new ChatService();
