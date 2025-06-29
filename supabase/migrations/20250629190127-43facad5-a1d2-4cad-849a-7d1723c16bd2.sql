
-- Create table for saved quotations
CREATE TABLE public.saved_quotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  message_id UUID NOT NULL,
  conversation_id UUID NOT NULL,
  provider_id UUID NOT NULL,
  request_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.saved_quotations ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to view their own saved quotations
CREATE POLICY "Users can view their own saved quotations" 
  ON public.saved_quotations 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy that allows users to save quotations
CREATE POLICY "Users can save quotations" 
  ON public.saved_quotations 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy that allows users to delete their own saved quotations
CREATE POLICY "Users can delete their own saved quotations" 
  ON public.saved_quotations 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create unique constraint to prevent duplicate saves
ALTER TABLE public.saved_quotations 
ADD CONSTRAINT unique_user_message_save 
UNIQUE (user_id, message_id);

-- Add indexes for better performance
CREATE INDEX idx_saved_quotations_user_id ON public.saved_quotations(user_id);
CREATE INDEX idx_saved_quotations_message_id ON public.saved_quotations(message_id);
