import Meeting from '../models/meeting.js';
import notificationService from './notificationService.js';
import { AppError } from '../utils/appError.js';

class MeetingService {
  async createMeeting(meetingData, userId) {
    const meeting = await Meeting.create({
      ...meetingData,
      createdBy: userId
    });

    // Notify all attendees (excluding creator)
    if (meeting.attendees && meeting.attendees.length > 0) {
      for (const attendeeId of meeting.attendees) {
        if (attendeeId.toString() !== userId.toString()) {
          try {
            await notificationService.createNotification({
              recipient: attendeeId,
              sender: userId,
              type: 'System',
              title: 'New Meeting Scheduled',
              message: `You are invited to: "${meeting.title}" on ${new Date(meeting.startTime).toLocaleString()}`,
              link: `#/calendar`
            });
          } catch (err) {
            console.error(`Failed to send meeting notification: ${err.message}`);
          }
        }
      }
    }

    return meeting;
  }

  async listMeetings(user) {
    const filter: Record<string, any> = {};
    
    // Non-admins/Super-admins only see meetings they are invited to or created
    if (!['Super Admin', 'Admin'].includes(user.role)) {
      filter.$or = [
        { attendees: user._id },
        { createdBy: user._id }
      ];
    }

    return await Meeting.find(filter)
      .populate('project', 'name')
      .populate('attendees', 'name email avatar role')
      .populate('createdBy', 'name email role')
      .sort('startTime');
  }

  async deleteMeeting(meetingId, user) {
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      throw new AppError('Meeting not found', 404);
    }

    // Only creator or admin/superadmin can delete
    if (meeting.createdBy.toString() !== user._id.toString() && !['Super Admin', 'Admin'].includes(user.role)) {
      throw new AppError('Access denied to delete this meeting', 403);
    }

    await Meeting.findByIdAndDelete(meetingId);
    return { message: 'Meeting successfully deleted' };
  }
}

export default new MeetingService();
