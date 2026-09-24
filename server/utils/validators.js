export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isHttpUrl(value) {
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

// Mongoose validator for optional URL fields: empty is fine, anything else must be http(s).
export const optionalHttpUrl = (label) => ({
  validator: (value) => !value || isHttpUrl(value),
  message: `${label} must be a valid http(s) URL`,
});
