
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://plzzzbofsjooiubbfkgn.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsenp6Ym9mc2pvb2l1YmJma2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0ODE3ODQsImV4cCI6MjA5NTA1Nzc4NH0.2GHOlD8XJaUmO3__oUBK-XV6x-bGgL9zHLZyozZ9PdM"; // lascia la tua completa

export const supabase = createClient(supabaseUrl, supabaseKey);
