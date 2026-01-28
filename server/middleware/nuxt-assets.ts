export default defineEventHandler((event) => {
  // Ignore /_nuxt/ directory listing requests (browser/extension artifacts)
  const path = event.path || getRequestURL(event).pathname;
  if (path === '/_nuxt/' || path === '/_nuxt') {
    // Send 204 No Content to prevent error logging
    setResponseStatus(event, 204);
    return '';
  }
});
