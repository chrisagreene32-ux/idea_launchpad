import { db } from "@/lib/db";
import AuthorizeForm from "./AuthorizeForm";
import { checkAuthorizeRequest, type AuthorizeParams } from "./actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AuthorizePage({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const get = (key: string) => {
    const value = raw[key];
    return (Array.isArray(value) ? value[0] : value) ?? "";
  };
  const params: AuthorizeParams = {
    client_id: get("client_id"),
    redirect_uri: get("redirect_uri"),
    code_challenge: get("code_challenge"),
    code_challenge_method: get("code_challenge_method"),
    response_type: get("response_type"),
    state: get("state"),
  };

  const problem = await checkAuthorizeRequest(params);
  if (problem) {
    return (
      <main style={{ padding: 24, maxWidth: 420, margin: "0 auto" }}>
        <h1>Can&apos;t sign in</h1>
        <p>{problem}</p>
      </main>
    );
  }

  const client = await db.oAuthClient.findUnique({ where: { id: params.client_id } });
  return <AuthorizeForm params={params} clientName={client?.name || "An app"} />;
}
