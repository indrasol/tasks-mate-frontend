import { useAuth } from "@/hooks/useAuth";
import { Navigate, useLocation } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  children: JSX.Element;
}

export default function PrivateRoute({ children }: Props) {
  const { user, loading } = useAuth();

  //check for org_id query param and navigate accordingly
  const { search } = useLocation();
  const searchParams = new URLSearchParams(search);
  const orgId = searchParams.get("org_id");

  if (loading) return <Skeleton className="w-full h-full" />;
  return user ? children : <Navigate to={orgId ? `/index?org_id=${orgId}` : "/index"} replace />;
}