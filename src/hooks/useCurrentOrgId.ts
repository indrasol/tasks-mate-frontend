import { useLocation, useParams } from "react-router-dom";

/**
 * Returns the current org_id extracted from either a route param or a query
 * string. Falls back to `undefined` when no org_id could be found.
 */
export const useCurrentOrgId = (): string | undefined => {
  // Priority 1 ‑ param (e.g. /organizations/:org_id/...)
  const params = useParams<Readonly<{ org_id?: string }>>();
  if (params.org_id) {
    return params.org_id;
  }

  // Priority 2 ‑ query param (e.g. ?org_id=O0001)
  const { search } = useLocation();
  const sp = new URLSearchParams(search);
  const fromQuery = sp.get("org_id");
  if (fromQuery) {
    return fromQuery;
  }

  return undefined;
};
