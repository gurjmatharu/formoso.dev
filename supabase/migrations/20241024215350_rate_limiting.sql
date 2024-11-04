-- 1. Add columns to track API calls, rate limiting, and check if the user is rate-limited
ALTER TABLE user_account_settings
ADD COLUMN IF NOT EXISTS api_calls_this_month INT DEFAULT 0,  -- Count of API calls in the current month
ADD COLUMN IF NOT EXISTS max_api_calls INT DEFAULT 100 CHECK (max_api_calls >= 0),  -- Max API calls allowed per month, default to 100 for free tier
ADD COLUMN IF NOT EXISTS is_rate_limited BOOLEAN DEFAULT FALSE;  -- Flag to indicate if the user is rate-limited

-- 2. Create a function to update max_api_calls when the user's account status changes
CREATE OR REPLACE FUNCTION update_max_api_calls_on_account_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.account_status <> OLD.account_status THEN
        -- Set max_api_calls based on the updated account status
        NEW.max_api_calls := CASE
            WHEN NEW.account_status = 'paid' THEN 1000
            ELSE 100
        END;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create a trigger to update max_api_calls when the user's account_status is updated
CREATE TRIGGER update_max_api_calls_on_account_status_change
BEFORE UPDATE ON user_account_settings
FOR EACH ROW
WHEN (NEW.account_status IS DISTINCT FROM OLD.account_status)
EXECUTE FUNCTION update_max_api_calls_on_account_status_change();

-- 4. Create a function to reset api_calls_this_month and is_rate_limited when the month changes
CREATE OR REPLACE FUNCTION reset_api_calls_if_new_month()
RETURNS TRIGGER AS $$
BEGIN
    -- Only reset if the current month has actually changed
    IF date_trunc('month', NEW.last_active_month) <> date_trunc('month', NOW()) THEN
        -- Reset the API call count and update the last_active_month to the current month
        NEW.api_calls_this_month := 0;
        NEW.is_rate_limited := FALSE;  -- Reset the rate-limited flag
        NEW.last_active_month := date_trunc('month', NOW());  -- Update to the start of the current month
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create a trigger to reset the API call count if the month has changed before updating the record
CREATE TRIGGER reset_api_calls_before_update
BEFORE UPDATE ON user_account_settings
FOR EACH ROW
EXECUTE FUNCTION reset_api_calls_if_new_month();
