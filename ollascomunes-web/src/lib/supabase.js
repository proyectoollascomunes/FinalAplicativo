import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL  = "https://kczwvfnqbolrnxhjlnec.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtjend2Zm5xYm9scm54aGpsbmVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2NjY5NDEsImV4cCI6MjA5NTI0Mjk0MX0.-qdG2hRqpPCAc5nBF_QY_AEwvWS6SgM2sV2E1VGCRsU";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);