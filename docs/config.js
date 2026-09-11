/**
 * Campward configuration.
 *
 * These values point the logbook at a Supabase project so one logbook is
 * shared across phones, laptops, and both of you. Clear them and it falls
 * back to saving in whichever browser you happen to be using.
 *
 * The publishable key is meant to be public — it only reaches what the table
 * policy in SETUP.md allows. It is not a secret, but it is also not a lock:
 * anyone who has it can read and write the logbook, so keep nothing sensitive
 * in here. A "sb_secret_..." key must never go in this file.
 */
window.CAMPWARD_CONFIG = {
  supabaseUrl: "https://wmmgexdzhwzjmcmbdaty.supabase.co",
  supabaseAnonKey: "sb_publishable_EFENhetwf86LH4Fbbcss6A_wXUql17t",

  // Sent to the weather and geocoding services so they can reach you if a
  // request misbehaves. A courtesy, not authentication — nothing needs a key.
  contact: "",
};
