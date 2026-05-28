import communicationRepository from '../repositories/communicationRepository.js';
import { AppError } from '../utils/appError.js';

class CommunicationService {
  async logCommunication(data, userId) {
    const logData = {
      ...data,
      createdBy: userId
    };
    return await communicationRepository.create(logData);
  }

  async getCommunication(id) {
    const log = await communicationRepository.findById(id);
    if (!log) {
      throw new AppError('Communication log not found', 404);
    }
    return log;
  }

  async listCommunications(query) {
    const filter: Record<string, any> = {};
    if (query.project) {
      filter.project = query.project;
    }
    if (query.task) {
      filter.task = query.task;
    }
    if (query.type) {
      filter.type = query.type;
    }
    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { details: { $regex: query.search, $options: 'i' } }
      ];
    }

    const options = {
      page: parseInt(query.page, 10) || 1,
      limit: parseInt(query.limit, 10) || 10,
      sort: query.sort || '-date'
    };

    return await communicationRepository.findAll(filter, options);
  }

  async deleteCommunication(id) {
    const log = await communicationRepository.findById(id);
    if (!log) {
      throw new AppError('Communication log not found', 404);
    }
    await communicationRepository.delete(id);
    return { message: 'Communication log successfully deleted' };
  }
}

export default new CommunicationService();
