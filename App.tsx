
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabase';
import { Todo } from './types';
import TodoItem from './components/TodoItem';
import { analyzeTask } from './services/geminiService';

const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);

  const fetchTodos = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01' || error.message.includes('public.todos')) {
          setNeedsSetup(true);
        }
        throw error;
      }
      setTodos(data || []);
      setNeedsSetup(false);
    } catch (err: any) {
      console.error("Error fetching todos:", err);
      setError(err.message || "Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isAnalyzing) return;

    const taskToProcess = inputValue;
    setInputValue('');
    setIsAnalyzing(true);

    try {
      // AI Enhancement using Gemini
      const analysis = await analyzeTask(taskToProcess);

      const { data, error } = await supabase
        .from('todos')
        .insert([{
          title: taskToProcess,
          is_completed: false,
          priority: analysis.suggestedPriority,
          sub_tasks: analysis.subTasks,
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;
      if (data) {
        setTodos(prev => [data[0], ...prev]);
      }
    } catch (err: any) {
      console.error("Error adding todo:", err);
      setError("AI 분석 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleToggleTodo = async (id: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ is_completed: completed })
        .eq('id', id);

      if (error) throw error;
      setTodos(prev => prev.map(t => t.id === id ? { ...t, is_completed: completed } : t));
    } catch (err) {
      console.error("Error updating todo:", err);
    }
  };

  const handleDeleteTodo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTodos(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error("Error deleting todo:", err);
    }
  };

  const handleClearCompleted = async () => {
    const completedIds = todos.filter(t => t.is_completed).map(t => t.id);
    if (completedIds.length === 0) return;

    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .in('id', completedIds);

      if (error) throw error;
      setTodos(prev => prev.filter(t => !t.is_completed));
    } catch (err) {
      console.error("Error clearing completed:", err);
    }
  };

  const stats = {
    total: todos.length,
    completed: todos.filter(t => t.is_completed).length,
    pending: todos.filter(t => !t.is_completed).length
  };

  const sqlSetup = `create table todos (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  is_completed boolean default false,
  priority text default 'medium' check (priority in ('low', 'medium', 'high')),
  created_at timestamptz default now(),
  sub_tasks text[]
);

alter table todos enable row level security;
create policy "Allow all access" on todos for all using (true) with check (true);`;

  if (needsSetup) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">데이터베이스 설정이 필요합니다</h2>
          <p className="text-slate-500 mb-6">Supabase 프로젝트에 <code>todos</code> 테이블이 없습니다. 아래 단계를 따라주세요:</p>
          
          <ol className="space-y-4 mb-8">
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center">1</span>
              <p className="text-sm text-slate-600"><a href="https://supabase.com/dashboard" target="_blank" className="text-indigo-600 underline font-medium">Supabase 대시보드</a>를 엽니다.</p>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center">2</span>
              <p className="text-sm text-slate-600">왼쪽 메뉴의 <strong>SQL Editor</strong>로 들어갑니다.</p>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center">3</span>
              <p className="text-sm text-slate-600"><strong>New Query</strong>를 만들고 아래 코드를 붙여넣은 뒤 <strong>Run</strong>을 누릅니다.</p>
            </li>
          </ol>

          <div className="relative group">
            <pre className="bg-slate-900 text-slate-300 p-4 rounded-xl text-xs overflow-x-auto font-mono mb-6 leading-relaxed border border-slate-800">
              {sqlSetup}
            </pre>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(sqlSetup);
                alert('복사되었습니다!');
              }}
              className="absolute top-2 right-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold py-1 px-2 rounded border border-slate-700 transition-colors"
            >
              COPY SQL
            </button>
          </div>

          <button 
            onClick={fetchTodos}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2"
          >
            연결 다시 확인하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8 text-center">
          <div className="inline-flex items-center justify-center p-3 mb-4 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">SmartTodo AI</h1>
          <p className="mt-2 text-slate-500 font-medium">Gemini AI가 당신의 할 일을 분석하고 세분화합니다</p>
        </header>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-center">
            <span className="block text-2xl font-bold text-slate-800">{stats.total}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">전체</span>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-center">
            <span className="block text-2xl font-bold text-indigo-600">{stats.pending}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">진행중</span>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-center">
            <span className="block text-2xl font-bold text-emerald-500">{stats.completed}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">완료</span>
          </div>
        </div>

        <form onSubmit={handleAddTodo} className="relative mb-8 group">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isAnalyzing}
            placeholder="할 일을 입력하세요 (예: '제주도 여행 계획 짜기')"
            className="w-full h-16 pl-6 pr-24 bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-700 font-medium transition-all"
          />
          <button
            type="submit"
            disabled={isAnalyzing || !inputValue.trim()}
            className="absolute right-2 top-2 h-12 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold rounded-xl transition-colors flex items-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="hidden sm:inline">분석 중...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">추가</span>
              </>
            )}
          </button>
        </form>

        <div className="flex justify-between items-center mb-4 px-2">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">내 할 일 목록</h2>
          {stats.completed > 0 && (
            <button 
              onClick={handleClearCompleted}
              className="text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors"
            >
              완료 항목 삭제
            </button>
          )}
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400 font-medium animate-pulse">데이터 동기화 중...</p>
            </div>
          ) : error && !needsSetup ? (
            <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl text-center">
              <p className="text-rose-600 font-semibold">{error}</p>
              <button 
                onClick={fetchTodos}
                className="mt-4 px-4 py-2 bg-rose-100 text-rose-700 rounded-lg text-sm font-bold hover:bg-rose-200 transition-colors"
              >
                다시 시도
              </button>
            </div>
          ) : todos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-slate-400 font-medium">목록이 비어있습니다.<br/>AI의 도움을 받아 할 일을 추가해보세요!</p>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {todos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={handleToggleTodo}
                  onDelete={handleDeleteTodo}
                />
              ))}
            </div>
          )}
        </div>
        
        <footer className="mt-12 text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Powered by Supabase & Google Gemini 3
          </p>
        </footer>
      </div>
    </div>
  );
};

export default App;
