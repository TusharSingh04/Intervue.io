import { User, Crown, UserX } from 'lucide-react';
import { Card, CardHeader } from '../common';
import { IParticipant } from '../../types';

interface ParticipantListProps {
  participants: IParticipant[];
  currentUserId?: string;
  isTeacher?: boolean;
  onKickStudent?: (participantId: string) => void;
}

export function ParticipantList({
  participants,
  currentUserId,
  isTeacher = false,
  onKickStudent
}: ParticipantListProps) {
  const teachers = participants.filter(p => p.role === 'teacher');
  const students = participants.filter(p => p.role === 'student');

  return (
    <Card>
      <CardHeader 
        title="Participants" 
        subtitle={`${participants.length} online`}
      />

      <div className="space-y-4">
        {/* Teachers */}
        {teachers.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Teachers ({teachers.length})
            </h4>
            <div className="space-y-2">
              {teachers.map((teacher) => (
                <div
                  key={teacher.id}
                  className={`flex items-center gap-3 p-2 rounded-lg ${
                    teacher.id === currentUserId ? 'bg-primary-50' : 'bg-gray-50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center">
                    <Crown size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {teacher.name}
                      {teacher.id === currentUserId && (
                        <span className="ml-1 text-xs text-primary-600">(You)</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">Teacher</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Students */}
        {students.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Students ({students.length})
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {students.map((student) => (
                <div
                  key={student.id}
                  className={`flex items-center gap-3 p-2 rounded-lg ${
                    student.id === currentUserId ? 'bg-primary-50' : 'bg-gray-50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-gray-400 text-white flex items-center justify-center">
                    <User size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {student.name}
                      {student.id === currentUserId && (
                        <span className="ml-1 text-xs text-primary-600">(You)</span>
                      )}
                    </p>
                  </div>
                  {isTeacher && student.id !== currentUserId && onKickStudent && (
                    <button
                      onClick={() => onKickStudent(student.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove student"
                    >
                      <UserX size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {students.length === 0 && (
          <div className="text-center py-4 text-gray-400">
            <User size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No students have joined yet</p>
          </div>
        )}
      </div>
    </Card>
  );
}
