import logger from "@/lib/logger";
import supabase from "@/lib/supabaseServerSideClient";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { processFormSubmission, validateApiKey } from "./helpers";
import { storeFormData, trackAndRateLimitUser } from "./userService";

export async function POST(request: NextRequest) {
  try {
    const client_ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      request.headers.get("remote_addr") ||
      "0.0.0.0";
    logger.info("Received request from client IP: %s", client_ip);

    const { searchParams } = new URL(request.url);
    const api_key = searchParams.get("api_key")?.trim();
    if (!api_key) {
      logger.warn("API key is missing in request.");
      return NextResponse.json({ error: "Missing api_key" }, { status: 400 });
    }

    if (!validateApiKey(api_key)) {
      logger.warn("Invalid API key format detected.");
      return NextResponse.json({ error: "Invalid API Key" }, { status: 400 });
    }

    const { user_id, featureFlags } = await trackAndRateLimitUser(
      supabase,
      api_key
    );
    logger.info("User ID %s with feature flags loaded.", user_id);

    const contentType = request.headers.get("content-type") || "";
    let payload: any;
    if (contentType.includes("application/json")) {
      payload = await request.json();
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      payload = Object.fromEntries(formData.entries());
    } else {
      logger.warn("Unsupported content type: %s", contentType);
      return NextResponse.json(
        { error: "Unsupported content type" },
        { status: 415 }
      );
    }

    // Validate form data
    if (typeof payload !== "object" || Array.isArray(payload)) {
      logger.warn("Invalid form data structure.");
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    } else {
      for (const key in payload) {
        if (typeof payload[key] === "object" && payload[key] !== null) {
          logger.warn("Nested object detected in payload.");
          return NextResponse.json(
            {
              error:
                "Invalid form data: payload must be a flat object with no nested objects",
            },
            { status: 400 }
          );
        }
      }
    }

    const { success, formSubmissionId } = await storeFormData(
      supabase,
      user_id,
      payload,
      client_ip
    );
    if (!success) {
      logger.error("Failed to store form submission for user ID: %s", user_id);
      return NextResponse.json(
        { error: "Failed to store form submission." },
        { status: 500 }
      );
    }

    logger.info(
      "Stored form submission successfully. Submission ID: %d",
      formSubmissionId
    );

    // Process form submission asynchronously
    (async () => {
      try {
        await processFormSubmission(
          supabase,
          formSubmissionId,
          payload,
          client_ip,
          featureFlags
        );
        logger.info(
          "Form submission processed successfully. ID: %d",
          formSubmissionId
        );
      } catch (e: any) {
        logger.error(
          "Background processing error for submission ID %d: %s",
          formSubmissionId,
          e.message
        );
      }
    })();

    return NextResponse.json({
      message: "Form submitted successfully.",
    });
  } catch (e: any) {
    logger.error("Error encountered during form submission: %s", e.message);
    const statusCode = e.statusCode || 500;
    const errorMessage =
      statusCode === 500
        ? "An unexpected error occurred. Please try again later."
        : e.message;
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
