import { formatDate } from "date-fns";
import { Badge } from "./badge";
import { Calendar } from "lucide-react";

const DateBadge = ({ date, className }: { date: any, className?: string }) => {
    return (
        <Badge variant="secondary" className={`transition-colors duration-300 ${className}`}>
            {/* <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
            </svg>  */}
            {date ? (
                <>
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatDate(date, 'MMM dd, yyyy')}
                </>
            ) : (
                '-'
            )}
        </Badge>
    );
};

export default DateBadge;