
-- Enable uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create live_cash_flow table with pgvector support
CREATE TABLE IF NOT EXISTS public.live_cash_flow (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric,
  counterparty text,
  vector vector(1536),
  cash_weight numeric,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.live_cash_flow ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own cash flow"
  ON public.live_cash_flow FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cash flow"
  ON public.live_cash_flow FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cash flow"
  ON public.live_cash_flow FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cash flow"
  ON public.live_cash_flow FOR DELETE
  USING (auth.uid() = user_id);
