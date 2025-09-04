import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useLocation } from "react-router-dom";

interface Props {
  children: JSX.Element;
  checkOrg?: boolean;
}

export default function PrivateRoute({ children, checkOrg }: Props) {
  const { user, loading } = useAuth();

  //check for org_id query param and navigate accordingly
  const { search } = useLocation();
  const searchParams = new URLSearchParams(search);
  const orgId = searchParams.get("org_id");

  if (loading) return <Skeleton className="w-full h-full" />;

  
  return (user ?
    (checkOrg ? (orgId ? children : <Navigate to="/org" replace />) : children) :
    <Navigate to={orgId ? `/login?org_id=${orgId}` : "/login"} replace />);
}