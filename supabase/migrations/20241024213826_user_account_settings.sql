-- 1. Create a new table to store user account settings (API keys, account status, etc.)
CREATE TABLE user_account_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  -- Unique identifier for the account settings table
    user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,  -- 1:1 relationship with users, unique per user
    api_key VARCHAR(255) UNIQUE,  -- Unique API key for each user
    account_status VARCHAR(10) DEFAULT 'free' CHECK (account_status IN ('free', 'paid')),  -- Dynamic account status, starts as 'free'
    subscription_id TEXT REFERENCES subscriptions(id) ON DELETE SET NULL,  -- Link to active subscription (1:1 relationship)
    last_active_month DATE DEFAULT date_trunc('month', CURRENT_DATE),  -- Automatically set to the first day of the current month
    created_at TIMESTAMP DEFAULT NOW(),  -- Timestamp when the account settings were created
    updated_at TIMESTAMP DEFAULT NOW()  -- Timestamp when the account settings were last updated
);

-- 2. Populate api_key and initial account_status for existing users
INSERT INTO user_account_settings (user_id, api_key, account_status, last_active_month)
SELECT id, 'key_' || gen_random_uuid(), 'free', date_trunc('month', CURRENT_DATE)
FROM auth.users
ON CONFLICT DO NOTHING;

-- 3. Create a function to auto-generate api_key when a new user_account_settings entry is inserted
CREATE OR REPLACE FUNCTION generate_api_key_for_user()
RETURNS TRIGGER AS $$
BEGIN
    NEW.api_key := 'key_' || gen_random_uuid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create the trigger that calls the function before inserting a new user_account_settings entry
CREATE TRIGGER set_api_key_before_insert
BEFORE INSERT ON user_account_settings
FOR EACH ROW
WHEN (NEW.api_key IS NULL)
EXECUTE FUNCTION generate_api_key_for_user();

-- 5. Create an index on the api_key column to optimize lookups
CREATE INDEX idx_api_key ON user_account_settings(api_key);

-- 6. Define RLS policies to allow users to view and update only their own data
ALTER TABLE user_account_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for allowing users to view their own account settings
CREATE POLICY "Can view own account settings"
  ON user_account_settings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy for allowing users to update their own account settings
CREATE POLICY "Can update own account settings"
  ON user_account_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 7. Create function to sync account_status based on subscription status
CREATE OR REPLACE FUNCTION sync_account_status_with_subscription()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'active' THEN
        UPDATE user_account_settings
        SET account_status = 'paid', subscription_id = NEW.id
        WHERE user_id = NEW.user_id;
    ELSE
        UPDATE user_account_settings
        SET account_status = 'free', subscription_id = NULL
        WHERE user_id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create a trigger to update account status based on changes in subscriptions
CREATE TRIGGER update_account_status
AFTER INSERT OR UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION sync_account_status_with_subscription();
