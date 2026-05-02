"use client";

import { useState } from "react";

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

const COLUMNS: { id: Status; label: string; color: string }[] = [
  { id: "todo", label: "To Do", color: "border-t-blue-500" },
  { id: "inprogress", label: "In Progress", color: "border-t-yellow-500" },
  { id: "done", label: "Done", color: "border-t-green-500" },
];

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [form, setForm] = useState({ title: "", assignee: "", priority: "Medium" as Priority, dueDate: "", status: "todo" as Status });
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", text: "Hi! I'm your AI team assistant powered by Gemini. Ask me about your tasks, priorities, or team workload!" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const addTask = () => {
    if (!form.title.trim()) return;
    setTasks([...tasks, { ...form, id: Date.now().toString() }]);
    setForm({ title: "", assignee: "", priority: "Medium", dueDate: "", status: "todo" });
    setShowForm(false);
  };

  const moveTask = (id: string, status: Status) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between shadow">
        <div>
          <h1 className="text-xl font-bold">TeamSync</h1>
          <p className="text-blue-200 text-sm">Team Collaboration & Task Management</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-white text-blue-600 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-blue-50 transition"
        >
          + Add Task
        </button>
      </header>

      {/* Add Task Form */}
      {showForm && (
        <div className="bg-white border-b px-6 py-4 shadow-sm">
          <div className="flex flex-wrap gap-3 items-end max-w-5xl">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Task Title *</label>
              <input
                className="border rounded-lg px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Enter task title"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                onKeyDown={e => e.key === "Enter" && addTask()}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Assignee</label>
              <input
                className="border rounded-lg px-3 py-2 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Name"
                value={form.assignee}
                onChange={e => setForm({ ...form, assignee: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Priority</label>
              <select
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.priority}
                onChange={e => setForm({ ...form, priority: e.target.value as Priority })}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Due Date</label>
              <input
                type="date"
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.dueDate}
                onChange={e => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Column</label>
              <select
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value as Status })}
              >
                <option value="todo">To Do</option>
                <option value="inprogress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <button
              onClick={addTask}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
            >
              Add Task
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-500 px-3 py-2 rounded-lg text-sm hover:bg-gray-100 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Kanban Board */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="flex gap-5 min-w-max">
            {COLUMNS.map(col => {
              const colTasks = tasks.filter(t => t.status === col.id);
              return (
                <div key={col.id} className={`bg-white rounded-xl shadow-sm border-t-4 ${col.color} w-72 p-4`}>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-semibold text-gray-700">{col.label}</h2>
                    <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-full">
                      {colTasks.length}
                    </span>
                  </div>
                  <div className="flex flex-col gap-3 min-h-[100px]">
                    {colTasks.length === 0 && (
                      <p className="text-gray-300 text-sm text-center py-6">No tasks</p>
                    )}
                    {colTasks.map(task => (
                      <div key={task.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:shadow-sm transition">
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-sm font-medium text-gray-800 flex-1">{task.title}</p>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="text-gray-300 hover:text-red-400 text-xs transition"
                            aria-label="Delete task"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1 items-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority]}`}>
                            {task.priority}
                          </span>
                          {task.assignee && (
                            <span className="text-xs text-gray-500">👤 {task.assignee}</span>
                          )}
                          {task.dueDate && (
                            <span className="text-xs text-gray-400">📅 {task.dueDate}</span>
                          )}
                        </div>
                        <div className="mt-2 flex gap-1">
                          {col.id !== "inprogress" && col.id !== "done" && (
                            <button onClick={() => moveTask(task.id, "inprogress")} className="text-xs text-blue-500 hover:underline">▶ Start</button>
                          )}
                          {col.id === "inprogress" && (
                            <button onClick={() => moveTask(task.id, "done")} className="text-xs text-green-500 hover:underline">✔ Done</button>
                          )}
                          {col.id === "done" && (
                            <button onClick={() => moveTask(task.id, "todo")} className="text-xs text-gray-400 hover:underline">↩ Reopen</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stats */}
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

        {/* AI Assistant Panel */}
        <aside className="w-80 bg-white border-l flex flex-col shadow-sm">
          <div className="px-4 py-3 border-b bg-blue-50">
            <h2 className="font-semibold text-gray-700 flex items-center gap-2">
              <span>✨</span> Gemini AI Assistant
            </h2>
            <p className="text-xs text-gray-400">Powered by Google Gemini</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}>
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
            <input
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Ask about your tasks..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              aria-label="Chat input"
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
              aria-label="Send message"
            >
              Send
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
