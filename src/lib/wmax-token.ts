/**
 * WMAX Token — Royalty mint helper
 * Calls the openclaw-token-mint edge function (server-side blockchain write).
 * The `viem` client is kept for future on-chain read operations (balance, etc.).
 */
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { supabase } from "@/integrations/supabase/client";

// Public read-only client for Base L2 (balance checks, tx lookups)
export const baseClient = createPublicClient({
  chain: base,
  transport: http(),
});

export interface WMAXMintResult {
  success: boolean;
  tx_hash?: string;
  token_id?: string;
  error?: string;
}

export async function mintWMAXToken(
  userId: string,
  royaltyAmount: number,
  dealId: string
): Promise<WMAXMintResult> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;

  const res = await fetch(`${supabaseUrl}/functions/v1/openclaw-token-mint`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token ?? ""}`,
      "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
    },
    body: JSON.stringify({ userId, royaltyAmount, dealId }),
  });

  if (!res.ok) {
    const err = await res.text();
    return { success: false, error: err };
  }

  return res.json();
}
