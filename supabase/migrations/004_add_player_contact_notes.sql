-- Add contactNumber and notes fields to players table
ALTER TABLE public.players
ADD COLUMN IF NOT EXISTS "contactNumber" TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;
