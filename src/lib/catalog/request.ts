function isFileLike(value: unknown): value is File {
  return (
    value instanceof File &&
    typeof value.arrayBuffer === "function" &&
    typeof value.type === "string"
  );
}

export async function parseCatalogRequest(
  request: Request
): Promise<{ payload: Record<string, unknown>; images: File[] }> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const payload: Record<string, unknown> = {};
    const images: File[] = [];

    for (const [key, value] of formData.entries()) {
      if (key === "imagen" || key === "imagenes") {
        if (isFileLike(value) && value.size > 0) {
          images.push(value);
        }
        continue;
      }

      payload[key] = typeof value === "string" ? value : String(value);
    }

    return {
      payload,
      images,
    };
  }

  const payload = (await request.json()) as Record<string, unknown>;

  return {
    payload,
    images: [],
  };
}
