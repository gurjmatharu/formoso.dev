import { SupabaseClient } from "@supabase/supabase-js";
import openai from "@/lib/openAIClient";
import { APIError } from "@/app/api/forms/errorHandler";

function validateApiKey(apiKey: string): boolean {
  const apiKeyPattern = /^key_[a-f0-9\-]{36}$/;
  return apiKeyPattern.test(apiKey);
}

async function checkIpReputation(
  supabase: SupabaseClient,
  formSubmissionId: number,
  clientIp: string,
  featureFlags: any
): Promise<boolean> {
  if (!featureFlags.IP_REPUTATION_CHECK) {
    return true;
  }

  try {
    const ABUSE_IP_DB_API_KEY = process.env.ABUSE_IP_DB_API_KEY!;
    if (!ABUSE_IP_DB_API_KEY) {
      console.error("ABUSE_IP_DB_API_KEY is not set");
      throw new APIError("Server configuration error.", 500);
    }

    const abuseResponse = await fetch(
      `https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(
        clientIp
      )}&maxAgeInDays=90`,
      {
        headers: {
          Key: ABUSE_IP_DB_API_KEY,
          Accept: "application/json",
        },
      }
    );

    if (!abuseResponse.ok) {
      console.error("Error fetching IP reputation:", abuseResponse.statusText);
      throw new APIError("IP reputation check failed.", 500);
    }

    const abuseData = await abuseResponse.json();
    const abuse_confidence_score = abuseData.data?.abuseConfidenceScore || 0;

    const updatePayload: any = {
      abuse_confidence_score,
      blocked: abuse_confidence_score > 50,
      block_reason:
        abuse_confidence_score > 50 ? "High abuse confidence score" : null,
    };

    const { error } = await supabase
      .from("form_submissions")
      .update(updatePayload)
      .eq("id", formSubmissionId);

    if (error) {
      console.error(
        `Error updating form submission with IP reputation data: ${error.message}`
      );
    }

    return abuse_confidence_score <= 50;
  } catch (e: any) {
    console.error(`Error checking IP reputation for ${clientIp}: ${e.message}`);
    await supabase
      .from("form_submissions")
      .update({
        blocked: true,
        block_reason: "Error in IP reputation check",
      })
      .eq("id", formSubmissionId);
    return false;
  }
}

async function runLLMSpamDetection(
  supabase: SupabaseClient,
  formSubmissionId: number,
  formData: any,
  featureFlags: any
): Promise<boolean | null> {
  if (!featureFlags.SPAM_DETECTION) {
    return null;
  }

  const prompt = `
  You are an AI trained to detect spam in form submissions.
  Please analyze the following form data and determine if it is spam.
  Respond with one word only: 'True' if the submission is spam,
  or 'False' if it is not spam.
  
  Form Data:
  ${JSON.stringify(formData, null, 2)}
  
  Is this submission spam? Respond with either 'True' or 'False'.`;

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt },
      ],
      model: "gpt-3.5-turbo",
      max_tokens: 1,
      temperature: 0,
    });

    const message = completion.choices[0].message;
    if (message && message.content) {
      const reply = message.content.trim();
      const isSpam = reply === "True";

      const updateData: any = { is_llm_detected_spam: isSpam };
      if (isSpam) {
        updateData["blocked"] = true;
        updateData["block_reason"] = "AI flagged as spam";
      }

      await supabase
        .from("form_submissions")
        .update(updateData)
        .eq("id", formSubmissionId);

      return isSpam;
    } else {
      console.error(
        "Unexpected null or undefined message content in OpenAI response."
      );
      throw new APIError(
        "Unexpected null or undefined message content in OpenAI response.",
        500
      );
    }
  } catch (e: any) {
    console.error(`Error during LLM spam detection: ${e.message}`);
    return null;
  }
}
async function processFormSubmission(
  supabase: SupabaseClient,
  formSubmissionId: number,
  formData: any,
  clientIp: string,
  featureFlags: any
) {
  try {
    await checkIpReputation(supabase, formSubmissionId, clientIp, featureFlags);
    await runLLMSpamDetection(
      supabase,
      formSubmissionId,
      formData,
      featureFlags
    );
  } catch (e: any) {
    console.error(`Error in processFormSubmission: ${e.message}`);
  }
}
export {
  validateApiKey,
  checkIpReputation,
  runLLMSpamDetection,
  processFormSubmission,
};
