function isFileLike(value: unknown): value is File {
  return (
    value instanceof File &&
    typeof value.arrayBuffer === "function" &&
    typeof value.type === "string"
  );
}

export async function parseCatalogRequest(
  request: Request
): Promise<{ payload: Record<string, unknown>; image: File | null }> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const payload: Record<string, unknown> = {};

    for (const [key, value] of formData.entries()) {
      if (key === "imagen") {
        continue;
      }

      payload[key] = typeof value === "string" ? value : String(value);
    }

    const image = formData.get("imagen");

    return {
      payload,
      image: isFileLike(image) && image.size > 0 ? image : null,
    };
  }

  const payload = (await request.json()) as Record<string, unknown>;

  return {
    payload,
    image: null,
  };
}
