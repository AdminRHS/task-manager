import React, { useState, useRef, useEffect } from 'react';
// import ReactMarkdown from 'react-markdown';

const STATUSES = ['Backlog', 'Filling', 'Doing', 'Done', 'Frozen'];
const USERS = ['Danylo', 'Mykola', 'Max', 'Oleksii', 'Vlad', 'Sasha'];
const PRIORITIES = ['low', 'medium', 'high'];

interface TaskData {
  title: string;
  description: string;
  deepResearch: string;
  plan: string;
  info: string;
  assignees: string[];
  status: string;
  priority: string;
  showAssignees: boolean;
}

const initialColumns = STATUSES.map(name => ({ name, tasks: [] as TaskData[] }));

function getStatusBg(name: string) {
  if (name === 'Backlog') return 'bg-orange-500';
  if (name === 'Frozen') return 'bg-red-700';
  if (name === 'Filling') return 'bg-gray-800';
  if (name === 'Doing') return 'bg-yellow-400';
  if (name === 'Done') return 'bg-green-600';
  return 'bg-gray-800';
}

function getStatusSelectBg(status: string) {
  if (status === 'Backlog') return 'bg-orange-600 text-white';
  if (status === 'Doing') return 'bg-yellow-400 text-black';
  if (status === 'Done') return 'bg-green-600 text-white';
  if (status === 'Frozen') return 'bg-red-700 text-white';
  return 'bg-gray-900 text-white';
}

function getPrioritySelectBg(priority: string) {
  if (priority === 'high') return 'bg-red-700 text-white';
  if (priority === 'medium') return 'bg-yellow-400 text-black';
  if (priority === 'low') return 'bg-green-500 text-white';
  return 'bg-gray-900 text-white';
}

