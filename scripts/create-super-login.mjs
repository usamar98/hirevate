import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const cwd = process.cwd();

function loadEnvFile(fileName) {
  const filePath = path.join(cwd, fileName);
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");
loadEnvFile(".env.production.local");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const username = process.env.SUPER_LOGIN_USERNAME?.trim() || "usamariaz";
const email = process.env.SUPER_LOGIN_EMAIL?.trim() || "usamariaz@hirevate.test";
const password = process.env.SUPER_LOGIN_PASSWORD?.trim();
const fullName = process.env.SUPER_LOGIN_FULL_NAME?.trim() || "Usama Riaz";

if (!supabaseUrl || !serviceRoleKey || supabaseUrl.length < 10 || serviceRoleKey.length < 10) {
  console.error("Missing real NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

if (!password || password.length < 6) {
  console.error("Set SUPER_LOGIN_PASSWORD to the password you want for the super login.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function findUserByEmail(targetEmail) {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;

    const user = data.users.find((item) => item.email?.toLowerCase() === targetEmail.toLowerCase());
    if (user) return user;
    if (data.users.length < 1000) return null;
  }

  return null;
}

async function upsertProfile(userId) {
  const { error } = await supabase.from("profiles").upsert(
    {
      id: userId,
      email,
      full_name: fullName,
      role: "admin",
      subscription_status: "active",
      stripe_customer_id: null,
      stripe_subscription_id: null,
      last_seen_at: new Date().toISOString()
    },
    { onConflict: "id" }
  );

  if (error) throw error;
}

async function main() {
  const existingUser = await findUserByEmail(email);
  const metadata = {
    full_name: fullName,
    super_login_username: username
  };

  const userResult = existingUser
    ? await supabase.auth.admin.updateUserById(existingUser.id, {
        email,
        password,
        email_confirm: true,
        user_metadata: metadata
      })
    : await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: metadata
      });

  if (userResult.error) throw userResult.error;

  await upsertProfile(userResult.data.user.id);

  console.log(`Super login ready: ${username}`);
  console.log(`Mapped Supabase email: ${email}`);
  console.log("Profile role: admin");
  console.log("Starting plan: active");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
