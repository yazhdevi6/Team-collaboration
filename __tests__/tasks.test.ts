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

const filterByStatus = (tasks: Task[], status: Status) => tasks.filter(t => t.status === status);
const filterByPriority = (tasks: Task[], priority: Priority) => tasks.filter(t => t.priority === priority);
const deleteTask = (tasks: Task[], id: string) => tasks.filter(t => t.id !== id);
const isOverdue = (dueDate: string) => dueDate ? new Date(dueDate) < new Date() : false;
const countByStatus = (tasks: Task[]) => ({
  todo: tasks.filter(t => t.status === "todo").length,
  inprogress: tasks.filter(t => t.status === "inprogress").length,
  done: tasks.filter(t => t.status === "done").length,
});

const sampleTasks: Task[] = [
  { id: "1", title: "Design UI", assignee: "Alice", priority: "High", dueDate: "2026-01-01", status: "todo" },
  { id: "2", title: "Write tests", assignee: "Bob", priority: "Medium", dueDate: "2026-12-31", status: "inprogress" },
  { id: "3", title: "Deploy app", assignee: "Alice", priority: "High", dueDate: "2026-12-31", status: "done" },
  { id: "4", title: "Fix bug", assignee: "", priority: "Low", dueDate: "", status: "todo" },
];

describe("Task filtering", () => {
  test("filters tasks by status - todo", () => {
    expect(filterByStatus(sampleTasks, "todo")).toHaveLength(2);
  });

  test("filters tasks by status - inprogress", () => {
    expect(filterByStatus(sampleTasks, "inprogress")).toHaveLength(1);
  });

  test("filters tasks by status - done", () => {
    expect(filterByStatus(sampleTasks, "done")).toHaveLength(1);
  });

  test("filters tasks by priority - High", () => {
    expect(filterByPriority(sampleTasks, "High")).toHaveLength(2);
  });

  test("filters tasks by priority - Low", () => {
    expect(filterByPriority(sampleTasks, "Low")).toHaveLength(1);
  });
});

describe("Task deletion", () => {
  test("deletes a task by id", () => {
    const result = deleteTask(sampleTasks, "1");
    expect(result).toHaveLength(3);
    expect(result.find(t => t.id === "1")).toBeUndefined();
  });

  test("returns same array when id not found", () => {
    expect(deleteTask(sampleTasks, "999")).toHaveLength(4);
  });
});

describe("Overdue detection", () => {
  test("detects overdue task", () => {
    expect(isOverdue("2020-01-01")).toBe(true);
  });

  test("not overdue for future date", () => {
    expect(isOverdue("2099-01-01")).toBe(false);
  });

  test("returns false for empty due date", () => {
    expect(isOverdue("")).toBe(false);
  });
});

describe("Task counts", () => {
  test("counts tasks correctly per status", () => {
    const counts = countByStatus(sampleTasks);
    expect(counts.todo).toBe(2);
    expect(counts.inprogress).toBe(1);
    expect(counts.done).toBe(1);
  });

  test("returns zeros for empty task list", () => {
    const counts = countByStatus([]);
    expect(counts.todo).toBe(0);
    expect(counts.inprogress).toBe(0);
    expect(counts.done).toBe(0);
  });
});
