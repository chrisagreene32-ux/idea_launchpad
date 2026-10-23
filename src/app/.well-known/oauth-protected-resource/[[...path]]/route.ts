import { origin } from "@/lib/oauth";

export function GET(req: Request) {
  const base = origin(req);
  return Response.json({
    resource: `${base}/api/mcp`,
    authorization_servers: [base],
    bearer_methods_supported: ["header"],
  });
}
