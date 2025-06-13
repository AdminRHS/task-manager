import React, { useState, useRef, useEffect } from 'react';
import { DndContext, closestCenter, useDraggable, useDroppable } from '@dnd-kit/core';
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

const DEFAULT_BOARD_NAME = 'AI Department';

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

function DraggableTask({ id, children, onClick }: { id: string; children: React.ReactNode; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  const [hovered, setHovered] = React.useState(false);
  const mouseDownRef = React.useRef<{x: number, y: number, time: number} | null>(null);

  function handleMouseDown(e: React.MouseEvent) {
    mouseDownRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
  }
  function handleMouseUp(e: React.MouseEvent) {
    if (!mouseDownRef.current) return;
    const dx = Math.abs(e.clientX - mouseDownRef.current.x);
    const dy = Math.abs(e.clientY - mouseDownRef.current.y);
    const dt = Date.now() - mouseDownRef.current.time;
    // Если не было движения мыши и быстрое нажатие — считаем это кликом
    if (dx < 5 && dy < 5 && dt < 500 && !isDragging) {
      onClick();
    }
    mouseDownRef.current = null;
  }
  function handleMouseMove(e: React.MouseEvent) {
    // если пользователь начал двигать мышь — сбрасываем клик
    if (mouseDownRef.current) {
      const dx = Math.abs(e.clientX - mouseDownRef.current.x);
      const dy = Math.abs(e.clientY - mouseDownRef.current.y);
      if (dx > 5 || dy > 5) mouseDownRef.current = null;
    }
  }
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.5 : 1,
        transition: 'transform 0.2s cubic-bezier(.22,1,.36,1)',
        zIndex: isDragging ? 100 : undefined,
        cursor: isDragging ? 'grabbing' : hovered ? 'grab' : 'default',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      {...attributes}
      {...listeners}
      className="bg-black rounded-full px-4 py-2 select-none shadow-sm text-white text-base font-medium"
    >
      {children}
    </div>
  );
}

function DroppableColumn({ id, children, onDrop }: { id: string; children: React.ReactNode; onDrop: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ background: isOver ? 'rgba(59,130,246,0.12)' : undefined, transition: 'background 0.2s' }}
      onDrop={onDrop}
      className="flex flex-col w-full max-w-xs px-4 py-6 bg-white/10 rounded-2xl shadow-lg backdrop-blur-md"
    >
      {children}
    </div>
  );
}

function Board({
  board,
  onBoardNameChange,
  onColumnsChange,
  onDeleteBoard
}: {
  board: any;
  onBoardNameChange: (name: string) => void;
  onColumnsChange: (columns: any[]) => void;
  onDeleteBoard: () => void;
}) {
  const [columns, setColumns] = useState(board.columns);
  const [newTask, setNewTask] = useState<{ [key: string]: string }>({});
  const [modal, setModal] = useState<{ colIdx: number; taskIdx: number } | null>(null);
  const [editTask, setEditTask] = useState<TaskData | null>(null);
  const assigneesRef = useRef<HTMLDivElement>(null);
  const assigneesButtonRef = useRef<HTMLButtonElement>(null);
  const [fieldErrors, setFieldErrors] = useState<{[key:string]: boolean}>({});
  const [formError, setFormError] = useState<string>('');

  useEffect(() => { setColumns(board.columns); }, [board.columns]);
  useEffect(() => { onColumnsChange(columns); }, [columns]);

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

  const openModal = (colIdx: number, taskIdx: number) => {
    setModal({ colIdx, taskIdx });
    setEditTask({ ...columns[colIdx].tasks[taskIdx] });
  };
  const closeModal = () => { setModal(null); setEditTask(null); };
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
  function handleDragEnd(event: any) {
    const { active, over } = event;
    if (!active || !over) return;
    const [fromCol, fromTask] = active.id.split(':').map(Number);
    const toCol = Number(over.id);
    if (fromCol === toCol) return;
    const updated = [...columns];
    const [task] = updated[fromCol].tasks.splice(fromTask, 1);
    task.status = columns[toCol].name;
    updated[toCol].tasks.push(task);
    setColumns(updated);
  }
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(board.name);
  useEffect(() => { setTempName(board.name); }, [board.name]);

  return (
    <div className="mb-12">
      <div className="flex items-center gap-2 mb-4">
        {editingName ? (
          <input
            className="text-2xl font-bold bg-gray-900 border-b-2 border-blue-400 focus:outline-none px-2 py-1 rounded"
            value={tempName}
            autoFocus
            onChange={e => setTempName(e.target.value)}
            onBlur={() => { setEditingName(false); onBoardNameChange(tempName.trim() || 'Untitled Board'); }}
            onKeyDown={e => { if (e.key === 'Enter') { setEditingName(false); onBoardNameChange(tempName.trim() || 'Untitled Board'); } }}
          />
        ) : (
          <h2 className="text-2xl font-bold cursor-pointer hover:underline" onClick={() => setEditingName(true)}>{board.name}</h2>
        )}
        <button className="ml-2 text-gray-400 hover:text-red-500 text-lg" title="Delete board" onClick={onDeleteBoard}>×</button>
      </div>
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="w-full max-w-7xl flex gap-10 items-start">
          {columns.map((col, colIdx) => (
            <DroppableColumn key={col.name} id={String(colIdx)} onDrop={() => {}}>
              <h3 className="text-xl font-semibold mb-6 text-center">
                <span className={`inline-block ${getStatusBg(col.name)} text-white px-6 py-2 rounded-full shadow-sm`}>
                  {col.name}
                </span>
              </h3>
              <div className="flex flex-col gap-2">
                {col.tasks.map((task, taskIdx) => (
                  <DraggableTask
                    key={taskIdx}
                    id={`${colIdx}:${taskIdx}`}
                    onClick={() => openModal(colIdx, taskIdx)}
                  >
                    {task.title}
                  </DraggableTask>
                ))}
                <div className="mt-2 flex flex-col items-center justify-start">
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
            </DroppableColumn>
          ))}
        </div>
      </DndContext>
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
            <div className="flex items-center gap-4 mb-6">
              <input
                className="text-3xl font-bold bg-gray-800 border-b-2 border-blue-400 focus:outline-none px-2 py-1 rounded w-full"
                value={editTask.title}
                onChange={e => setEditTask({ ...editTask, title: e.target.value })}
                placeholder="Task title"
              />
              <button
                className="text-red-400 hover:text-red-600 text-lg border border-red-400 rounded px-3 py-1"
                onClick={() => {
                  if (!modal) return;
                  const updated = [...columns];
                  updated[modal.colIdx].tasks.splice(modal.taskIdx, 1);
                  setColumns(updated);
                  closeModal();
                }}
                title="Delete task"
              >
                Delete
              </button>
            </div>
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
    </div>
  );
}

