import { SupabaseClient } from "@supabase/supabase-js";
import { APIError } from "@/app/api/forms/errorHandler";
import feature_flags from "./featureFlags";
import { v4 as uuidv4 } from "uuid";
import logger from "@/lib/logger";

async function trackAndRateLimitUser(
  supabase: SupabaseClient,
  api_key: string
): Promise<{ user_id: string; featureFlags: any }> {
  logger.info("Checking API key and rate limit...");

  try {
    const { data, error } = await supabase
      .from("user_account_settings")
      .select(
        "user_id, account_status, api_calls_this_month, max_api_calls, is_rate_limited, last_active_month"
      )
      .eq("api_key", api_key)
      .single();

    if (error && error.code !== "PGRST116") {
      logger.error("Error fetching user account settings: %s", error.message);
      throw new APIError("Internal server error.", 500);
    }

    if (data) {
      const profile = data;
      const user_id = profile["user_id"];
      const user_tier = "paid"; // TODO: fixme should be from db
      let api_calls_this_month = profile["api_calls_this_month"];
      const max_api_calls = profile["max_api_calls"];
      const is_rate_limited = profile["is_rate_limited"];

      if (is_rate_limited || api_calls_this_month >= max_api_calls) {
        throw new APIError("Rate limit exceeded for this month.", 429);
      }

      api_calls_this_month += 1;
      const { error: updateError } = await supabase
        .from("user_account_settings")
        .update({ api_calls_this_month })
        .eq("user_id", user_id);

      if (updateError) {
        logger.error("Error updating API calls: %s", updateError.message);
        throw new APIError("Internal server error.", 500);
      }
      const featureFlags = feature_flags[user_tier] || feature_flags["free"];
      return { user_id, featureFlags };
    } else {
      logger.info("API key not found, creating a new user and API key...");
      try {
        const new_user_email = `example${uuidv4().slice(0, 8)}@example.com`;
        const { data: signUpData, error: signUpError } =
          await supabase.auth.signUp({
            email: new_user_email,
            password: "defaultpassword123",
          });

        if (signUpError) {
          logger.error("Error creating new user: %s", signUpError.message);
          throw new APIError("Internal server error.", 500);
        }

        const new_user_id = signUpData.user?.id;
        if (!new_user_id) {
          logger.error("Failed to retrieve new user ID after signup.");
          throw new APIError("Failed to create a new user.", 500);
        }

        const new_api_key = `key_${uuidv4()}`;
        const { error: insertError } = await supabase
          .from("user_account_settings")
          .insert({
            user_id: new_user_id,
            api_key: new_api_key,
            account_status: "free",
            api_calls_this_month: 0,
            max_api_calls: 100,
            is_rate_limited: false,
          });

        if (insertError) {
          logger.error(
            "Error inserting user account settings: %s",
            insertError.message
          );
          throw new APIError("Internal server error.", 500);
        }

        logger.info(
          "New user created: %s, API Key: %s",
          new_user_email,
          new_api_key
        );
        return { user_id: new_user_id, featureFlags: feature_flags["free"] };
      } catch (e: any) {
        logger.error(
          "Error creating user or inserting account settings: %s",
          e.message
        );
        throw new APIError("Internal server error.", 500);
      }
    }
  } catch (e: any) {
    if (e instanceof APIError) {
      throw e;
    }
    logger.error("Error in trackAndRateLimitUser: %s", e.message);
    throw new APIError("Internal server error.", 500);
  }
}

async function storeFormData(
  supabase: SupabaseClient,
  user_id: string,
  data: any,
  client_ip: string
): Promise<{ success: boolean; formSubmissionId: number }> {
  try {
    const { data: insertData, error } = await supabase
      .from("form_submissions")
      .insert({
        user_id,
        form_data: JSON.stringify(data),
        ip_address: client_ip,
        blocked: null,
      })
      .select();

    if (error || !insertData || insertData.length === 0) {
      logger.error("Error inserting form submission: %s", error?.message);
      return { success: false, formSubmissionId: 0 };
    } else {
      const formSubmissionId = insertData[0]["id"];
      return { success: true, formSubmissionId };
    }
  } catch (e: any) {
    logger.error("Error storing form submission: %s", e.message);
    throw new APIError("Internal server error.", 500);
  }
}

export { storeFormData, trackAndRateLimitUser };
