import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
interface Props {
  children: JSX.Element;
  checkOrg?: boolean;
}

export default function PrivateRoute({ children, checkOrg }: Props) {
  const { user, loading, session, refreshSession } = useAuth();
  const location = useLocation();


  // In PrivateRoute, you could add session refresh before redirecting
  useEffect(() => {
    if (!user && !loading && session) {
      // Try to refresh the session before redirecting
      refreshSession();
    }
  }, [user, loading, session]);

  //check for org_id query param and navigate accordingly
  const { search } = useLocation();
  const searchParams = new URLSearchParams(search);
  const orgId = searchParams.get("org_id");

  if (loading) return <Skeleton className="w-full h-full" />;

  // Check if session is expired (user is null but we have a current path that's not login)
  const isSessionExpired = !user && !loading &&
    location.pathname !== "/login" &&
    location.pathname !== "/" &&
    location.pathname !== "/index";

  // If session expired, redirect to login with the current path as redirectTo
  if (isSessionExpired) {
    const loginPath = orgId ? `/login?org_id=${orgId}` : "/login";

    return (
      <Navigate
        to={loginPath}
        replace
        state={{ redirectTo: location.pathname + location.search }}
      />
    );
  }

  // If not logged in and not on a protected route, redirect to login
  if (!user && !isSessionExpired) {
    const loginPath = orgId ? `/login?org_id=${orgId}` : "/login";

    return (
      <Navigate
        to={loginPath}
        replace
        state={{ redirectTo: location.pathname + location.search }}
      />
    );
  }

  // If org check is required and no orgId, redirect to /org
  if (checkOrg && !orgId) {
    return <Navigate to="/org" replace />;
  }

  return children;

}