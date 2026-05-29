import departmentService from '../services/departmentService.js';

export const createDepartment = async (req: any, res: any, next: any) => {
  try {
    const department = await departmentService.createDepartment(req.body);
    res.status(201).json({
      status: 'success',
      data: { department }
    });
  } catch (error) {
    next(error);
  }
};

export const getDepartment = async (req: any, res: any, next: any) => {
  try {
    const department = await departmentService.getDepartment(req.params.id);
    res.status(200).json({
      status: 'success',
      data: { department }
    });
  } catch (error) {
    next(error);
  }
};

export const updateDepartment = async (req: any, res: any, next: any) => {
  try {
    const department = await departmentService.updateDepartment(req.params.id, req.body);
    res.status(200).json({
      status: 'success',
      data: { department }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDepartment = async (req: any, res: any, next: any) => {
  try {
    const result = await departmentService.deleteDepartment(req.params.id);
    res.status(200).json({
      status: 'success',
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

export const listDepartments = async (req: any, res: any, next: any) => {
  try {
    const { items, total } = await departmentService.listDepartments();
    res.status(200).json({
      status: 'success',
      results: items.length,
      total,
      data: { departments: items }
    });
  } catch (error) {
    next(error);
  }
};
