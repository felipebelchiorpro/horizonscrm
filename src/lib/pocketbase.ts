import PocketBase from 'pocketbase';

// Connect to local or remote PocketBase instance
// Connect to remote PocketBase instance
const PB_URL = import.meta.env.VITE_POCKETBASE_URL || 'https://backventure.venturexp.pro';
export const pb = new PocketBase(PB_URL);

// Optional: Automatically disable auto cancellation so requests don't abort unnecessarily
pb.autoCancellation(false);
