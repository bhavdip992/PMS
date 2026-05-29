import Tag from '../models/tag.js';

export const createTag = async (req: any, res: any, next: any) => {
  try {
    if (req.user?.role !== 'Super Admin') {
      return res.status(403).json({
        status: 'fail',
        message: 'Only Super Admin can predefine tags.'
      });
    }

    const { name, color } = req.body;
    if (!name) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide tag name.'
      });
    }

    const tag = await Tag.create({ name, color });
    res.status(201).json({
      status: 'success',
      data: { tag }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTag = async (req: any, res: any, next: any) => {
  try {
    if (req.user?.role !== 'Super Admin') {
      return res.status(403).json({
        status: 'fail',
        message: 'Only Super Admin can delete tags.'
      });
    }

    const tag = await Tag.findByIdAndDelete(req.params.id);
    if (!tag) {
      return res.status(404).json({
        status: 'fail',
        message: 'Tag not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Tag deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const listTags = async (req: any, res: any, next: any) => {
  try {
    const tags = await Tag.find().sort({ name: 1 });
    res.status(200).json({
      status: 'success',
      results: tags.length,
      data: { tags }
    });
  } catch (error) {
    next(error);
  }
};
