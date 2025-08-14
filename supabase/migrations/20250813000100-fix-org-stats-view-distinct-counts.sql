-- Fix over-counting in organization_stats_view by using DISTINCT counts
-- This addresses duplicate rows caused by joining projects and organization_members

create or replace view public.organization_stats_view as
select
    o.org_id,
    o.name as org_name,
    o.description AS org_description,
    o.created_by,
    o.created_at,
    count(distinct p.project_id)::int as project_count,
    count(distinct om.user_id)::int as member_count
from
    public.organizations  o
left join
    public.projects       p  on p.org_id = o.org_id
left join
    public.organization_members om  on om.org_id = o.org_id
group by
    1,2,3,4,5
order by
    o.name;

