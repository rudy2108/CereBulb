import React, { useState, useEffect, useRef, useCallback } from "react";
import { Check, Send, Pencil, MoreHorizontal } from "lucide-react";

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

  // Flatten tasks for table view
  const allTasks = COLUMNS.flatMap((column) =>
    tasks[column].map((task) => ({ ...task, status: column })),
  );

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
              <th className="px-4 py-3 w-44">Status</th>
              <th className="px-4 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {allTasks.length === 0 && (
              <tr>
                <td
                  colSpan={4}
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
                        className={
                          task.status === "DONE"
                            ? "line-through text-slate-400"
                            : "text-slate-700"
                        }
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
      </div>
    </div>
  );
}

export default ListDashboard;