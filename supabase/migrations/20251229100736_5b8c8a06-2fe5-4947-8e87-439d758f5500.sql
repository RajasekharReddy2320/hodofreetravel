-- Add read_at timestamp column to messages table for read receipts
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add is_typing column for typing indicators (stored as last_typing_at for timeout-based approach)
-- We'll use a separate typing_indicators table for real-time typing status
CREATE TABLE IF NOT EXISTS public.typing_indicators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, recipient_id)
);

-- Enable RLS
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;

-- Typing indicator policies
CREATE POLICY "Users can view their own typing indicators"
ON public.typing_indicators
FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can insert their own typing indicators"
ON public.typing_indicators
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own typing indicators"
ON public.typing_indicators
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own typing indicators"
ON public.typing_indicators
FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime for typing indicators
ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_indicators;