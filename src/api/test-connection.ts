// src/api/test-connection.ts
import { supabase } from "@/lib/supabase";

export async function testConnection() {
  console.log("🔌 Testing Supabase connection...");
  
  const { data, error } = await supabase
    .from("inspirations")
    .select("count")
    .limit(1);

  if (error) {
    console.error("❌ Connection failed:", error.message);
    return false;
  }

  console.log("✅ Connection successful!");
  console.log("📊 Data:", data);
  return true;
}