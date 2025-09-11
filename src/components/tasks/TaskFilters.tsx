
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Filter, User, Calendar, X } from "lucide-react";

interface TaskFiltersProps {
  selectedStatuses: string[];
  selectedOwners: string[];
  selectedDateRange: string | null;
  onStatusToggle: (status: string) => void;
  onOwnerToggle: (owner: string) => void;
  onDateRangeChange: (range: string | null) => void;
  onClearFilters: () => void;
}

const TaskFilters = ({
  selectedStatuses,
  selectedOwners,
  selectedDateRange,
  onStatusToggle,
  onOwnerToggle,
  onDateRangeChange,
  onClearFilters,
}: TaskFiltersProps) => {
  const statuses = [
    { value: "todo", label: "To Do", color: "bg-gray-100 text-gray-800" },
    { value: "in-progress", label: "In Progress", color: "bg-blue-100 text-blue-800" },
    { value: "completed", label: "Completed", color: "bg-green-100 text-green-800" },
    { value: "blocked", label: "Blocked", color: "bg-red-100 text-red-800" },
  ];

  const owners = ["JD", "SK", "MR", "AM"];
  const dateRanges = ["This Week", "This Month", "Last 30 Days", "Custom"];

  const hasActiveFilters = selectedStatuses.length > 0 || selectedOwners.length > 0 || selectedDateRange;

  return (
    <div className="flex items-center space-x-2">
      {/* Status Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="relative">
            {/* <Filter className="h-4 w-4 mr-2" /> */}
            Status
            {selectedStatuses.length > 0 && (
              <Badge className="ml-2 h-5 w-5 p-0 text-xs bg-tasksmate-gradient text-white">
                {selectedStatuses.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3 bg-white border shadow-lg z-50">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Filter by Status</h4>
            <div className="space-y-2">
              {statuses.map((status) => (
                <label key={status.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(status.value)}
                    onChange={() => onStatusToggle(status.value)}
                    className="rounded border-gray-300"
                  />
                  <Badge className={status.color}>{status.label}</Badge>
                </label>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Owner Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="relative">
            <User className="h-4 w-4 mr-2" />
            Owner
            {selectedOwners.length > 0 && (
              <Badge className="ml-2 h-5 w-5 p-0 text-xs bg-tasksmate-gradient text-white">
                {selectedOwners.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3 bg-white border shadow-lg z-50">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Filter by Owner</h4>
            <div className="space-y-2">
              {owners.map((owner) => (
                <label key={owner} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedOwners.includes(owner)}
                    onChange={() => onOwnerToggle(owner)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{owner}</span>
                </label>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Date Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="relative">
            <Calendar className="h-4 w-4 mr-2" />
            Date
            {selectedDateRange && (
              <Badge className="ml-2 h-5 w-5 p-0 text-xs bg-tasksmate-gradient text-white">
                1
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3 bg-white border shadow-lg z-50">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Filter by Date</h4>
            <div className="space-y-2">
              {dateRanges.map((range) => (
                <label key={range} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="dateRange"
                    checked={selectedDateRange === range}
                    onChange={() => onDateRangeChange(range === selectedDateRange ? null : range)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{range}</span>
                </label>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-gray-500">
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
};

export default TaskFilters;
