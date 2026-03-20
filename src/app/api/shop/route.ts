import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function verifyAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: employee } = await supabase
    .from("employees")
    .select("role, shop_id, name")
    .eq("id", user.id)
    .single();

  if (!employee || employee.role !== "admin") return null;
  return { userId: user.id, shopId: employee.shop_id as string, userName: employee.name as string };
}

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shops")
    .select("*")
    .eq("id", admin.shopId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { name, address, phone } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Shop name is required" }, { status: 400 });
  }

  const adminClient = getAdminClient();
  const updatePayload = { name: name.trim(), address: address?.trim() || null, phone: phone?.trim() || null };

  const { data, error } = await adminClient
    .from("shops")
    .update(updatePayload)
    .eq("id", admin.shopId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Audit log
  await adminClient.from("audit_log").insert({
    shop_id: admin.shopId,
    user_id: admin.userId,
    user_name: admin.userName,
    action: "updated",
    entity: "shop",
    entity_id: admin.shopId,
    details: updatePayload,
  });

  return NextResponse.json(data);
}
