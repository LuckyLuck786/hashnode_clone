// Creates an Error that the error middleware turns into a JSON response with the given status.
export default function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}
