import teamRepository from '../repositories/teamRepository.js';
import { AppError } from '../utils/appError.js';

class TeamService {
  async createTeam(teamData, leaderId) {
    const data = {
      ...teamData,
      leader: leaderId
    };
    if (!data.members) data.members = [];
    if (!data.members.includes(leaderId)) {
      data.members.push(leaderId);
    }
    return await teamRepository.create(data);
  }

  async getTeam(id) {
    const team = await teamRepository.findById(id);
    if (!team) {
      throw new AppError('Team not found', 404);
    }
    return team;
  }

  async updateTeam(id, updateData) {
    const team = await teamRepository.findById(id);
    if (!team) {
      throw new AppError('Team not found', 404);
    }
    return await teamRepository.update(id, updateData);
  }

  async deleteTeam(id) {
    const team = await teamRepository.findById(id);
    if (!team) {
      throw new AppError('Team not found', 404);
    }
    await teamRepository.delete(id);
    return { message: 'Team successfully deleted' };
  }

  async addMember(id, memberId) {
    const team = await teamRepository.findById(id);
    if (!team) {
      throw new AppError('Team not found', 404);
    }
    if (team.members.some(member => member._id.toString() === memberId)) {
      throw new AppError('User is already a member of this team', 400);
    }
    team.members.push(memberId);
    return await teamRepository.update(id, { members: team.members });
  }

  async removeMember(id, memberId) {
    const team = await teamRepository.findById(id);
    if (!team) {
      throw new AppError('Team not found', 404);
    }
    team.members = team.members.filter(member => member._id.toString() !== memberId);
    return await teamRepository.update(id, { members: team.members });
  }

  async listTeams() {
    return await teamRepository.findAll();
  }
}

export default new TeamService();
