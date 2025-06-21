
interface DuplicateTaskHeaderProps {
  sourceTaskName: string;
}

const DuplicateTaskHeader = ({ sourceTaskName }: DuplicateTaskHeaderProps) => {
  return (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold">Create New Task</h2>
      <p className="text-sm text-gray-600">
        Creating a new task based on: <span className="font-medium">{sourceTaskName}</span>
      </p>
    </div>
  );
};

export default DuplicateTaskHeader;
