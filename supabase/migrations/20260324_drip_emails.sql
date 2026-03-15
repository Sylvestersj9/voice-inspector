-- Create drip_emails_sent table to track which emails have been sent
CREATE TABLE public.drip_emails_sent (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email_type text NOT NULL, -- 'day1' | 'day3' | 'day5' | 'day7'
  sent_at timestamptz DEFAULT now(),
  UNIQUE(user_id, email_type)
);

-- Enable RLS
ALTER TABLE public.drip_emails_sent ENABLE ROW LEVEL SECURITY;

-- RLS: Users can only see their own drip email records
CREATE POLICY "Users can read their own drip emails" ON public.drip_emails_sent
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS: Only service role can insert/update
CREATE POLICY "Service role can manage drip emails" ON public.drip_emails_sent
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
