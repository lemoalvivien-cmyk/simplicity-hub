import { useMemo } from "react";
import { computeNBA, type NBAResult } from "@/lib/nextBestAction";

export function useNextBestAction(): NBAResult {
  return useMemo(() => computeNBA(), []);
}
