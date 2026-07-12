-- Computes the dashboard headline metrics in a single round trip instead of
-- several application-side queries. "AI-resolved" means the ticket has at
-- least one AI reply (the auto-resolve job creates one atomically with
-- setting status RESOLVED). Resolution time is approximated as
-- updatedAt - createdAt for RESOLVED/CLOSED tickets, since there is no
-- dedicated resolvedAt column.
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE (
  total_tickets integer,
  open_tickets integer,
  ai_resolved_count integer,
  ai_resolved_percent double precision,
  avg_resolution_ms double precision
)
LANGUAGE sql
STABLE
AS $$
  WITH totals AS (
    SELECT
      COUNT(*)::integer AS total_tickets,
      COUNT(*) FILTER (WHERE status = 'OPEN')::integer AS open_tickets
    FROM "ticket"
  ),
  ai_resolved AS (
    SELECT COUNT(DISTINCT t."id")::integer AS ai_resolved_count
    FROM "ticket" t
    JOIN "ticket_reply" tr ON tr."ticketId" = t."id"
    WHERE tr."senderType" = 'AI'
  ),
  resolution AS (
    SELECT AVG(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt")) * 1000) AS avg_resolution_ms
    FROM "ticket"
    WHERE status IN ('RESOLVED', 'CLOSED')
  )
  SELECT
    totals.total_tickets,
    totals.open_tickets,
    ai_resolved.ai_resolved_count,
    CASE WHEN totals.total_tickets > 0
      THEN ai_resolved.ai_resolved_count::double precision / totals.total_tickets * 100
      ELSE 0
    END AS ai_resolved_percent,
    resolution.avg_resolution_ms
  FROM totals, ai_resolved, resolution;
$$;
