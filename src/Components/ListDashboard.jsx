import React, { useState, useEffect, useRef, useCallback } from "react";
import { Check, Send, Pencil, MoreHorizontal, Flag, CalendarDays, Clock, Plus, X } from "lucide-react";
import TaskDetailModal from "./TaskDetailModal";

// Constants - keep these identical to BoardDashboard so both components
// read/write the same localStorage data
const COLUMNS = ["IN PROGRESS", "TO DO", "DONE"];
const INITIAL_TASKS = { "IN PROGRESS": [], "TO DO": [], DONE: [] };
const STORAGE_KEY = "board-tasks";

function ListDashboard() {
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_TASKS;
    } catch {
      return INITIAL_TASKS;
    }
  });

  // Consolidated state for editing tasks
  const [editingTask, setEditingTask] = useState(null); // { column, id, text }

  // Consolidated state for menu
  const [menuState, setMenuState] = useState(null); // { column, id, openSubmenu }
  const menuRef = useRef(null);

  // State for task detail modal
  const [selectedTask, setSelectedTask] = useState(null); // { task, column }

  // State for creating tasks
  const [isCreating, setIsCreating] = useState(false);
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");
  const [newTaskStatus, setNewTaskStatus] = useState("TO DO");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");

  // Persist tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuState(null);
      }
    };

    if (menuState) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [menuState]);

  // Helper function to move task between columns
  const moveTask = useCallback(
    (task, fromColumn, toColumn, updatedTask = task) => {
      if (fromColumn === toColumn) return;

      setTasks((prev) => ({
        ...prev,
        [fromColumn]: prev[fromColumn].filter((t) => t.id !== task.id),
        [toColumn]: [...prev[toColumn], updatedTask],
      }));
    },
    [],
  );

  const handleStartEdit = useCallback((column, task) => {
    setEditingTask({ column, id: task.id, text: task.description });
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editingTask) return;
    const { column, id, text } = editingTask;

    setTasks((prev) => ({
      ...prev,
      [column]: prev[column].map((task) =>
        task.id === id ? { ...task, description: text } : task,
      ),
    }));
    setEditingTask(null);
  }, [editingTask]);

  const handleCancelEdit = useCallback(() => {
    setEditingTask(null);
  }, []);

  const handleDeleteTask = useCallback((column, taskId) => {
    setTasks((prev) => ({
      ...prev,
      [column]: prev[column].filter((task) => task.id !== taskId),
    }));
  }, []);

  const handleMenuClick = useCallback((column, taskId) => {
    setMenuState({ column, id: taskId, openSubmenu: null });
  }, []);

  const handleChangeStatus = useCallback(
    (newColumn, currentColumn, task) => {
      if (newColumn === currentColumn) {
        setMenuState(null);
        return;
      }

      moveTask(task, currentColumn, newColumn, {
        ...task,
        completed: newColumn === "DONE",
      });
      setMenuState(null);
    },
    [moveTask],
  );

  const handleToggleComplete = useCallback(
    (column, task) => {
      if (column === "DONE") {
        moveTask(task, "DONE", "TO DO", { ...task, completed: false });
      } else {
        moveTask(task, column, "DONE", { ...task, completed: true });
      }
    },
    [moveTask],
  );

  const handleSubMenuClick = useCallback((submenuName, e) => {
    e.stopPropagation();
    setMenuState((prev) =>
      prev && prev.openSubmenu === submenuName
        ? { ...prev, openSubmenu: null }
        : { ...prev, openSubmenu: submenuName },
    );
  }, []);

  const handleDeleteMenuClick = useCallback(
    (column, task) => {
      handleDeleteTask(column, task.id);
      setMenuState(null);
    },
    [handleDeleteTask],
  );

  // Task creation handlers
  const handleStartCreate = useCallback(() => {
    setIsCreating(true);
    setNewTaskDescription("");
    setNewTaskPriority("medium");
    setNewTaskStatus("TO DO");
    setNewTaskDueDate("");
  }, []);

  const handleCancelCreate = useCallback(() => {
    setIsCreating(false);
    setNewTaskDescription("");
    setNewTaskPriority("medium");
    setNewTaskStatus("TO DO");
    setNewTaskDueDate("");
  }, []);

  const handleSaveNewTask = useCallback(() => {
    if (newTaskDescription.trim()) {
      setTasks((prev) => ({
        ...prev,
        [newTaskStatus]: [
          ...prev[newTaskStatus],
          {
            id: Date.now(),
            description: newTaskDescription,
            completed: newTaskStatus === "DONE",
            priority: newTaskPriority,
            dueDate: newTaskDueDate || null,
            createdAt: new Date().toISOString(),
          },
        ],
      }));
      setIsCreating(false);
      setNewTaskDescription("");
      setNewTaskPriority("medium");
      setNewTaskStatus("TO DO");
      setNewTaskDueDate("");
    }
  }, [newTaskDescription, newTaskPriority, newTaskStatus, newTaskDueDate]);

  // Open task detail modal
  const handleOpenTask = useCallback((column, task) => {
    setSelectedTask({ task, column });
  }, []);

  // Update task fields from modal
  const handleUpdateTask = useCallback((column, taskId, updates) => {
    setTasks((prev) => ({
      ...prev,
      [column]: prev[column].map((task) =>
        task.id === taskId ? { ...task, ...updates } : task
      ),
    }));
    setSelectedTask((prev) => {
      if (prev && prev.task.id === taskId && prev.column === column) {
        return { ...prev, task: { ...prev.task, ...updates } };
      }
      return prev;
    });
  }, []);

  // Handle status change from modal (moves task between columns)
  const handleModalChangeStatus = useCallback((newColumn, currentColumn, task) => {
    if (newColumn === currentColumn) return;
    moveTask(task, currentColumn, newColumn, {
      ...task,
      completed: newColumn === "DONE",
    });
    setSelectedTask((prev) => {
      if (prev && prev.task.id === task.id) {
        return { ...prev, column: newColumn };
      }
      return prev;
    });
  }, [moveTask]);

  const getToday = () => new Date().toISOString().split("T")[0];

  // Flatten tasks for table view
  const allTasks = COLUMNS.flatMap((column) =>
    tasks[column].map((task) => ({ ...task, status: column })),
  );

  // Format due date for display
  const formatDueDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.getTime() === today.getTime()) return "Today";
    if (date.getTime() === tomorrow.getTime()) return "Tomorrow";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Get color class for due date
  const getDueDateColor = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today) return "text-red-500 bg-red-50";
    if (date.getTime() === today.getTime()) return "text-orange-600 bg-orange-50";
    return "text-green-600 bg-green-50";
  };

  // Format createdAt timestamp
  const formatCreatedAt = (isoStr) => {
    if (!isoStr) return "—";
    const date = new Date(isoStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) + ", " + date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="p-6 h-full bg-white">
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs font-semibold text-slate-500 uppercase">
              <th className="px-4 py-3 w-10">
                <input type="checkbox" />
              </th>
              <th className="px-4 py-3">Work</th>
              <th className="px-4 py-3 w-24">Priority</th>
              <th className="px-4 py-3 w-36">Due Date</th>
              <th className="px-4 py-3 w-44">Created</th>
              <th className="px-4 py-3 w-44">Status</th>
              <th className="px-4 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {allTasks.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-6 text-center text-sm text-slate-400"
                >
                  No tasks yet.
                </td>
              </tr>
            )}

            {allTasks.map((task) => (
              <tr
                key={task.id}
                className="border-b border-slate-100 hover:bg-slate-50 group"
              >
                {/* Checkbox - toggles complete/reopen */}
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={task.status === "DONE"}
                    onChange={() => handleToggleComplete(task.status, task)}
                  />
                </td>

                {/* Description / Edit mode */}
                <td className="px-4 py-3 text-sm">
                  {editingTask &&
                  editingTask.column === task.status &&
                  editingTask.id === task.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editingTask.text}
                        onChange={(e) =>
                          setEditingTask((prev) => ({
                            ...prev,
                            text: e.target.value,
                          }))
                        }
                        className="flex-1 border border-blue-300 rounded px-2 py-1 text-sm outline-none"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit();
                          if (e.key === "Escape") handleCancelEdit();
                        }}
                      />
                      <button
                        onClick={handleSaveEdit}
                        className="text-orange-600 hover:text-orange-700"
                        title="Save"
                      >
                        <Send size={14} />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="text-slate-400 hover:text-slate-600 text-xs"
                        title="Cancel"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span
                        onClick={() => handleOpenTask(task.status, task)}
                        className={`cursor-pointer hover:text-blue-600 transition-colors ${
                          task.status === "DONE"
                            ? "line-through text-slate-400"
                            : "text-slate-700"
                        }`}
                      >
                        {task.description}
                      </span>
                      <button
                        onClick={() => handleStartEdit(task.status, task)}
                        className="text-blue-600 hover:text-blue-800 transition-opacity opacity-0 group-hover:opacity-100"
                        title="Edit task"
                      >
                        <Pencil size={14} />
                      </button>
                    </div>
                  )}
                </td>

                {/* Priority column */}
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center gap-2">
                    {task.priority && (
                      <>
                        <Flag
                          size={14}
                          className={
                            task.priority === "high"
                              ? "text-red-500"
                              : task.priority === "medium"
                                ? "text-yellow-600"
                                : "text-blue-500"
                          }
                          fill={
                            task.priority === "high" || task.priority === "medium"
                              ? "currentColor"
                              : "none"
                          }
                        />
                        <span className="capitalize text-slate-700 font-medium">
                          {task.priority}
                        </span>
                      </>
                    )}
                  </div>
                </td>

                {/* Due Date column */}
                <td className="px-4 py-3 text-sm">
                  {task.dueDate ? (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${getDueDateColor(task.dueDate)}`}>
                      <CalendarDays size={12} />
                      {formatDueDate(task.dueDate)}
                    </span>
                  ) : (
                    <span className="text-slate-300 text-xs">—</span>
                  )}
                </td>

                {/* Created column */}
                <td className="px-4 py-3 text-sm">
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <Clock size={12} className="text-slate-400" />
                    {formatCreatedAt(task.createdAt)}
                  </span>
                </td>

                {/* Status dropdown */}
                <td className="px-4 py-3">
                  <select
                    value={task.status}
                    onChange={(e) =>
                      handleChangeStatus(e.target.value, task.status, task)
                    }
                    className={`text-xs font-medium px-2 py-1 rounded-md border-0 cursor-pointer outline-none ${
                      task.status === "DONE"
                        ? "bg-green-100 text-green-700"
                        : task.status === "IN PROGRESS"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {COLUMNS.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </td>

                {/* More options menu */}
                <td className="px-4 py-3 relative">
                  <div
                    ref={
                      menuState &&
                      menuState.column === task.status &&
                      menuState.id === task.id
                        ? menuRef
                        : null
                    }
                  >
                    <button
                      onClick={() => handleMenuClick(task.status, task.id)}
                      className="text-slate-500 hover:text-slate-700 transition-colors p-1 hover:bg-slate-100 rounded"
                      title="More options"
                    >
                      <MoreHorizontal size={18} />
                    </button>

                    {menuState &&
                      menuState.column === task.status &&
                      menuState.id === task.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                          {/* Change status with submenu */}
                          <div className="relative">
                            <button
                              onClick={(e) =>
                                handleSubMenuClick("changeStatus", e)
                              }
                              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-between"
                            >
                              <span>Change status</span>
                              <span
                                className={`transition-transform ${
                                  menuState.openSubmenu === "changeStatus"
                                    ? "rotate-90"
                                    : ""
                                }`}
                              >
                                &gt;
                              </span>
                            </button>

                            {menuState.openSubmenu === "changeStatus" && (
                              <div className="absolute left-full top-0 ml-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg">
                                {COLUMNS.map((col) => (
                                  <button
                                    key={col}
                                    onClick={() =>
                                      handleChangeStatus(
                                        col,
                                        task.status,
                                        task,
                                      )
                                    }
                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-100 transition-colors ${
                                      col === task.status
                                        ? "bg-blue-100 text-blue-700 font-medium"
                                        : "text-slate-700"
                                    }`}
                                  >
                                    {col}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() =>
                              handleDeleteMenuClick(task.status, task)
                            }
                            className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-slate-100 transition-colors border-t border-slate-200"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Inline Create Row */}
        {isCreating ? (
          <div className="border-t border-slate-200 bg-blue-50 px-4 py-3">
            <div className="flex items-center gap-3">
              {/* Task Description */}
              <div className="flex-1">
                <input
                  type="text"
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  placeholder="What needs to be done?"
                  className="w-full bg-white border border-blue-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveNewTask();
                    if (e.key === "Escape") handleCancelCreate();
                  }}
                />
              </div>

              {/* Priority Selector */}
              <div className="relative">
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value)}
                  className={`text-xs font-medium px-2 py-2 rounded-lg border-0 cursor-pointer outline-none appearance-none pr-6 ${
                    newTaskPriority === "high"
                      ? "bg-red-100 text-red-700"
                      : newTaskPriority === "medium"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-blue-100 text-blue-700"
                  }`}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <Flag size={12} className={`absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                  newTaskPriority === "high" ? "text-red-500" : newTaskPriority === "medium" ? "text-yellow-600" : "text-blue-500"
                }`} />
              </div>

              {/* Due Date */}
              <div className="relative">
                <input
                  type="date"
                  value={newTaskDueDate}
                  min={getToday()}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="text-xs bg-white border border-slate-300 rounded-lg px-2 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
                />
              </div>

              {/* Status Selector */}
              <select
                value={newTaskStatus}
                onChange={(e) => setNewTaskStatus(e.target.value)}
                className={`text-xs font-medium px-2 py-2 rounded-lg border-0 cursor-pointer outline-none ${
                  newTaskStatus === "DONE"
                    ? "bg-green-100 text-green-700"
                    : newTaskStatus === "IN PROGRESS"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-slate-100 text-slate-700"
                }`}
              >
                {COLUMNS.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>

              {/* Save Button */}
              <button
                onClick={handleSaveNewTask}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium flex items-center gap-1"
              >
                <Send size={14} />
                Save
              </button>

              {/* Cancel Button */}
              <button
                onClick={handleCancelCreate}
                className="bg-slate-200 text-slate-600 p-2 rounded-lg hover:bg-slate-300 transition-colors"
                title="Cancel"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleStartCreate}
            className="w-full border-t border-slate-200 px-4 py-3 text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors flex items-center gap-2 font-medium"
          >
            <Plus size={16} />
            Add Task
          </button>
        )}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask.task}
          column={selectedTask.column}
          onClose={() => setSelectedTask(null)}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          onChangeStatus={handleModalChangeStatus}
        />
      )}
    </div>
  );
}

export default ListDashboard;