"use client";
import { CheckCircle2, Circle, Trash2, ListTodo } from "lucide-react";

export default function TaskSidebar({ tasks, toggleTask, deleteTask }) {
  return (
    <div className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <ListTodo className="text-blue-500" size={24} />
          <h2 className="text-xl font-semibold text-white">Tasks</h2>
        </div>
        <p className="text-gray-500 text-sm mt-1">{tasks.length} pending</p>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {tasks.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No tasks yet. Ask J.A.R.V.I.S. to add some!</p>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="group flex items-start gap-3 p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-all"
            >
              {/* Toggle Button */}
              <button
                onClick={() => toggleTask(task.id)}
                className="mt-0.5 text-gray-400 hover:text-blue-400 transition-colors"
              >
                {task.is_completed ? (
                  <CheckCircle2 size={20} className="text-green-500" />
                ) : (
                  <Circle size={20} />
                )}
              </button>

              {/* Task Content */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${task.is_completed ? "text-gray-500 line-through" : "text-gray-200"}`}>
                  {task.content}
                </p>
                {task.due_date && (
                  <p className="text-xs text-gray-500 mt-1">
                    Due: {new Date(task.due_date).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Delete Button */}
              <button
                onClick={() => deleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all"
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