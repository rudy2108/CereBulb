import {
  Mountain,
  Users,
  MoreHorizontal,
  Globe,
  Table2,
  Columns3,
  Calendar,
  Rows3,
  FileText,
  ListTodo,
  Code2,
  Plus,
} from "lucide-react";
import { useState } from "react";

function SubHeader({ activeTab, setActiveTab }) {
  return (
    <div className="bg-white border-b border-b-gray-200">
      {/* Top Section */}
      <div className="px-6 py-3">
        <h2 className="text-sm text-slate-500 mb-2">Spaces</h2>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Mountain className="w-6 h-5 text-blue-500" />
            <span className="text-2xl font-bold text-slate-900">
              Practise Project
            </span>
          </div>

          <button className="p-2 border border-slate-300 rounded-lg">
            <Users className="w-5 h-4" />
          </button>

          <button className="p-2">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="px-6 flex items-center gap-8 text-slate-600">
        {/* <button className="flex items-center gap-2 py-3 hover:text-black">
          <Globe size={18} />
          <span>Summary</span>
        </button> */}

        <button
          onClick={() => setActiveTab("List")}
          className={`flex items-center gap-2 py-3 border-b-2 transition-all ${
            activeTab === "List"
              ? "text-blue-500 border-blue-500"
              : "text-slate-600 border-transparent hover:text-blue-500"
          }`}
        >
          <Table2 size={18} />
          <span>List</span>
        </button>

        <button
          onClick={() => setActiveTab("Board")}
          className={`flex items-center gap-2 py-3 border-b-2 transition-all ${
            activeTab === "Board"
              ? "text-blue-500 border-blue-500"
              : "text-slate-600 border-transparent hover:text-blue-500"
          }`}
        >
          <Columns3 size={18} />
          <span>Board</span>
        </button>
      </div>
    </div>
  );
}

export default SubHeader;
