export function getErrorMessage(err, fallback) {
  const data = err.response?.data;
  if (data?.errors?.length) {
    return data.errors.map((item) => item.message).join(' ');
  }
  return data?.message || fallback;
}
