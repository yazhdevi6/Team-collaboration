"use client";

import { useState, useMemo } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

type Priority = "Low" | "Medium" | "High";
type Status = "todo" | "inprogress" | "done";

interface Task {
  id: string;
  title: string;
  assignee: string;
  priority: Priority;
  dueDate: string;
  status: Status;
}

interface Message {
  role: "user" | "assistant";
  text: string;
}

const PRIORITY_COLORS: Record<Priority, string> = {
  Low: "bg-green-100 text-green-700",
  Medium: "bg-yellow-100 text-yellow-700",
  High: "bg-red-100 text-red-700",
};

const COLUMNS: { id: Status; label: string; color: string; bar: string }[] = [
  { id: "todo", label: "To Do", color: "border-t-blue-500", bar: "bg-blue-500" },
  { id: "inprogress", label: "In Progress", color: "border-t-yellow-500", bar: "bg-yellow-500" },
  { id: "done", label: "Done", color: "border-t-green-500", bar: "bg-green-500" },
];

const EMPTY_FORM = { title: "", assignee: "", priority: "Medium" as Priority, dueDate: "", status: "todo" as Status };

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", text: "Hi! I'm your AI team assistant powered by Gemini. Ask me about your tasks, priorities, or team workload!" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState<"All" | Priority>("All");
  const [filterAssignee, setFilterAssignee] = useState("All");

  const assignees = useMemo(() => {
    const set = new Set(tasks.map(t => t.assignee).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [tasks]);

  const visibleTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter(t => {
      if (q && !t.title.toLowerCase().includes(q) && !t.assignee.toLowerCase().includes(q)) return false;
      if (filterPriority !== "All" && t.priority !== filterPriority) return false;
      if (filterAssignee !== "All" && t.assignee !== filterAssignee) return false;
      return true;
    });
  }, [tasks, search, filterPriority, filterAssignee]);

  const submitForm = () => {
    if (!form.title.trim()) return;
    if (editingId) {
      setTasks(tasks.map(t => (t.id === editingId ? { ...form, id: editingId } : t)));
    } else {
      setTasks([...tasks, { ...form, id: Date.now().toString() }]);
    }
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (task: Task) => {
    setForm({ title: task.title, assignee: task.assignee, priority: task.priority, dueDate: task.dueDate, status: task.status });
    setEditingId(task.id);
    setShowForm(true);
  };

  const cancelForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const deleteTask = (id: string) => setTasks(tasks.filter(t => t.id !== id));

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newStatus = destination.droppableId as Status;
    const reordered = [...tasks];
    const taskIndex = reordered.findIndex(t => t.id === draggableId);
    const [moved] = reordered.splice(taskIndex, 1);
    moved.status = newStatus;

    const destTasks = reordered.filter(t => t.status === newStatus);
    const otherTasks = reordered.filter(t => t.status !== newStatus);
    destTasks.splice(destination.index, 0, moved);

    setTasks([...otherTasks, ...destTasks]);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, tasks }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", text: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "Something went wrong. Please try again." }]);
    }
    setLoading(false);
  };

  const totalCount = tasks.length;
  const doneCount = tasks.filter(t => t.status === "done").length;
  const overallProgress = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between shadow">
        <div>
          <h1 className="text-xl font-bold">TeamSync</h1>
          <p className="text-blue-200 text-sm">Team Collaboration & Task Management</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-xs text-blue-100">Overall Progress</span>
            <div className="flex items-center gap-2">
              <div className="w-32 bg-blue-800/40 rounded-full h-2 overflow-hidden">
                <div className="bg-white h-full transition-all duration-500" style={{ width: `${overallProgress}%` }} />
              </div>
              <span className="text-xs font-semibold w-9 text-right">{overallProgress}%</span>
            </div>
          </div>
          <button onClick={() => (showForm ? cancelForm() : setShowForm(true))} className="bg-white text-blue-600 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-blue-50 transition">
            + Add Task
          </button>
        </div>
      </header>

      {showForm && (
        <div className="bg-white border-b px-6 py-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 mb-3">{editingId ? "Edit Task" : "Create New Task"}</p>
          <div className="flex flex-wrap gap-3 items-end max-w-5xl">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Task Title *</label>
              <input className="border rounded-lg px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="Enter task title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} onKeyDown={e => e.key === "Enter" && submitForm()} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Assignee</label>
              <input className="border rounded-lg px-3 py-2 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="Name" value={form.assignee} onChange={e => setForm({ ...form, assignee: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Priority</label>
              <select className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as Priority })}>
                <option>Low</option><option>Medium</option><option>High</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Due Date</label>
              <input type="date" className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Column</label>
              <select className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Status })}>
                <option value="todo">To Do</option><option value="inprogress">In Progress</option><option value="done">Done</option>
              </select>
            </div>
            <button onClick={submitForm} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition">{editingId ? "Save Changes" : "Add Task"}</button>
            <button onClick={cancelForm} className="text-gray-500 px-3 py-2 rounded-lg text-sm hover:bg-gray-100 transition">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white border-b px-6 py-3 flex flex-wrap gap-3 items-center">
        <input
          type="search"
          placeholder="🔍 Search tasks or assignees..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search tasks"
          className="border rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <select
          aria-label="Filter by priority"
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value as "All" | Priority)}
        >
          <option value="All">All Priorities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <select
          aria-label="Filter by assignee"
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={filterAssignee}
          onChange={e => setFilterAssignee(e.target.value)}
        >
          {assignees.map(a => (
            <option key={a} value={a}>{a === "All" ? "All Assignees" : a}</option>
          ))}
        </select>
        {(search || filterPriority !== "All" || filterAssignee !== "All") && (
          <button onClick={() => { setSearch(""); setFilterPriority("All"); setFilterAssignee("All"); }} className="text-xs text-blue-600 hover:underline">
            Clear filters
          </button>
        )}
        <span className="text-xs text-gray-400 ml-auto">Showing {visibleTasks.length} of {tasks.length} tasks</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 p-6 overflow-auto">
          <p className="text-xs text-gray-400 mb-3">✦ Drag and drop tasks between columns • Click ✎ to edit</p>
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-5 min-w-max">
              {COLUMNS.map(col => {
                const allColTasks = tasks.filter(t => t.status === col.id);
                const colTasks = visibleTasks.filter(t => t.status === col.id);
                const colDone = col.id === "done" ? allColTasks.length : 0;
                const progressPct = totalCount === 0 ? 0 : Math.round((allColTasks.length / totalCount) * 100);
                return (
                  <div key={col.id} className={`bg-white rounded-xl shadow-sm border-t-4 ${col.color} w-72 p-4`}>
                    <div className="flex justify-between items-center mb-2">
                      <h2 className="font-semibold text-gray-700">{col.label}</h2>
                      <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-full">{colTasks.length}{colTasks.length !== allColTasks.length && `/${allColTasks.length}`}</span>
                    </div>
                    <div className="mb-3">
                      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className={`${col.bar} h-full transition-all duration-500`} style={{ width: `${progressPct}%` }} />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">{progressPct}% of all tasks{col.id === "done" && totalCount > 0 ? ` • ${colDone} completed` : ""}</p>
                    </div>
                    <Droppable droppableId={col.id}>
                      {(provided, snapshot) => (
                        <div ref={provided.innerRef} {...provided.droppableProps} className={`flex flex-col gap-3 min-h-[100px] rounded-lg transition-colors ${snapshot.isDraggingOver ? "bg-blue-50 border-2 border-dashed border-blue-300" : ""}`}>
                          {colTasks.length === 0 && !snapshot.isDraggingOver && (
                            <p className="text-gray-300 text-sm text-center py-6">{allColTasks.length === 0 ? "No tasks" : "No matches"}</p>
                          )}
                          {colTasks.map((task, index) => (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-gray-50 border border-gray-200 rounded-lg p-3 transition ${snapshot.isDragging ? "shadow-lg rotate-1 bg-white border-blue-300" : "hover:shadow-sm"}`}
                                >
                                  <div className="flex justify-between items-start gap-2">
                                    <p className="text-sm font-medium text-gray-800 flex-1">{task.title}</p>
                                    <div className="flex gap-1">
                                      <button onClick={() => startEdit(task)} className="text-gray-300 hover:text-blue-500 text-xs transition" aria-label="Edit task">✎</button>
                                      <button onClick={() => deleteTask(task.id)} className="text-gray-300 hover:text-red-400 text-xs transition" aria-label="Delete task">✕</button>
                                    </div>
                                  </div>
                                  <div className="mt-2 flex flex-wrap gap-1 items-center">
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                                    {task.assignee && <span className="text-xs text-gray-500">👤 {task.assignee}</span>}
                                    {task.dueDate && (
                                      <span className={`text-xs ${new Date(task.dueDate) < new Date() && task.status !== "done" ? "text-red-500 font-semibold" : "text-gray-400"}`}>
                                        📅 {task.dueDate}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>

          <div className="mt-6 flex gap-4">
            {[
              { label: "Total Tasks", value: tasks.length, color: "text-blue-600" },
              { label: "In Progress", value: tasks.filter(t => t.status === "inprogress").length, color: "text-yellow-600" },
              { label: "Completed", value: tasks.filter(t => t.status === "done").length, color: "text-green-600" },
              { label: "High Priority", value: tasks.filter(t => t.priority === "High").length, color: "text-red-600" },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-xl shadow-sm p-4 flex-1 text-center">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </main>

        <aside className="w-80 bg-white border-l flex flex-col shadow-sm">
          <div className="px-4 py-3 border-b bg-blue-50">
            <h2 className="font-semibold text-gray-700 flex items-center gap-2"><span>✨</span> Gemini AI Assistant</h2>
            <p className="text-xs text-gray-400">Powered by Google Gemini</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${msg.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-xl px-3 py-2 text-sm text-gray-400">Thinking...</div>
              </div>
            )}
          </div>
          <div className="p-3 border-t flex gap-2">
            <input className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="Ask about your tasks..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} aria-label="Chat input" />
            <button onClick={sendMessage} disabled={loading} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition" aria-label="Send message">Send</button>
          </div>
        </aside>
      </div>
    </div>
  );
}
