-- Add Telegram columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS telegram_user_id BIGINT,
ADD COLUMN IF NOT EXISTS telegram_username TEXT,
ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT; -- Optional: if we want to store DM chat id separate from user id, usually same.

-- Create index for faster lookups by telegram_user_id
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_user_id ON profiles(telegram_user_id);
