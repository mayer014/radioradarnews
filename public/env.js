// Runtime environment overrides (optional)
// In Easypanel, you can mount or generate this file at container start to inject runtime config
// Example (set via Docker entrypoint): echo "window.__ENV__={RADIO_STREAM_URL:'https://cc6.streammaximum.com:20010/'};" > /usr/share/nginx/html/env.js

window.__ENV__ = Object.assign(
  {
    // Non-sensitive runtime config
    RADIO_STREAM_URL: '',
    APP_NAME: '',
    APP_DESCRIPTION: '',
    APP_URL: ''
  },
  window.__ENV__ || {}
);
