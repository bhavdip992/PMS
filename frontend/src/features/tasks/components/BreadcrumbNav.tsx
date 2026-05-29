import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Folder, FileText, GitCommit } from 'lucide-react';

interface BreadcrumbNavProps {
  project?: { _id: string; name: string } | null;
  task?: { _id: string; title: string } | null;
  subtask?: { _id: string; title: string } | null;
}

export default function BreadcrumbNav({ project, task, subtask }: BreadcrumbNavProps) {
  return (
    <nav className="flex items-center space-x-2 text-[11px] font-bold text-slate-400 select-none bg-slate-950/45 px-4 py-2.5 rounded-xl border border-slate-850/60 max-w-max">
      {/* Project */}
      {project && (
        <div className="flex items-center space-x-1.5">
          <Folder size={12} className="text-violet-400" />
          <Link
            to={`/projects/${project._id}`}
            className="hover:text-violet-400 transition-colors uppercase tracking-wider"
          >
            {project.name}
          </Link>
        </div>
      )}

      {/* Task separator & link */}
      {task && (
        <>
          <ChevronRight size={12} className="text-slate-650" />
          <div className="flex items-center space-x-1.5">
            <FileText size={12} className="text-indigo-400" />
            {subtask ? (
              <Link
                to={`/tasks/${task._id}`}
                className="hover:text-indigo-400 transition-colors"
              >
                {task.title}
              </Link>
            ) : (
              <span className="text-slate-200 truncate max-w-[200px]">{task.title}</span>
            )}
          </div>
        </>
      )}

      {/* Subtask separator & title */}
      {subtask && (
        <>
          <ChevronRight size={12} className="text-slate-650" />
          <div className="flex items-center space-x-1.5 text-slate-200">
            <GitCommit size={12} className="text-emerald-400" />
            <span className="truncate max-w-[200px]">{subtask.title}</span>
          </div>
        </>
      )}
    </nav>
  );
}
