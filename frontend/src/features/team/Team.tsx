import React, { useState, useEffect } from 'react';
import api from '../../services/api.tsx';
import { Users, UserPlus, Mail, ShieldAlert } from 'lucide-react';

export default function Team() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users');
      setMembers(response.data.data.users || []);
    } catch (err) {
      console.error('Failed to load team list', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-100 flex items-center space-x-2">
            <Users className="text-violet-400" />
            <span>Workspace Team</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">View internal developers, designers, product managers, and workspace roles.</p>
        </div>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.length === 0 ? (
          <div className="col-span-full bg-slate-900 border border-slate-800 p-12 rounded-2xl text-center text-slate-500 text-sm">
            No team members registered yet.
          </div>
        ) : (
          members.map((member) => (
            <div key={member._id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center space-x-4 hover:border-slate-700/80 transition-colors">
              <div className="w-12 h-12 rounded-full bg-violet-600/10 border border-violet-500/30 flex items-center justify-center font-bold text-violet-300 text-lg">
                {member.name?.charAt(0).toUpperCase()}
              </div>

              <div className="space-y-1">
                <h3 className="text-xs font-bold text-slate-200">{member.name}</h3>
                
                <div className="flex items-center space-x-1 text-[10px] text-slate-500">
                  <Mail size={10} />
                  <span>{member.email}</span>
                </div>

                <span className={`inline-block text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  ['Super Admin', 'Admin'].includes(member.role) ? 'bg-red-500/10 text-red-400' :
                  member.role === 'Project Manager' ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-800 text-slate-400'
                }`}>
                  {member.role}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
