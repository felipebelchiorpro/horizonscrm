import PocketBase from 'pocketbase';

// Connect to local or remote PocketBase instance
// Connect to remote PocketBase instance
export const pb = new PocketBase('https://backventure.venturexp.pro');

// Optional: Automatically disable auto cancellation so requests don't abort unnecessarily
pb.autoCancellation(false);
