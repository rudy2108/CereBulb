import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Maximize2,
  Flag,
  CalendarDays,
  Clock,
  User,
  Users,
  Tag,
  ChevronDown,
  ChevronRight,
  Send,
  MessageSquare,
  History,
  ListTodo,
  Pencil,
  Trash2,
} from "lucide-react";

const COLUMNS = ["IN PROGRESS", "TO DO", "DONE"];

function TaskDetailModal({ task, column, onClose, onUpdateTask, onDeleteTask, onChangeStatus }) {
  const [activeTab, setActiveTab] = useState("comments");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleText, setTitleText] = useState(task.description);
  const [description, setDescription] = useState(task.taskDescription || "");
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [comments, setComments] = useState(task.comments || []);
  const [newComment, setNewComment] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [dueDateValue, setDueDateValue] = useState(task.dueDate || "");

  const overlayRef = useRef(null);
  const titleInputRef = useRef(null);
  const statusRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Close status dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (statusRef.current && !statusRef.current.contains(e.target)) {
        setStatusDropdownOpen(false);
      }
    };
    if (statusDropdownOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [statusDropdownOpen]);

  // Focus title input when editing
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleSaveTitle = () => {
    if (titleText.trim()) {
      onUpdateTask(column, task.id, { description: titleText.trim() });
    } else {
      setTitleText(task.description);
    }
    setIsEditingTitle(false);
  };

  const handleSaveDescription = () => {
    onUpdateTask(column, task.id, { taskDescription: description });
    setIsEditingDescription(false);
  };

  const handleStatusChange = (newStatus) => {
    if (newStatus !== column) {
      onChangeStatus(newStatus, column, task);
    }
    setStatusDropdownOpen(false);
  };

  const handleDueDateChange = (e) => {
    const val = e.target.value;
    setDueDateValue(val);
    onUpdateTask(column, task.id, { dueDate: val || null });
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      const updatedComments = [
        ...comments,
        {
          id: Date.now(),
          text: newComment,
          author: "RT",
          authorName: "Rudra Teckin",
          createdAt: new Date().toISOString(),
        },
      ];
      setComments(updatedComments);
      onUpdateTask(column, task.id, { comments: updatedComments });
      setNewComment("");
    }
  };

  const handleQuickComment = (text) => {
    const updatedComments = [
      ...comments,
      {
        id: Date.now(),
        text,
        author: "RT",
        authorName: "Rudra Teckin",
        createdAt: new Date().toISOString(),
      },
    ];
    setComments(updatedComments);
    onUpdateTask(column, task.id, { comments: updatedComments });
  };

  const handleDeleteComment = (commentId) => {
    const updatedComments = comments.filter((c) => c.id !== commentId);
    setComments(updatedComments);
    onUpdateTask(column, task.id, { comments: updatedComments });
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return "None";
    const date = new Date(isoStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (isoStr) => {
    if (!isoStr) return "";
    const date = new Date(isoStr);
    return (
      date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }) +
      ", " +
      date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    );
  };

  const getStatusColor = (status) => {
    if (status === "DONE") return "bg-green-100 text-green-700 border-green-300";
    if (status === "IN PROGRESS") return "bg-blue-100 text-blue-700 border-blue-300";
    return "bg-slate-100 text-slate-700 border-slate-300";
  };

  const getPriorityLabel = (priority) => {
    if (!priority) return "None";
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  const getPriorityColor = (priority) => {
    if (priority === "high") return "text-red-500";
    if (priority === "medium") return "text-yellow-600";
    if (priority === "low") return "text-blue-500";
    return "text-slate-400";
  };

  const getToday = () => new Date().toISOString().split("T")[0];

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto"
      style={{ backdropFilter: "blur(4px)" }}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 overflow-hidden animate-in"
        style={{
          animation: "modalSlideIn 0.25s ease-out",
        }}
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="hover:text-blue-600 cursor-pointer">📋 Tasks</span>
            <span>/</span>
            <span className="font-medium text-slate-700">TASK-{task.id.toString().slice(-4)}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-200 rounded-md transition-colors text-slate-500 hover:text-slate-700"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex min-h-[500px]">
          {/* Left Panel */}
          <div className="flex-1 p-6 overflow-y-auto border-r border-slate-100">
            {/* Title */}
            <div className="mb-6">
              {isEditingTitle ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={titleText}
                  onChange={(e) => setTitleText(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveTitle();
                    if (e.key === "Escape") {
                      setTitleText(task.description);
                      setIsEditingTitle(false);
                    }
                  }}
                  className="text-xl font-semibold text-slate-800 w-full outline-none border-b-2 border-blue-500 pb-1 bg-blue-50 px-2 rounded-t"
                />
              ) : (
                <h1
                  onClick={() => setIsEditingTitle(true)}
                  className="text-xl font-semibold text-slate-800 cursor-pointer hover:bg-slate-50 px-2 py-1 rounded transition-colors -mx-2"
                  title="Click to edit"
                >
                  {task.description}
                </h1>
              )}
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-800 mb-2">Description</h3>
              {isEditingDescription ? (
                <div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none resize-none focus:ring-1 focus:ring-blue-500 min-h-[80px]"
                    rows="4"
                    autoFocus
                    placeholder="Add a description..."
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleSaveDescription}
                      className="bg-blue-600 text-white px-3 py-1 rounded-md text-xs font-medium hover:bg-blue-700 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setDescription(task.taskDescription || "");
                        setIsEditingDescription(false);
                      }}
                      className="bg-slate-100 text-slate-600 px-3 py-1 rounded-md text-xs font-medium hover:bg-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p
                  onClick={() => setIsEditingDescription(true)}
                  className={`text-sm cursor-pointer px-3 py-2 rounded-lg border border-dashed transition-colors min-h-[40px] ${
                    description
                      ? "text-slate-700 border-transparent hover:border-slate-300 hover:bg-slate-50"
                      : "text-slate-400 border-slate-300 hover:border-blue-400 hover:bg-blue-50"
                  }`}
                >
                  {description || "Add a description..."}
                </p>
              )}
            </div>

            {/* Activity Section */}
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Activity</h3>

              {/* Tabs */}
              <div className="flex items-center gap-1 mb-4 border-b border-slate-200">
                {[
                  { key: "all", label: "All" },
                  { key: "comments", label: "Comments", icon: MessageSquare },
                  { key: "history", label: "History", icon: History },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-md border border-b-0 transition-colors ${
                      activeTab === tab.key
                        ? "bg-white text-blue-600 border-slate-200 -mb-px"
                        : "text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {tab.icon && <tab.icon size={13} />}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Comment Input */}
              {(activeTab === "comments" || activeTab === "all") && (
                <div className="mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                      RT
                    </div>
                    <div className="flex-1">
                      <div className="border border-slate-300 rounded-lg overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Add a comment..."
                          className="w-full px-3 py-2 text-sm outline-none resize-none"
                          rows="2"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAddComment();
                          }}
                        />
                        {/* Quick reactions */}
                        <div className="flex items-center gap-1 px-2 py-1.5 bg-slate-50 border-t border-slate-200">
                          {[
                            { emoji: "🎉", text: "Looks good!" },
                            { emoji: "👋", text: "Need help?" },
                            { emoji: "🚫", text: "This is blocked..." },
                            { emoji: "💬", text: "Can you clarify...?" },
                          ].map((quick) => (
                            <button
                              key={quick.text}
                              onClick={() => handleQuickComment(`${quick.emoji} ${quick.text}`)}
                              className="text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-200 px-2 py-1 rounded transition-colors"
                            >
                              {quick.emoji} {quick.text}
                            </button>
                          ))}
                        </div>
                      </div>
                      {newComment.trim() && (
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={handleAddComment}
                            className="bg-blue-600 text-white px-3 py-1 rounded-md text-xs font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
                          >
                            <Send size={12} />
                            Save
                          </button>
                        </div>
                      )}
                      <p className="text-xs text-slate-400 mt-1.5">
                        <span className="font-medium">Pro tip:</span> press{" "}
                        <kbd className="bg-slate-100 border border-slate-300 rounded px-1 text-[10px] font-mono">Ctrl</kbd> +{" "}
                        <kbd className="bg-slate-100 border border-slate-300 rounded px-1 text-[10px] font-mono">Enter</kbd>{" "}
                        to comment
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Comments List */}
              {(activeTab === "comments" || activeTab === "all") && comments.length > 0 && (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex items-start gap-3 group">
                      <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                        {comment.author}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-medium text-slate-700">{comment.authorName}</span>
                          <span className="text-xs text-slate-400">{formatDateTime(comment.createdAt)}</span>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all ml-auto"
                            title="Delete comment"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <p className="text-sm text-slate-600">{comment.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* History tab placeholder */}
              {activeTab === "history" && (
                <div className="text-sm text-slate-400 text-center py-6">
                  <History size={24} className="mx-auto mb-2 text-slate-300" />
                  No history recorded yet.
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-80 p-5 bg-slate-50/50 overflow-y-auto">
            {/* Status Badge */}
            <div className="flex items-center gap-2 mb-5" ref={statusRef}>
              <div className="relative">
                <button
                  onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-md border cursor-pointer flex items-center gap-1.5 transition-colors ${getStatusColor(column)}`}
                >
                  {column}
                  <ChevronDown size={13} />
                </button>
                {statusDropdownOpen && (
                  <div className="absolute left-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-10 overflow-hidden">
                    {COLUMNS.map((col) => (
                      <button
                        key={col}
                        onClick={() => handleStatusChange(col)}
                        className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-slate-100 transition-colors flex items-center gap-2 ${
                          col === column ? "bg-blue-50 text-blue-700" : "text-slate-700"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            col === "DONE" ? "bg-green-500" : col === "IN PROGRESS" ? "bg-blue-500" : "bg-slate-400"
                          }`}
                        />
                        {col}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Details Section */}
            <div className="border border-slate-200 rounded-lg bg-white">
              <button
                onClick={() => setDetailsOpen(!detailsOpen)}
                className="flex items-center justify-between w-full px-4 py-3 text-sm font-semibold text-slate-700"
              >
                <span className="flex items-center gap-1.5">
                  {detailsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  Details
                </span>
              </button>

              {detailsOpen && (
                <div className="px-4 pb-4 space-y-3.5 border-t border-slate-100 pt-3">
                  {/* Assignee */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Assignee</span>
                    <div className="flex items-center gap-1.5">
                      <User size={14} className="text-slate-400" />
                      <span className="text-xs text-slate-500">Unassigned</span>
                    </div>
                  </div>

                  {/* Priority */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Priority</span>
                    <div className="flex items-center gap-1.5">
                      <Flag
                        size={14}
                        className={getPriorityColor(task.priority)}
                        fill={task.priority === "high" || task.priority === "medium" ? "currentColor" : "none"}
                      />
                      <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {getPriorityLabel(task.priority)}
                      </span>
                    </div>
                  </div>

                  {/* Due Date */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Due date</span>
                    <div className="flex items-center gap-1.5">
                      <CalendarDays size={14} className="text-slate-400" />
                      <input
                        type="date"
                        value={dueDateValue}
                        min={getToday()}
                        onChange={handleDueDateChange}
                        className="text-xs text-slate-700 border-0 outline-none bg-transparent cursor-pointer p-0"
                      />
                    </div>
                  </div>

                  {/* Labels */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Labels</span>
                    <div className="flex items-center gap-1.5">
                      <Tag size={14} className="text-slate-400" />
                      <span className="text-xs text-slate-400">None</span>
                    </div>
                  </div>

                  {/* Team */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Team</span>
                    <div className="flex items-center gap-1.5">
                      <Users size={14} className="text-slate-400" />
                      <span className="text-xs text-slate-400">None</span>
                    </div>
                  </div>

                  {/* Created */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Created</span>
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-slate-400" />
                      <span className="text-xs text-slate-500">{formatDateTime(task.createdAt)}</span>
                    </div>
                  </div>

                  {/* Reporter */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Reporter</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center text-[9px] font-medium">
                        RT
                      </div>
                      <span className="text-xs text-slate-700">Rudra Teckin</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Delete Button */}
            <div className="mt-4">
              <button
                onClick={() => {
                  onDeleteTask(column, task.id);
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors border border-transparent hover:border-red-200"
              >
                <Trash2 size={14} />
                Delete Task
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Animation keyframes */}
      <style>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}

export default TaskDetailModal;
