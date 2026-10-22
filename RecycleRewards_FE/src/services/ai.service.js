// This service is intentionally separate from api.js: the inference API does
// not need a Firebase token and may be hosted behind an Nginx /ai/ proxy.
const AI_API_URL = (import.meta.env.VITE_AI_API_URL || 'http://localhost:8000').replace(/\/$/, '');

export async function detectWasteFrame(blob, signal) {
  const form = new FormData();
  form.append('file', blob, 'webcam-frame.jpg');

  let response;
  try {
    response = await fetch(`${AI_API_URL}/api/v1/detect`, { method: 'POST', body: form, signal });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error(`Không thể kết nối dịch vụ nhận diện (${AI_API_URL}).`);
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.detail || body.message || `YOLO API trả về HTTP ${response.status}.`);
  return body;
}
