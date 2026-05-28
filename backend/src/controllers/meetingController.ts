import meetingService from '../services/meetingService.js';

export const createMeeting = async (req, res, next) => {
  try {
    const meeting = await meetingService.createMeeting(req.body, req.user._id);
    res.status(201).json({
      status: 'success',
      data: { meeting }
    });
  } catch (error) {
    next(error);
  }
};

export const listMeetings = async (req, res, next) => {
  try {
    const meetings = await meetingService.listMeetings(req.user);
    res.status(200).json({
      status: 'success',
      results: meetings.length,
      data: { meetings }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMeeting = async (req, res, next) => {
  try {
    const result = await meetingService.deleteMeeting(req.params.id, req.user);
    res.status(200).json({
      status: 'success',
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};
