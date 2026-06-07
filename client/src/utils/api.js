const BASE = import.meta.env.VITE_API_URL || "/api";

function getToken() { return localStorage.getItem("iq_token"); }

function authHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || "Request failed.");
    if (data.notFound) err.notFound = true;
    if (data.product)  err.product  = data.product;
    throw err;
  }
  return data;
}

// ── Auth ──────────────────────────────────────────────────
export const register = (name, email, password) =>
  request("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) });

export const login = (email, password) =>
  request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });

export const getMe = () => request("/auth/me");

export const updateProfile = (profile) =>
  request("/auth/profile", { method: "PUT", body: JSON.stringify(profile) });

// ── Analyze ───────────────────────────────────────────────
export const analyzeIngredients = (payload) =>
  request("/analyze", {
    method: "POST",
    body: JSON.stringify(
      typeof payload === "string" ? { ingredients: payload } : payload
    ),
  });

// ── Products / barcode lookup ─────────────────────────────
export async function lookupBarcode(barcode) {
  try {
    const data = await request(`/products/${encodeURIComponent(barcode)}`);
    return {
      barcode:     data.product.barcode,
      productName: data.product.productName,
      brandName:   data.product.brandName,
      ingredients: data.product.ingredients,
      imageUrl:    data.product.imageUrl,
      allergens:   data.product.allergens  || [],
      nutriments:  data.product.nutriments || {},
      source:      data.product.source,
      foundIn:     data.foundIn,
    };
  } catch (err) {
    if (err.notFound) {
      const e = new Error("Product not found in database.");
      e.notFound = true;
      throw e;
    }
    throw err;
  }
}

// ── Product contribution ──────────────────────────────────
export const submitProduct = (payload) =>
  request("/products", {
    method: "POST",
    body:   JSON.stringify(payload),
  });

// ── Scans / history ───────────────────────────────────────
export const getScans   = ()   => request("/scans");
export const deleteScan = (id) => request(`/scans/${id}`, { method: "DELETE" });
export const clearScans = ()   => request("/scans",       { method: "DELETE" });