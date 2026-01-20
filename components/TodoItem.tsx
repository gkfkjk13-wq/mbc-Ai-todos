
import React, { useState } from 'react';
import { Todo } from '../types';
import PriorityBadge from './PriorityBadge';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
}

const TodoItem: React.FC<TodoItemProps> = ({ todo, onToggle, onDelete }) => {
  const [showSubTasks, setShowSubTasks] = useState(false);

  return (
    <div className={`group relative p-4 mb-3 rounded-2xl transition-all duration-300 ${todo.is_completed ? 'opacity-60 bg-gray-50' : 'bg-white shadow-sm hover:shadow-md border border-slate-100'}`}>
      <div className="flex items-start gap-4">
        <button
          onClick={() => onToggle(todo.id, !todo.is_completed)}
          className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
            todo.is_completed ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300 hover:border-indigo-400'
          }`}
        >
          {todo.is_completed && (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`text-sm font-semibold truncate ${todo.is_completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
              {todo.title}
            </h3>
            <PriorityBadge priority={todo.priority} />
          </div>
          
          <div className="flex items-center gap-3">
            <p className="text-xs text-slate-400">
              {new Date(todo.created_at).toLocaleDateString()}
            </p>
            {todo.sub_tasks && todo.sub_tasks.length > 0 && (
              <button 
                onClick={() => setShowSubTasks(!showSubTasks)}
                className="text-[10px] font-medium text-indigo-500 hover:text-indigo-600 uppercase tracking-tight"
              >
                {showSubTasks ? 'Hide Steps' : `${todo.sub_tasks.length} Steps`}
              </button>
            )}
          </div>

          {showSubTasks && todo.sub_tasks && (
            <div className="mt-3 pl-2 border-l-2 border-slate-100 flex flex-col gap-2">
              {todo.sub_tasks.map((task, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-300" />
                  <span className="text-xs text-slate-500">{task}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => onDelete(todo.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-slate-300 hover:text-rose-500"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TodoItem;
