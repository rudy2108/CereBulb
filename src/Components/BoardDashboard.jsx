import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  User,
  Funnel,
  Check,
  Clock,
  UserPlus,
  Send,
  Pencil,
  MoreHorizontal,
  Flag,
  CalendarDays,
  X,
} from "lucide-react";
import TaskDetailModal from "./TaskDetailModal";

// Constants
const COLUMNS = ["IN PROGRESS", "TO DO", "DONE"];
const INITIAL_TASKS = { "IN PROGRESS": [], "TO DO": [], DONE: [] };
const STORAGE_KEY = "board-tasks";

function BoardDashboard() {
  const [filterOpen, setFilterOpen] = useState(false);

  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_TASKS;
    } catch {
      return INITIAL_TASKS;
    }
  });

  // Consolidated state for creating tasks
  const [creatingColumn, setCreatingColumn] = useState(null);
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium"); // low, medium, high
  const [priorityDropdownOpen, setPriorityDropdownOpen] = useState(false);
  const [taskDueDate, setTaskDueDate] = useState("");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const datePickerRef = useRef(null);

  // Consolidated state for editing tasks
  const [editingTask, setEditingTask] = useState(null); // { column, id, text }

  // Consolidated state for menu
  const [menuState, setMenuState] = useState(null); // { column, id, openSubmenu }
  const menuRef = useRef(null);

  // State for task detail modal
  const [selectedTask, setSelectedTask] = useState(null); // { task, column }

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

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setDatePickerOpen(false);
      }
    };

    if (datePickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [datePickerOpen]);

  // Memoized handlers
  const handleFilterClick = useCallback(() => {
    setFilterOpen((prev) => !prev);
  }, []);

  const handleCreateClick = useCallback((column) => {
    setCreatingColumn(column);
    setTaskDescription("");
    setTaskPriority("medium");
    setPriorityDropdownOpen(false);
    setTaskDueDate("");
    setDatePickerOpen(false);
  }, []);

  const handleSaveTask = useCallback(() => {
    if (taskDescription.trim()) {
      setTasks((prev) => ({
        ...prev,
        [creatingColumn]: [
          ...prev[creatingColumn],
          { id: Date.now(), description: taskDescription, completed: false, priority: taskPriority, dueDate: taskDueDate || null, createdAt: new Date().toISOString() },
        ],
      }));
      setCreatingColumn(null);
      setTaskDescription("");
      setTaskPriority("medium");
      setTaskDueDate("");
      setDatePickerOpen(false);
    }
  }, [taskDescription, creatingColumn, taskPriority, taskDueDate]);

  const handleCancelCreate = useCallback(() => {
    setCreatingColumn(null);
    setTaskDescription("");
    setTaskPriority("medium");
    setPriorityDropdownOpen(false);
    setTaskDueDate("");
    setDatePickerOpen(false);
  }, []);

  // Helper to format date for display
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

  // Helper to get due date color
  const getDueDateColor = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today) return "text-red-500 bg-red-50";
    if (date.getTime() === today.getTime()) return "text-orange-600 bg-orange-50";
    return "text-green-600 bg-green-50";
  };

  // Quick date helpers
  const getToday = () => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  };
  const getTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  };
  const getNextWeek = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  };

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

      moveTask(task, currentColumn, newColumn);
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
        : { ...prev, openSubmenu: submenuName }
    );
  }, []);

  const handleDeleteMenuClick = useCallback(
    (column, task) => {
      handleDeleteTask(column, task.id);
      setMenuState(null);
    },
    [handleDeleteTask],
  );

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
    // Also update selectedTask if it's the one being edited
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
    moveTask(task, currentColumn, newColumn);
    // Update selectedTask's column
    setSelectedTask((prev) => {
      if (prev && prev.task.id === task.id) {
        return { ...prev, column: newColumn };
      }
      return prev;
    });
  }, [moveTask]);

  return (
    <div className="p-6 h-full bg-white">
      <div className="flex items-center gap-3 mb-6">
        {/* Search Box */}
        <div className="group flex items-center gap-2 border border-slate-300 rounded-md px-3 py-2 w-56 focus-within:border-blue-500">
          <Search
            size={20}
            className="text-slate-500 group-focus-within:text-blue-500"
          />
          <input
            type="text"
            placeholder="Search board"
            className="outline-none w-full text-slate-700"
          />
        </div>

        {/* User Icons */}
        <div className="flex items-center">
          <div className="w-9 h-9 rounded-full border border-slate-300 flex items-center justify-center bg-gray-100">
            <User size={18} className="text-slate-500" />
          </div>

          <div className="w-9 h-9 rounded-full bg-orange-600 text-white flex items-center justify-center -ml-1 text-sm font-medium">
            RT
          </div>
        </div>

        {/* Filter Button */}
        <button
          onClick={handleFilterClick}
          className="flex items-center gap-2 border border-slate-300 rounded-md px-4 py-2 hover:bg-slate-100 cursor-pointer transition-colors"
        >
          <Funnel size={18} />
          <span>Filter</span>
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-6 mt-6">
        {COLUMNS.map((column) => (
          <div key={column} className="bg-gray-50 rounded-lg p-4 w-80">
            {/* Column Header */}
            <h2 className="font-medium text-slate-600 mb-4 text-sm flex items-center gap-2">
              {column}
              {column === "DONE" && <span className="text-green-600">✓</span>}
            </h2>

            {/* Cards Container */}
            <div className="space-y-3">
              {tasks[column].map((task) => (
                <div
                  key={task.id}
                  className="group p-3 bg-white border border-slate-200 rounded-md shadow-sm hover:shadow-md transition-shadow"
                >
                  {editingTask &&
                  editingTask.column === column &&
                  editingTask.id === task.id ? (
                    /* Edit mode */
                    <div>
                      <textarea
                        value={editingTask.text}
                        onChange={(e) =>
                          setEditingTask((prev) => ({
                            ...prev,
                            text: e.target.value,
                          }))
                        }
                        className="w-full bg-transparent text-sm text-slate-700 outline-none resize-none mb-2 border border-blue-300 rounded p-1"
                        rows="3"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveEdit}
                          className="flex-1 bg-orange-600 text-white py-1 rounded-md hover:bg-orange-700 transition-colors text-xs font-medium flex items-center justify-center gap-1"
                        >
                          <Send size={14} /> Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="flex-1 bg-slate-200 text-slate-700 py-1 rounded-md hover:bg-slate-300 transition-colors text-xs font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Normal display mode */
                    <>
                      {/* Task Header with Edit Button and Menu */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-1">
                          {task.priority && (
                            <Flag
                              size={14}
                              className={`flex-shrink-0 ${
                                task.priority === "high"
                                  ? "text-red-500"
                                  : task.priority === "medium"
                                    ? "text-yellow-600"
                                    : "text-blue-500"
                              }`}
                              fill={
                                task.priority === "high"
                                  ? "currentColor"
                                  : task.priority === "medium"
                                    ? "currentColor"
                                    : "none"
                              }
                            />
                          )}
                          <p
                            onClick={() => handleOpenTask(column, task)}
                            className={`text-sm font-medium cursor-pointer hover:text-blue-600 transition-colors ${
                              column === "DONE"
                                ? "line-through text-slate-400"
                                : "text-slate-700"
                            }`}
                          >
                            {task.description}
                          </p>
                          <button
                            onClick={() => handleStartEdit(column, task)}
                            className="text-blue-600 hover:text-blue-800 transition-opacity flex-shrink-0 opacity-0 group-hover:opacity-100"
                            title="Edit task"
                          >
                            <Pencil size={16} />
                          </button>
                        </div>

                        {/* More Options Menu */}
                        <div
                          className="relative"
                          ref={
                            menuState &&
                            menuState.column === column &&
                            menuState.id === task.id
                              ? menuRef
                              : null
                          }
                        >
                          <button
                            onClick={() => handleMenuClick(column, task.id)}
                            className="text-slate-500 hover:text-slate-700 transition-colors flex-shrink-0 p-1 hover:bg-slate-100 rounded"
                            title="More options"
                          >
                            <MoreHorizontal size={18} />
                          </button>

                          {/* Dropdown Menu */}
                          {menuState &&
                            menuState.column === column &&
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
                                      className={`transition-transform ${menuState.openSubmenu === "changeStatus" ? "rotate-90" : ""}`}
                                    >
                                      &gt;
                                    </span>
                                  </button>

                                  {/* Change Status Submenu */}
                                  {menuState.openSubmenu === "changeStatus" && (
                                    <div className="absolute left-full top-0 ml-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg">
                                      {COLUMNS.map((col) => (
                                        <button
                                          key={col}
                                          onClick={() =>
                                            handleChangeStatus(
                                              col,
                                              column,
                                              task,
                                            )
                                          }
                                          className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-100 transition-colors ${
                                            col === column
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
                                    handleDeleteMenuClick(column, task)
                                  }
                                  className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-slate-100 transition-colors border-t border-slate-200"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                        </div>
                      </div>

                      {/* Task Actions */}
                      <div className="flex items-center gap-3 text-xs">
                        <button
                          onClick={() => handleToggleComplete(column, task)}
                          className={`flex items-center gap-1 ${
                            column === "DONE"
                              ? "text-slate-500 hover:text-slate-700"
                              : "text-green-600 hover:text-green-800"
                          }`}
                        >
                          <Check size={14} />
                          {column === "DONE" ? "Reopen" : "Complete"}
                        </button>
                        {task.dueDate && (
                          <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${getDueDateColor(task.dueDate)}`}>
                            <CalendarDays size={12} />
                            {formatDueDate(task.dueDate)}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}

              {/* Creating Card - Inline */}
              {creatingColumn === column ? (
                <div className="p-3 bg-blue-50 border border-blue-400 rounded-md">
                  <textarea
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="What needs to be done?"
                    className="w-full bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none resize-none mb-3"
                    rows="3"
                    autoFocus
                  />

                  {/* Icons Row */}
                  <div className="flex items-center gap-2 mb-3">
                    <button className="p-1 hover:bg-blue-100 rounded transition-colors text-slate-500">
                      <Check size={18} />
                    </button>
                    <div className="relative" ref={datePickerRef}>
                      <button
                        onClick={() => { setDatePickerOpen(!datePickerOpen); setPriorityDropdownOpen(false); }}
                        className={`p-1 rounded transition-colors ${
                          taskDueDate
                            ? "bg-blue-100 text-blue-600"
                            : "text-slate-500 hover:bg-blue-100"
                        }`}
                        title={taskDueDate ? `Due: ${formatDueDate(taskDueDate)}` : "Set due date"}
                      >
                        <Clock size={18} />
                      </button>

                      {/* Date Picker Popup */}
                      {datePickerOpen && (
                        <div className="absolute left-0 bottom-full mb-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden">
                          {/* Header */}
                          <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-500">
                            <span className="text-white text-xs font-semibold">Set Due Date</span>
                            <button
                              onClick={() => setDatePickerOpen(false)}
                              className="text-white/80 hover:text-white transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>

                          {/* Quick Options */}
                          <div className="p-2 space-y-1">
                            <button
                              onClick={() => { setTaskDueDate(getToday()); setDatePickerOpen(false); }}
                              className={`w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-2 ${
                                taskDueDate === getToday()
                                  ? "bg-blue-100 text-blue-700 font-medium"
                                  : "text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              <CalendarDays size={14} className="text-orange-500" />
                              Today
                            </button>
                            <button
                              onClick={() => { setTaskDueDate(getTomorrow()); setDatePickerOpen(false); }}
                              className={`w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-2 ${
                                taskDueDate === getTomorrow()
                                  ? "bg-blue-100 text-blue-700 font-medium"
                                  : "text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              <CalendarDays size={14} className="text-yellow-500" />
                              Tomorrow
                            </button>
                            <button
                              onClick={() => { setTaskDueDate(getNextWeek()); setDatePickerOpen(false); }}
                              className={`w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-2 ${
                                taskDueDate === getNextWeek()
                                  ? "bg-blue-100 text-blue-700 font-medium"
                                  : "text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              <CalendarDays size={14} className="text-green-500" />
                              Next Week
                            </button>
                          </div>

                          {/* Divider */}
                          <div className="border-t border-slate-200 mx-2" />

                          {/* Custom Date Input */}
                          <div className="p-2">
                            <label className="text-xs text-slate-500 font-medium mb-1 block px-1">Custom date</label>
                            <input
                              type="date"
                              value={taskDueDate}
                              min={getToday()}
                              onChange={(e) => { setTaskDueDate(e.target.value); setDatePickerOpen(false); }}
                              className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                            />
                          </div>

                          {/* Clear Button */}
                          {taskDueDate && (
                            <div className="p-2 border-t border-slate-200">
                              <button
                                onClick={() => { setTaskDueDate(""); setDatePickerOpen(false); }}
                                className="w-full text-center px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors font-medium"
                              >
                                Clear Due Date
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <button className="p-1 hover:bg-blue-100 rounded transition-colors text-slate-500">
                      <UserPlus size={18} />
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => { setPriorityDropdownOpen(!priorityDropdownOpen); setDatePickerOpen(false); }}
                        className={`p-1 rounded transition-colors ${
                          taskPriority === "high"
                            ? "bg-red-100 text-red-500"
                            : taskPriority === "medium"
                              ? "bg-yellow-100 text-yellow-600"
                              : "bg-blue-100 text-slate-500"
                        } hover:opacity-80`}
                        title={`Priority: ${taskPriority}`}
                      >
                        <Flag size={18} />
                      </button>
                      {priorityDropdownOpen && (
                        <div className="absolute left-0 mt-1 w-32 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                          {["low", "medium", "high"].map((priority) => (
                            <button
                              key={priority}
                              onClick={() => {
                                setTaskPriority(priority);
                                setPriorityDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2 text-sm capitalize hover:bg-slate-100 transition-colors flex items-center gap-2 ${
                                taskPriority === priority
                                  ? priority === "high"
                                    ? "bg-red-100 text-red-700"
                                    : priority === "medium"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-blue-100 text-blue-700"
                                  : "text-slate-700"
                              }`}
                            >
                              <Flag
                                size={14}
                                className={
                                  priority === "high"
                                    ? "text-red-500"
                                    : priority === "medium"
                                      ? "text-yellow-600"
                                      : "text-blue-500"
                                }
                                fill={priority === "high" || priority === "medium" ? "currentColor" : "none"}
                              />
                              {priority}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Due Date Badge */}
                  {taskDueDate && (
                    <div className={`flex items-center gap-1 mb-3 px-2 py-1 rounded-md text-xs font-medium w-fit ${getDueDateColor(taskDueDate)}`}>
                      <CalendarDays size={12} />
                      <span>Due: {formatDueDate(taskDueDate)}</span>
                      <button
                        onClick={() => setTaskDueDate("")}
                        className="ml-1 hover:opacity-70 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveTask}
                      className="flex-1 bg-orange-600 text-white py-1.5 rounded-md hover:bg-orange-700 transition-colors font-medium text-sm flex items-center justify-center gap-1"
                    >
                      <Send size={16} /> Save
                    </button>
                    <button
                      onClick={handleCancelCreate}
                      className="flex-1 bg-slate-200 text-slate-700 py-1.5 rounded-md hover:bg-slate-300 transition-colors font-medium text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* Create Button */
                <div
                  onClick={() => handleCreateClick(column)}
                  className="p-3 cursor-pointer hover:bg-gray-200 transition-colors rounded-md group"
                >
                  <button className="text-sm text-slate-600 hover:text-slate-800 font-medium flex items-center gap-1 hidden group-hover:flex">
                    + Create
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
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

export default BoardDashboard;
