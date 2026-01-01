-- Add E2E encryption fields to group_messages for group chat encryption
ALTER TABLE public.group_messages 
ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS encrypted_keys JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS iv TEXT DEFAULT NULL;

-- Add sender_content column to messages table to store sender's readable copy
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS sender_content TEXT DEFAULT NULL;

COMMENT ON COLUMN public.messages.sender_content IS 'Stores the original plaintext for the sender to read their own messages';
COMMENT ON COLUMN public.group_messages.encrypted_keys IS 'JSON object mapping user_id to their encrypted AES key';