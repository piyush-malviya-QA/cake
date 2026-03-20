import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function verifyAdmin(request: NextRequest) {
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
  return { ...user, shopId: employee.shop_id as string, userName: employee.name as string };
}

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { name, email, password, role } = body;

  if (!name || !email || !password || !role) {
    return NextResponse.json(
      { error: "Name, email, password, and role are required" },
      { status: 400 }
    );
  }

  if (!["admin", "cashier"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const adminClient = getAdminClient();

  // Create auth user
  const { data: authData, error: authError } =
    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  // Insert employee record (same shop as the admin who created them)
  const { error: insertError } = await adminClient.from("employees").insert({
    id: authData.user.id,
    name,
    email,
    role,
    shop_id: admin.shopId,
  });

  if (insertError) {
    // Rollback: delete the auth user
    await adminClient.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Audit log
  const supabaseForAudit = await createClient();
  await supabaseForAudit.from("audit_log").insert({
    shop_id: admin.shopId,
    user_id: admin.id,
    user_name: admin.userName,
    action: "created",
    entity: "employee",
    entity_id: authData.user.id,
    details: { name, email, role },
  });

  return NextResponse.json({ id: authData.user.id, name, email, role });
}

export async function DELETE(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Employee ID is required" },
      { status: 400 }
    );
  }

  // Prevent self-deletion
  if (id === admin.id) {
    return NextResponse.json(
      { error: "You cannot delete yourself" },
      { status: 400 }
    );
  }

  const adminClient = getAdminClient();

  // Get employee info before deleting (for audit)
  const { data: empToDelete } = await adminClient
    .from("employees")
    .select("name, email")
    .eq("id", id)
    .single();

  // Delete employee record first
  const { error: deleteError } = await adminClient
    .from("employees")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  // Delete auth user
  const { error: authError } = await adminClient.auth.admin.deleteUser(id);

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  // Audit log
  const supabaseForAudit = await createClient();
  await supabaseForAudit.from("audit_log").insert({
    shop_id: admin.shopId,
    user_id: admin.id,
    user_name: admin.userName,
    action: "deleted",
    entity: "employee",
    entity_id: id,
    details: { name: empToDelete?.name, email: empToDelete?.email },
  });

  return NextResponse.json({ success: true });
}
