-- 1. Create the form_submissions table with AbuseIPDB details
CREATE TABLE form_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  -- Unique identifier for the submission
    user_id UUID REFERENCES auth.users (id) ON DELETE CASCADE,  -- Reference to the user (auth.users table)
    form_data JSONB NOT NULL,  -- JSONB to store the form submission data
    is_llm_detected_spam BOOLEAN,  -- Indicates if the LLM classified the submission as spam
    ip_address INET,  -- Store the IP address of the submitter
    blocked BOOLEAN DEFAULT FALSE,  -- Boolean indicating if the submission was blocked
    block_reason VARCHAR(255),  -- Reason why the submission was blocked (e.g., "Spam detected", "Blocked IP", "Low reCAPTCHA score")
    created_at TIMESTAMP DEFAULT NOW(),  -- Timestamp for when the submission was created
    updated_at TIMESTAMP DEFAULT NOW(),  -- Timestamp for when the submission was last updated
    
    -- AbuseIPDB Integration columns
    abuse_confidence_score INT,  -- AbuseIPDB confidence score
    total_reports INT,  -- Total reports of abuse for the IP
    country_code VARCHAR(2),  -- Country code associated with the IP
    domain VARCHAR(255),  -- Domain associated with the IP
    isp VARCHAR(255),  -- ISP associated with the IP
    is_public BOOLEAN  -- Indicates if the IP address is public or private
);

-- 2. Enable Row-Level Security (RLS) on the table
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- 3. Create a SELECT policy for RLS: Allow users to view only their own submissions
CREATE POLICY select_own_submissions
ON form_submissions
FOR SELECT
USING (auth.uid() = user_id);

-- 4. Create an INSERT policy for RLS: Allow users to insert submissions with their own user_id
CREATE POLICY insert_own_submissions
ON form_submissions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 5. Create an UPDATE policy for RLS: Allow users to update only their own submissions
CREATE POLICY update_own_submissions
ON form_submissions
FOR UPDATE
USING (auth.uid() = user_id);

-- 6. Create a DELETE policy for RLS: Allow users to delete only their own submissions
CREATE POLICY delete_own_submissions
ON form_submissions
FOR DELETE
USING (auth.uid() = user_id);
