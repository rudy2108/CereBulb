import {
  Menu,
  Grid2X2,
  Bell,
  CircleHelp,
  Settings,
  Plus,
  Search as SearchIcon,
} from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

function Header() {
  return (
    <header className="h-16 border-b border-b-gray-200 bg-white px-4 flex items-center justify-between">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <button>
          <Grid2X2 size={20} />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">
            C
          </div>
          <span className="font-medium">Jira</span>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4 flex-1 max-w-4xl mx-3">
        <InputGroup className="hover:border-blue-500 focus-within:border-blue-500">
          <InputGroupInput placeholder="Search..." />
          <InputGroupAddon align="inline-start">
            <SearchIcon className="text-muted-foreground" size={18} />
          </InputGroupAddon>
        </InputGroup>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md whitespace-nowrap cursor-pointer hover:bg-blue-700 transition-colors flex items-center">
          <Plus size={16} className="inline-block mr-1" />
          Create
        </button>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        <Bell size={20} />
        <CircleHelp size={20} />
        <Settings size={20} />

        <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-white font-medium">
          RT
        </div>
      </div>
    </header>
  );
}

export default Header;
