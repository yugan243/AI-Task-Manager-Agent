"use client";
import { CheckCircle2, Circle, Trash2, Layers } from "lucide-react";

export default function TaskSidebar({ tasks, toggleTask, deleteTask }) {
  const completedCount = tasks.filter(t => t.is_completed).length;

  return (
    <div className="w-80 h-full bg-white/40 backdrop-blur-xl border-r border-white/50 flex flex-col font-sans transition-all z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      {/* Header */}
      <div className="p-8 pt-10">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-blue-500/10 rounded-xl text-blue-600">
            <Layers size={22} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">My Tasks</h2>
        </div>
        <p className="text-slate-500 text-sm font-medium pl-1">
          {tasks.length - completedCount} remaining · {completedCount} done
        </p>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 opacity-40">
            <p className="text-slate-400 text-sm font-medium">All clear for today</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`
                group flex items-start gap-3 p-3.5 rounded-2xl transition-all duration-300 border border-transparent
                /* HOVER EFFECT: Gradient Background + Shadow */
                hover:bg-gradient-to-r hover:from-rose-400 hover:to-orange-500 hover:shadow-lg hover:shadow-rose-500/20 hover:scale-[1.02]
              `}
            >
              {/* Toggle Button */}
              <button
                onClick={() => toggleTask(task.id)}
                className="mt-0.5 transition-colors"
              >
                {task.is_completed ? (
                  // Completed: Green/White check
                  <CheckCircle2 size={22} className="text-emerald-500 group-hover:text-white group-hover:opacity-80 transition-colors" />
                ) : (
                  // Pending: Slate circle -> turns White on hover
                  <Circle size={22} strokeWidth={1.5} className="text-slate-400 group-hover:text-white transition-colors" />
                )}
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`text-[15px] leading-snug font-medium transition-all group-hover:text-white ${
                  task.is_completed ? "text-slate-400 line-through decoration-slate-300 group-hover:decoration-white/50" : "text-slate-700"
                }`}>
                  {task.content}
                </p>
                
                {task.due_date && (
                  <p className="text-xs mt-1 font-medium inline-block px-2 py-0.5 rounded-md transition-all
                    /* Default: Blue text on blue bg */
                    text-blue-500/80 bg-blue-50/50 
                    /* Hover: White text on transparent white bg */
                    group-hover:text-white group-hover:bg-white/20
                  ">
                    Due {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </p>
                )}
              </div>

              {/* Delete Button */}
              <button
                onClick={() => deleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 transition-all p-1 text-white hover:bg-white/20 rounded-full"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}