function App() {
  const [columns, setColumns] = useState(initialColumns);
  const [newTask, setNewTask] = useState<{ [key: string]: string }>({});
  const [dragged, setDragged] = useState<{ colIdx: number; taskIdx: number } | null>(null);
  const [modal, setModal] = useState<{ colIdx: number; taskIdx: number } | null>(null);
  const [editTask, setEditTask] = useState<TaskData | null>(null);
  const assigneesRef = useRef<HTMLDivElement>(null);
  const assigneesButtonRef = useRef<HTMLButtonElement>(null);
  const [fieldErrors, setFieldErrors] = useState<{[key:string]: boolean}>({});
  const [formError, setFormError] = useState<string>('');

  // Закрытие выпадающего списка при клике вне
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        editTask?.showAssignees &&
        assigneesRef.current &&
        !assigneesRef.current.contains(event.target as Node) &&
        assigneesButtonRef.current &&
        !assigneesButtonRef.current.contains(event.target as Node)
      ) {
        setEditTask(editTask => editTask ? { ...editTask, showAssignees: false } : editTask);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editTask?.showAssignees]);

  const handleAddTask = (colIdx: number) => {
    const value = newTask[colIdx] || '';
    if (!value.trim()) return;
    const updated = [...columns];
    updated[colIdx].tasks = [...updated[colIdx].tasks, {
      title: value,
      description: '',
      deepResearch: '',
      plan: '',
      info: '',
      assignees: [],
      status: columns[colIdx].name,
      priority: 'medium',
      showAssignees: false,
    }];
    setColumns(updated);
    setNewTask({ ...newTask, [colIdx]: '' });
  };

  const handleDragStart = (colIdx: number, taskIdx: number) => {
    setDragged({ colIdx, taskIdx });
  };

  const handleDrop = (colIdx: number) => {
    if (!dragged) return;
    const { colIdx: fromCol, taskIdx } = dragged;
    if (fromCol === colIdx) return;
    const updated = [...columns];
    const [task] = updated[fromCol].tasks.splice(taskIdx, 1);
    task.status = columns[colIdx].name;
    updated[colIdx].tasks.push(task);
    setColumns(updated);
    setDragged(null);
  };

  const openModal = (colIdx: number, taskIdx: number) => {
    setModal({ colIdx, taskIdx });
    setEditTask({ ...columns[colIdx].tasks[taskIdx] });
  };

  const closeModal = () => {
    setModal(null);
    setEditTask(null);
  };

  const toggleAssignee = (user: string) => {
    if (!editTask) return;
    setEditTask({
      ...editTask,
      assignees: editTask.assignees.includes(user)
        ? editTask.assignees.filter(u => u !== user)
        : [...editTask.assignees, user],
    });
  };

  const saveTask = () => {
    if (!modal || !editTask) return;
    // Валидация обязательных полей
    const errors: {[key:string]: boolean} = {};
    if (!editTask.description.trim()) errors.description = true;
    if (!editTask.deepResearch.trim()) errors.deepResearch = true;
    if (!editTask.plan.trim()) errors.plan = true;
    if (!editTask.status.trim()) errors.status = true;
    if (!editTask.priority.trim()) errors.priority = true;
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setFormError('Please fill in all required fields.');
      return;
    }
    setFormError('');
    let updated = [...columns];
    if (columns[modal.colIdx].name === editTask.status) {
      updated[modal.colIdx].tasks[modal.taskIdx] = { ...editTask };
    } else {
      const [task] = updated[modal.colIdx].tasks.splice(modal.taskIdx, 1);
      const newColIdx = updated.findIndex(col => col.name === editTask.status);
      if (newColIdx !== -1) {
        updated[newColIdx].tasks.push({ ...editTask });
      }
    }
    setColumns(updated);
    closeModal();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <header className="py-8 text-center">
        <h1 className="text-5xl font-bold tracking-wide mb-2">AI DepartmentTask Manager</h1>
      </header>
      <main className="flex-1 flex justify-center items-start px-4 pb-8">
        <div className="w-full max-w-7xl flex gap-8">
          {columns.map((col, colIdx) => (
            <div
              key={col.name}
              className="flex flex-col min-h-[400px] w-full max-w-xs px-2"
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleDrop(colIdx)}
            >
              <h2 className="text-xl font-semibold mb-6 text-center">
                <span className={`inline-block ${getStatusBg(col.name)} text-white px-6 py-2 rounded-full shadow-sm`}>
                  {col.name}
                </span>
              </h2>
              <div className="flex flex-col gap-2 flex-1">
                {col.tasks.map((task, taskIdx) => (
                  <div
                    key={taskIdx}
                    className="bg-black rounded-full px-4 py-2 cursor-move select-none shadow-sm text-white text-base font-medium"
                    draggable
                    onDragStart={() => handleDragStart(colIdx, taskIdx)}
                    onClick={() => openModal(colIdx, taskIdx)}
                  >
                    {task.title}
                  </div>
                ))}
              </div>
              <div className="mt-4 min-h-[56px] flex flex-col items-center justify-start">
                <div className="flex gap-2 mt-0 justify-center w-[180px]">
                  <input
                    className="rounded-full px-3 py-2 bg-gray-900 border border-gray-700 text-gray-100 focus:outline-none min-w-[120px] max-w-[140px]"
                    type="text"
                    value={newTask[colIdx] || ''}
                    onChange={e => setNewTask({ ...newTask, [colIdx]: e.target.value })}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddTask(colIdx); }}
                    placeholder="New task..."
                  />
                  <button
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-800 rounded-full text-white font-medium"
                    onClick={() => handleAddTask(colIdx)}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Modal */}
        {modal && editTask && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-2xl p-8 w-[90vw] h-[90vh] max-w-5xl max-h-[90vh] shadow-2xl relative flex flex-col overflow-auto">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl"
                onClick={closeModal}
                title="Close"
              >
                ×
              </button>
              <h2 className="text-3xl font-bold mb-6">{editTask.title}</h2>
              {formError && (
                <div className="mb-4 text-red-400 text-center font-semibold">{formError}</div>
              )}
              <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-center">
                {/* Status */}
                <div className="flex-1 min-w-[180px] flex flex-col items-center">
                  <label className="block mb-2 text-gray-300 text-lg font-semibold text-center">Status</label>
                  <div className="relative">
                    <select
                      className={`rounded-full px-4 py-2 border border-gray-700 focus:outline-none mb-2 text-base text-center min-w-[140px] max-w-[180px] ${getStatusSelectBg(editTask.status)} ${fieldErrors.status ? 'border-red-500 ring-2 ring-red-500' : ''}`}
                      value={editTask.status}
                      onChange={e => { setEditTask({ ...editTask, status: e.target.value }); setFieldErrors(f => ({...f, status: false})); }}
                    >
                      {STATUSES.map(status => (
                        <option key={status} value={status} className="bg-gray-900 text-white">{status}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {/* Priority */}
                <div className="flex-1 min-w-[180px] flex flex-col items-center">
                  <label className="block mb-2 text-gray-300 text-lg font-semibold text-center">Priority</label>
                  <select
                    className={`rounded-full px-4 py-2 border border-gray-700 focus:outline-none mb-2 text-base text-center min-w-[120px] max-w-[140px] ${getPrioritySelectBg(editTask.priority)} ${fieldErrors.priority ? 'border-red-500 ring-2 ring-red-500' : ''}`}
                    value={editTask.priority}
                    onChange={e => { setEditTask({ ...editTask, priority: e.target.value }); setFieldErrors(f => ({...f, priority: false})); }}
                  >
                    {PRIORITIES.map(priority => (
                      <option key={priority} value={priority} className="bg-gray-900 text-white">{priority}</option>
                    ))}
                  </select>
                </div>
                {/* Assignees */}
                <div className="flex-1 min-w-[180px] flex flex-col items-center relative">
                  <label className="block mb-2 text-gray-300 text-lg font-semibold text-center">Assignees</label>
                  <div className="w-full flex justify-center">
                    <button
                      type="button"
                      ref={assigneesButtonRef}
                      className="rounded-full px-4 py-2 bg-gray-900 border border-gray-700 text-gray-100 text-left focus:outline-none mb-2 text-base min-w-[120px] max-w-[180px] flex items-center justify-between"
                      onClick={() => setEditTask(editTask => editTask ? { ...editTask, showAssignees: !editTask.showAssignees } : editTask)}
                    >
                      {editTask.assignees.length > 0 ? editTask.assignees.join(', ') : 'Select...'}
                      <span className="ml-2">▼</span>
                    </button>
                    <div className="relative w-full flex justify-center">
                      {editTask.showAssignees && (
                        <div
                          ref={assigneesRef}
                          className="absolute z-10 mt-0 bg-gray-900 border border-gray-700 rounded-lg shadow-lg min-w-[120px] max-w-[180px] left-0 right-0 mx-auto"
                          style={{ top: '100%' }}
                        >
                          {USERS.map(user => (
                            <div
                              key={user}
                              className={`px-4 py-2 cursor-pointer hover:bg-gray-800 flex items-center ${editTask.assignees.includes(user) ? 'font-semibold text-blue-400' : ''}`}
                              onClick={() => {
                                toggleAssignee(user);
                              }}
                            >
                              <span className="mr-2 w-4 inline-block text-blue-400">{editTask.assignees.includes(user) ? '✓' : ''}</span>
                              <span>{user}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mb-6">
                <label className="block mb-2 text-gray-300 text-lg font-semibold">Description</label>
                <textarea
                  className={`w-full min-h-[80px] rounded-lg px-3 py-2 bg-gray-900 border ${fieldErrors.description ? 'border-red-500 ring-2 ring-red-500' : 'border-gray-600'} text-gray-100 focus:outline-none mb-2 text-base`}
                  value={editTask.description}
                  onChange={e => { setEditTask({ ...editTask, description: e.target.value }); setFieldErrors(f => ({...f, description: false})); }}
                  placeholder="Write your task description..."
                />
              </div>
              <div className="mb-6">
                <label className="block mb-2 text-gray-300 text-lg font-semibold">Deep Research</label>
                <textarea
                  className={`w-full min-h-[60px] rounded-lg px-3 py-2 bg-gray-900 border ${fieldErrors.deepResearch ? 'border-red-500 ring-2 ring-red-500' : 'border-gray-600'} text-gray-100 focus:outline-none mb-2 text-base`}
                  value={editTask.deepResearch}
                  onChange={e => { setEditTask({ ...editTask, deepResearch: e.target.value }); setFieldErrors(f => ({...f, deepResearch: false})); }}
                  placeholder="Write your deep research..."
                />
              </div>
              <div className="mb-6">
                <label className="block mb-2 text-gray-300 text-lg font-semibold">Plan</label>
                <textarea
                  className={`w-full min-h-[60px] rounded-lg px-3 py-2 bg-gray-900 border ${fieldErrors.plan ? 'border-red-500 ring-2 ring-red-500' : 'border-gray-600'} text-gray-100 focus:outline-none mb-2 text-base`}
                  value={editTask.plan}
                  onChange={e => { setEditTask({ ...editTask, plan: e.target.value }); setFieldErrors(f => ({...f, plan: false})); }}
                  placeholder="Write your plan..."
                />
              </div>
              <div className="mb-6">
                <label className="block mb-2 text-gray-300 text-lg font-semibold">Additional info</label>
                <textarea
                  className="w-full min-h-[60px] rounded-lg px-3 py-2 bg-gray-900 border border-gray-600 text-gray-100 focus:outline-none mb-2 text-base"
                  value={editTask.info}
                  onChange={e => setEditTask({ ...editTask, info: e.target.value })}
                  placeholder="Write any additional info..."
                />
              </div>
              <button
                className="mt-2 px-8 py-3 bg-blue-700 hover:bg-blue-800 rounded-lg text-white font-semibold text-lg self-end"
                onClick={saveTask}
              >
                Save
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
