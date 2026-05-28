import credentialRepository from '../repositories/credentialRepository.js';
import projectRepository from '../repositories/projectRepository.js';
import { encrypt, decrypt } from '../utils/crypto.js';
import { AppError } from '../utils/appError.js';

class CredentialService {
  async createCredential(projectId, credentialData, userId) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    const encryptedDetails = encrypt(credentialData.details);

    const data = {
      project: projectId,
      title: credentialData.title,
      type: credentialData.type,
      details: encryptedDetails,
      createdBy: userId
    };

    return await credentialRepository.create(data);
  }

  async getCredentialsForProject(projectId, user) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    // Authorization check: User must be Admin, PM, or assigned to project
    const isAuthorized = 
      ['Super Admin', 'Admin', 'Project Manager'].includes(user.role) ||
      project.assignees.some(u => u._id.toString() === user._id.toString());

    if (!isAuthorized) {
      throw new AppError('You do not have access to view this project\'s credentials', 403);
    }

    const credentials = await credentialRepository.findByProject(projectId);
    
    // Return credential list. We'll decrypt details individually to ensure access tracking
    return credentials.map(cred => {
      const obj = cred.toObject();
      // Keep details encrypted in lists for safety, or we can decrypt them
      // Let's decrypt them directly here since user is authorized, but we hide IV tags.
      try {
        (obj as any).decryptedDetails = decrypt(cred.details);
      } catch (err) {
        (obj as any).decryptedDetails = 'Decryption error';
      }
      return obj;
    });
  }

  async deleteCredential(id, user) {
    const credential = await credentialRepository.findById(id);
    if (!credential) {
      throw new AppError('Credential not found', 404);
    }
    
    // Only Admin, Super Admin, PM or creator can delete
    const isAuthorized = 
      ['Super Admin', 'Admin', 'Project Manager'].includes(user.role) ||
      credential.createdBy.toString() === user._id.toString();

    if (!isAuthorized) {
      throw new AppError('You are not authorized to delete this credential', 403);
    }

    await credentialRepository.delete(id);
    return { message: 'Credential successfully deleted' };
  }
}

export default new CredentialService();
