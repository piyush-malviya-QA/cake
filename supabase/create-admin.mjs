import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://orgmulmzypeeinvvvfwr.supabase.co";

// You need the service_role key (not anon key) to create users via admin API
// Find it at: Dashboard → Settings → API → service_role
const SERVICE_ROLE_KEY = process.argv[2];
const EMAIL = process.argv[3] || "admin@sweetdelights.com";
const PASSWORD = process.argv[4] || "Admin@123";
const NAME = process.argv[5] || "Admin";
const SHOP_NAME = process.argv[6] || "The Cakeifyy";

if (!SERVICE_ROLE_KEY) {
  console.error("Usage: node supabase/create-admin.mjs <service_role_key> [email] [password] [name] [shop_name]");
  console.error("Example: node supabase/create-admin.mjs eyJhbG... admin@shop.com MyPass123 'Shop Admin' 'My Bakery'");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  // Create or find shop
  let shopId;
  const { data: existingShop } = await supabase
    .from("shops")
    .select("id")
    .eq("name", SHOP_NAME)
    .single();

  if (existingShop) {
    shopId = existingShop.id;
    console.log("Using existing shop:", SHOP_NAME, "(", shopId, ")");
  } else {
    const { data: newShop, error: shopError } = await supabase
      .from("shops")
      .insert({ name: SHOP_NAME })
      .select("id")
      .single();

    if (shopError) {
      console.error("Shop creation error:", shopError.message);
      process.exit(1);
    }
    shopId = newShop.id;
    console.log("Shop created:", SHOP_NAME, "(", shopId, ")");
  }

  // Create auth user
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
    });

  if (authError) {
    console.error("Auth error:", authError.message);
    process.exit(1);
  }

  console.log("Auth user created:", authData.user.id);

  // Insert employee record
  const { error: empError } = await supabase.from("employees").insert({
    id: authData.user.id,
    name: NAME,
    email: EMAIL,
    role: "admin",
    shop_id: shopId,
  });

  if (empError) {
    console.error("Employee insert error:", empError.message);
    process.exit(1);
  }

  console.log("\nAdmin created successfully!");
  console.log("  Email:", EMAIL);
  console.log("  Password:", PASSWORD);
  console.log("  Name:", NAME);
  console.log("  Role: admin");
  console.log("  Shop:", SHOP_NAME, "(", shopId, ")");
}

run();
