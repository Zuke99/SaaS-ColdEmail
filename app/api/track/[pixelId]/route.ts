import { createCronClient } from "@/lib/supabase/cron";

const gif = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

function gifResponse() {
  return new Response(gif, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

export async function GET(
  request: Request,
  { params }: { params: { pixelId: string } }
) {
  const { pixelId } = params;
  console.log("Track pixel hit:", pixelId, "url:", request.url);

  const supabase = createCronClient();

  const { data, error } = await supabase
    .from("send_log")
    .select("id, contact_id, opened_at")
    .eq("tracking_pixel_id", pixelId)
    .single();

  console.log("send_log row found:", data);

  if (error) {
    console.log("send_log query error:", error.message, "pixelId:", pixelId);
  }

  if (!data) {
    console.log("No matching send_log for pixelId:", pixelId);
    return gifResponse();
  }

  if (data.opened_at === null) {
    const now = new Date().toISOString();

    const { error: logUpdateError } = await supabase
      .from("send_log")
      .update({ opened_at: now })
      .eq("tracking_pixel_id", pixelId);

    if (logUpdateError) {
      console.log("send_log update error:", logUpdateError.message);
    } else {
      console.log("send_log opened_at updated for pixelId:", pixelId);
    }

    const { data: updatedContacts, error: contactUpdateError } = await supabase
      .from("contacts")
      .update({ status: "opened", updated_at: now })
      .eq("id", data.contact_id)
      .eq("status", "sent")
      .select("id");

    if (contactUpdateError) {
      console.log("contacts update error:", contactUpdateError.message);
    } else {
      console.log(
        "contacts status updated to opened for contact_id:",
        data.contact_id,
        "rows:",
        updatedContacts?.length ?? 0
      );
    }
  } else {
    console.log("send_log already opened at:", data.opened_at);
  }

  return gifResponse();
}
