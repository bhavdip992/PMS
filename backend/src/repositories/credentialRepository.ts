import { QueryOptions } from '../types/index.js';
import Credential from '../models/credential.js';

class CredentialRepository {
  async create(data) {
    return await Credential.create(data);
  }

  async findById(id) {
    return await Credential.findById(id);
  }

  async findByProject(projectId: string, options: QueryOptions = {}) {
    return await Credential.find({ project: projectId }).populate('createdBy', 'name email role');
  }

  async delete(id) {
    return await Credential.findByIdAndDelete(id);
  }
}

export default new CredentialRepository();
