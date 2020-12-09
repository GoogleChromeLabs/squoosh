// I accidentally shipped with the wrong service worker name.
// This picks up users that still might be using that version.
// We'll be able to delete this file eventually.

addEventListener('install', () => {
  skipWaiting();
});
addEventListener('activate', async () => {
  await self.registration.unregister();
  const allClients = await clients.matchAll({
    includeUncontrolled: true,
  });
  for (const client of allClients) client.navigate('/');
});
