/**
 * Campward configuration.
 *
 * Leave this as-is and the logbook saves to whichever browser you are using —
 * fine for one person on one device, but your entries won't reach anyone else.
 *
 * To share one logbook between two people and across phones and laptops, make
 * a free Supabase project (supabase.com, no card needed), run the SQL in
 * SETUP.md, then paste the two values below. They are safe to keep in a public
 * repository: the anon key only reaches what your table policy allows.
 */
window.CAMPWARD_CONFIG = {
  supabaseUrl: "",
  supabaseAnonKey: "",

  // Sent to the weather and geocoding services so they can reach you if a
  // request misbehaves. A courtesy, not authentication — nothing needs a key.
  contact: "",
};
