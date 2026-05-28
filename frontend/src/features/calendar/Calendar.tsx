import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import api from '../../services/api.tsx';
import { useAuthStore } from '../../store/useAuthStore.tsx';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, MapPin, Clock, Users, Link as LinkIcon, Trash2 } from 'lucide-react';
import Modal from '../../components/Modal.tsx';
const generateTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let min of ['00', '30']) {
      const hStr = hour.toString().padStart(2, '0');
      const timeStr = `${hStr}:${min}`;
      
      const period = hour >= 12 ? 'PM' : 'AM';
      let displayHour = hour % 12;
      if (displayHour === 0) displayHour = 12;
      const displayStr = `${displayHour.toString().padStart(2, '0')}:${min} ${period}`;
      
      options.push({ value: timeStr, label: displayStr });
    }
  }
  return options;
};
const timeOptions = generateTimeOptions();

export default function Calendar() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [meetings, setMeetings] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Scheduling meeting states
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [project, setProject] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTimeSelect, setStartTimeSelect] = useState('09:00');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [endTimeSelect, setEndTimeSelect] = useState('10:00');
  const [meetingLink, setMeetingLink] = useState('');
  const [selectedAttendees, setSelectedAttendees] = useState([]);

  // Meeting detail states
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate]);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const [meetingsRes, tasksRes, usersRes, projectsRes] = await Promise.all([
        api.get('/meetings'),
        api.get(`/tasks?assignee=${user._id}`),
        api.get('/users'),
        api.get('/projects')
      ]);

      setMeetings(meetingsRes.data.data.meetings || []);
      setTasks(tasksRes.data.data.tasks || []);
      setProjects(projectsRes.data.data.projects || []);

      const activeUsers = (usersRes.data.data.users || []).filter(u => u.isActive !== false);
      setTeamMembers(activeUsers);
    } catch (err) {
      console.error('Failed to fetch calendar data', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToggleAttendee = (userId) => {
    setSelectedAttendees(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleScheduleMeeting = async (e) => {
    e.preventDefault();
    if (!title || !startDate || !startTimeSelect || !endDate || !endTimeSelect || !meetingLink) return;

    try {
      const payload = {
        title,
        description,
        project: project || undefined,
        startTime: `${startDate}T${startTimeSelect}:00`,
        endTime: `${endDate}T${endTimeSelect}:00`,
        meetingLink,
        attendees: selectedAttendees
      };

      await api.post('/meetings', payload);
      setScheduleModalOpen(false);

      // Reset form
      setTitle('');
      setDescription('');
      setProject('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setStartTimeSelect('09:00');
      setEndDate(new Date().toISOString().split('T')[0]);
      setEndTimeSelect('10:00');
      setMeetingLink('');
      setSelectedAttendees([]);

      alert('Meeting scheduled and invites sent!');
      fetchCalendarData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to schedule meeting');
    }
  };

  const handleDeleteMeeting = async (meetingId) => {
    if (!window.confirm('Are you sure you want to cancel this meeting?')) return;
    try {
      await api.delete(`/meetings/${meetingId}`);
      setDetailModalOpen(false);
      setActiveMeeting(null);
      alert('Meeting cancelled successfully');
      fetchCalendarData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel meeting');
    }
  };

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysGrid = [];
  // Padding for previous month days
  for (let i = 0; i < firstDayOfMonth; i++) {
    daysGrid.push(null);
  }
  // Days of current month
  for (let i = 1; i <= daysInMonth; i++) {
    daysGrid.push(new Date(year, month, i));
  }

  const getDayItems = (date) => {
    if (!date) return { dayTasks: [], dayMeetings: [] };
    const dateStr = date.toDateString();

    const dayTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate).toDateString() === dateStr);
    const dayMeetings = meetings.filter(m => m.startTime && new Date(m.startTime).toDateString() === dateStr);

    return { dayTasks, dayMeetings };
  };

  const handleOpenMeetingDetail = (e, m) => {
    e.stopPropagation();
    setActiveMeeting(m);
    setDetailModalOpen(true);
  };

  const handleOpenTaskDetail = (e, taskId) => {
    e.stopPropagation();
    navigate('/tasks/' + taskId);
  };

  const isAdminOrManager = ['Super Admin', 'Admin', 'Project Manager'].includes(user.role);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-100 flex items-center space-x-2">
            <CalendarIcon className="text-violet-400" />
            <span>Workspace Calendar</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Keep track of project milestones, task due dates, and schedule sync meetings.</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-1 flex items-center space-x-2">
            <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-850 rounded text-slate-400 hover:text-white transition-colors">
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold text-slate-200 px-2 min-w-32 text-center uppercase tracking-wider">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={handleNextMonth} className="p-1 hover:bg-slate-850 rounded text-slate-400 hover:text-white transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>

          {isAdminOrManager && (
            <button
              onClick={() => setScheduleModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
            >
              <Plus size={14} />
              <span>Schedule Sync</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 overflow-hidden shadow-2xl">
          {/* Days labels */}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-800/60">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Monthly Day Grid */}
          <div className="grid grid-cols-7 gap-2 min-h-[450px]">
            {daysGrid.map((date, idx) => {
              const { dayTasks, dayMeetings } = getDayItems(date);
              const isToday = date && date.toDateString() === new Date().toDateString();

              return (
                <div
                  key={idx}
                  className={`bg-slate-950/40 border border-slate-850/60 rounded-xl p-2 flex flex-col justify-between min-h-[90px] hover:border-slate-800 transition-colors ${!date ? 'opacity-25 pointer-events-none' : ''
                    } ${isToday ? 'border-violet-600/40 bg-violet-950/5' : ''}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-[11px] font-black ${isToday ? 'text-violet-400' : 'text-slate-500'}`}>
                      {date ? date.getDate() : ''}
                    </span>
                    {isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                    )}
                  </div>

                  {/* Day Content */}
                  <div className="flex-1 space-y-1.5 overflow-y-auto max-h-20">
                    {/* Meetings */}
                    {dayMeetings.map(m => (
                      <div
                        key={m._id}
                        onClick={(e) => handleOpenMeetingDetail(e, m)}
                        className="p-1 text-[9px] font-bold rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 cursor-pointer border border-emerald-500/20 transition-all truncate"
                        title={m.title}
                      >
                        🎥 {m.title}
                      </div>
                    ))}

                    {/* Tasks */}
                    {dayTasks.map(t => (
                      <div
                        key={t._id}
                        onClick={(e) => handleOpenTaskDetail(e, t._id)}
                        className={`p-1 text-[9px] font-bold rounded cursor-pointer transition-all truncate border ${t.status === 'Done'
                            ? 'bg-slate-800/40 text-slate-500 border-slate-800'
                            : 'bg-violet-600/10 text-violet-400 hover:bg-violet-600/25 border-violet-500/20'
                          }`}
                        title={t.title}
                      >
                        📌 {t.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SCHEDULE MEETING MODAL */}
      <Modal isOpen={scheduleModalOpen} onClose={() => setScheduleModalOpen(false)} title="Schedule Team Sync Meeting">
        <form onSubmit={handleScheduleMeeting} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Meeting Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sprint Planning Sync"
              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2 text-xs text-slate-100 outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide agenda or meeting goals..."
              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2 text-xs text-slate-100 outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Project Context (Optional)</label>
              <select
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2 text-xs text-slate-100 outline-none focus:border-violet-500 transition-colors"
              >
                <option value="">No Project Linkage</option>
                {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Meeting Link</label>
              <input
                type="url"
                required
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="Google Meet or Zoom URL"
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2 text-xs text-slate-100 outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Start Date & Time</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (!endDate) setEndDate(e.target.value);
                  }}
                  className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-violet-500"
                />
                <select
                  value={startTimeSelect}
                  onChange={(e) => setStartTimeSelect(e.target.value)}
                  className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-violet-500"
                >
                  {timeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">End Date & Time</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-violet-500"
                />
                <select
                  value={endTimeSelect}
                  onChange={(e) => setEndTimeSelect(e.target.value)}
                  className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-violet-500"
                >
                  {timeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Invite Team Attendees</label>
            <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto border border-slate-850 rounded-xl p-3 bg-slate-950/30">
              {teamMembers.map(member => (
                <button
                  type="button"
                  key={member._id}
                  onClick={() => handleToggleAttendee(member._id)}
                  className={`px-3 py-1 rounded text-[10px] font-bold border transition-colors ${selectedAttendees.includes(member._id)
                      ? 'bg-violet-600 border-violet-500 text-white'
                      : 'bg-slate-950 border-slate-850 text-slate-450 hover:text-white'
                    }`}
                >
                  {member.name}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
          >
            Create Meeting Sync
          </button>
        </form>
      </Modal>

      {/* MEETING DETAILS MODAL */}
      <Modal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)} title="Sync Meeting Invitation">
        {activeMeeting && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-100">{activeMeeting.title}</h3>
              {activeMeeting.project && (
                <span className="text-[10px] font-semibold text-violet-400 uppercase tracking-wider">Project: {activeMeeting.project.name}</span>
              )}
            </div>

            {activeMeeting.description && (
              <p className="text-xs text-slate-400 bg-slate-950 border border-slate-850/60 rounded-xl p-3 leading-relaxed">
                {activeMeeting.description}
              </p>
            )}

            <div className="space-y-2.5 text-xs text-slate-350">
              <div className="flex items-center space-x-2">
                <Clock size={14} className="text-slate-500" />
                <span>
                  {new Date(activeMeeting.startTime).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                  {' • '}
                  {new Date(activeMeeting.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {' - '}
                  {new Date(activeMeeting.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <LinkIcon size={14} className="text-slate-500" />
                <a
                  href={activeMeeting.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-400 hover:text-violet-350 underline font-semibold transition-colors"
                >
                  Join via Google Meet / Zoom
                </a>
              </div>

              <div className="flex items-center space-x-2">
                <Users size={14} className="text-slate-500" />
                <span>Invited Attendees:</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 p-2 bg-slate-950/40 rounded-xl border border-slate-850/65">
              {(activeMeeting.attendees || []).map(att => (
                <div key={att._id} className="flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-850">
                  {att.avatar ? (
                    <img src={att.avatar} alt={att.name} className="w-3.5 h-3.5 rounded-full object-cover" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full bg-violet-600 text-[8px] flex items-center justify-center font-bold text-white uppercase">
                      {att.name[0]}
                    </div>
                  )}
                  <span className="text-[10px] text-slate-300 font-semibold">{att.name}</span>
                </div>
              ))}
            </div>

            {new Date(activeMeeting.endTime) >= new Date() ? (
              <div className="flex justify-between items-center pt-3 border-t border-slate-850">
                <a
                  href={activeMeeting.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl flex items-center space-x-2 transition-all shadow-md"
                >
                  <span>Join Meeting</span>
                </a>

                {(activeMeeting.createdBy === user._id || activeMeeting.createdBy?._id === user._id || ['Super Admin', 'Admin'].includes(user.role)) && (
                  <button
                    onClick={() => handleDeleteMeeting(activeMeeting._id)}
                    className="p-2 bg-red-650 hover:bg-red-550/20 text-slate-400 hover:text-red-400 rounded-xl transition-all border border-transparent hover:border-red-600/30"
                    title="Cancel Meeting"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ) : (
              <div className="pt-3 border-t border-slate-850 flex justify-between items-center w-full">
                <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
                  Meeting Ended
                </span>
                <span className="text-[10px] text-slate-500 italic">This meeting is archived for history details.</span>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