function App() {
  const [boards, setBoards] = useState([
    {
      name: DEFAULT_BOARD_NAME,
      columns: STATUSES.map(name => ({ name, tasks: [] as TaskData[] })),
    },
  ]);
  const [subtitle, setSubtitle] = useState(DEFAULT_BOARD_NAME);
  const [editingSubtitle, setEditingSubtitle] = useState(false);
  const [tempSubtitle, setTempSubtitle] = useState(subtitle);

  const addBoard = () => {
    setBoards([...boards, {
      name: 'New Board',
      columns: STATUSES.map(name => ({ name, tasks: [] as TaskData[] })),
    }]);
  };
  const updateBoardName = (idx: number, name: string) => {
    setBoards(boards => boards.map((b, i) => i === idx ? { ...b, name } : b));
  };
  const updateBoardColumns = (idx: number, columns: any[]) => {
    setBoards(boards => boards.map((b, i) => i === idx ? { ...b, columns } : b));
  };
  const deleteBoard = (idx: number) => {
    setBoards(boards => boards.filter((_, i) => i !== idx));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <header className="py-8 text-center">
        <h1 className="text-5xl font-bold tracking-wide mb-2">Task Manager</h1>
        <div className="flex justify-center items-center gap-2 mb-4">
          {editingSubtitle ? (
            <input
              className="text-xl font-semibold bg-gray-900 border-b-2 border-blue-400 focus:outline-none px-2 py-1 rounded"
              value={tempSubtitle}
              autoFocus
              onChange={e => setTempSubtitle(e.target.value)}
              onBlur={() => { setEditingSubtitle(false); setSubtitle(tempSubtitle.trim() || DEFAULT_BOARD_NAME); }}
              onKeyDown={e => { if (e.key === 'Enter') { setEditingSubtitle(false); setSubtitle(tempSubtitle.trim() || DEFAULT_BOARD_NAME); } }}
            />
          ) : (
            <span className="text-xl font-semibold cursor-pointer hover:underline" onClick={() => setEditingSubtitle(true)}>{subtitle}</span>
          )}
        </div>
        <button
          className="mt-2 px-6 py-2 bg-blue-700 hover:bg-blue-800 rounded-full text-white font-medium text-lg shadow"
          onClick={addBoard}
        >
          + Add board
        </button>
      </header>
      <main className="flex-1 flex flex-col items-center px-4 pb-8">
        {boards.map((board, idx) => (
          <Board
            key={idx}
            board={board}
            onBoardNameChange={name => updateBoardName(idx, name)}
            onColumnsChange={cols => updateBoardColumns(idx, cols)}
            onDeleteBoard={() => deleteBoard(idx)}
          />
        ))}
      </main>
    </div>
  );
}

export default App;
