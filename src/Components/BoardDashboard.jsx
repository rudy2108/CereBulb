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
} from "lucide-react";

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

  // Consolidated state for editing tasks
  const [editingTask, setEditingTask] = useState(null); // { column, id, text }

  // Consolidated state for menu
  const [menuState, setMenuState] = useState(null); // { column, id, openSubmenu }
  const menuRef = useRef(null);

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

  // Memoized handlers
  const handleFilterClick = useCallback(() => {
    setFilterOpen((prev) => !prev);
  }, []);

  const handleCreateClick = useCallback((column) => {
    setCreatingColumn(column);
    setTaskDescription("");
    setTaskPriority("medium");
    setPriorityDropdownOpen(false);
  }, []);

  const handleSaveTask = useCallback(() => {
    if (taskDescription.trim()) {
      setTasks((prev) => ({
        ...prev,
        [creatingColumn]: [
          ...prev[creatingColumn],
          { id: Date.now(), description: taskDescription, completed: false, priority: taskPriority },
        ],
      }));
      setCreatingColumn(null);
      setTaskDescription("");
      setTaskPriority("medium");
    }
  }, [taskDescription, creatingColumn, taskPriority]);

  const handleCancelCreate = useCallback(() => {
    setCreatingColumn(null);
    setTaskDescription("");
    setTaskPriority("medium");
    setPriorityDropdownOpen(false);
  }, []);

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
                            className={`text-sm font-medium text-slate-700 ${
                              column === "DONE"
                                ? "line-through text-slate-400"
                                : ""
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
                    <button className="p-1 hover:bg-blue-100 rounded transition-colors text-slate-500">
                      <Clock size={18} />
                    </button>
                    <button className="p-1 hover:bg-blue-100 rounded transition-colors text-slate-500">
                      <UserPlus size={18} />
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setPriorityDropdownOpen(!priorityDropdownOpen)}
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
    </div>
  );
}

export default BoardDashboard;
