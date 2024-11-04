-- Migration to automatically create a user_account_settings entry when a new user is added to the users table

-- 1. Create a trigger function to insert default settings into user_account_settings for new users
CREATE OR REPLACE FUNCTION create_user_account_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_account_settings (user_id, api_key, account_status, last_active_month)
    VALUES (NEW.id, 'key_' || gen_random_uuid(), 'free', date_trunc('month', CURRENT_DATE));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create a trigger on the users table to call this function after a new user is created
CREATE TRIGGER create_account_settings_after_user
AFTER INSERT ON public.users
FOR EACH ROW
EXECUTE FUNCTION create_user_account_settings();
