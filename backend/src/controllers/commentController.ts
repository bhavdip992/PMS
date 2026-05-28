import commentService from '../services/commentService.js';

export const createComment = async (req, res, next) => {
  try {
    const comment = await commentService.createComment(req.params.taskId, req.body, req.user._id);
    res.status(201).json({
      status: 'success',
      data: { comment }
    });
  } catch (error) {
    next(error);
  }
};

export const getCommentsForTask = async (req, res, next) => {
  try {
    const comments = await commentService.getCommentsForTask(req.params.taskId);
    res.status(200).json({
      status: 'success',
      results: comments.length,
      data: { comments }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    const result = await commentService.deleteComment(req.params.commentId, req.user._id, req.user.role);
    res.status(200).json({
      status: 'success',
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};
