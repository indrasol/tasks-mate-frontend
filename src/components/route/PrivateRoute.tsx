import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  children: JSX.Element;
}

export default function PrivateRoute({ children }: Props) {
  const { user, loading } = useAuth();

  if (loading) return <Skeleton className="w-full h-full" />;
  return user ? children : <Navigate to="/" replace />;
}