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
  if (!res.ok) throw new Error(data.error || "Request failed.");
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
// payload: { ingredients, scanType, productName?, brandName?, barcode?, imageUrl? }
export const analyzeIngredients = (payload) =>
  request("/analyze", { method: "POST", body: JSON.stringify(
    typeof payload === "string" ? { ingredients: payload } : payload
  )});

// ── Open Food Facts barcode lookup (client-side, no backend) ──
export async function lookupBarcode(barcode) {
  const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
  let res;
  try {
    res = await fetch(url, { headers: { "User-Agent": "IngredientIQ/1.0" } });
  } catch {
    throw new Error("Network error — could not reach Open Food Facts.");
  }

  if (!res.ok) throw new Error("Open Food Facts unavailable. Try again later.");

  const data = await res.json();

  if (data.status === 0 || !data.product) {
    const err = new Error("Product not found in database.");
    err.notFound = true;
    throw err;
  }

  const p = data.product;
  const ingredients = p.ingredients_text || p.ingredients_text_en || "";

  if (!ingredients.trim()) {
    const err = new Error("Product found but has no ingredient data.");
    err.notFound = true;
    throw err;
  }

  return {
    barcode,
    productName: [p.product_name, p.product_name_en].find(Boolean)?.trim() || "Unknown Product",
    brandName:   p.brands?.split(",")[0]?.trim() || "",
    ingredients: ingredients.trim(),
    imageUrl:    p.image_front_url || p.image_url || "",
    allergens:   p.allergens_tags || [],
    nutriments:  p.nutriments || {},
  };
}

// ── Scans / history ───────────────────────────────────────
export const getScans   = ()    => request("/scans");
export const deleteScan = (id)  => request(`/scans/${id}`, { method: "DELETE" });
export const clearScans = ()    => request("/scans", { method: "DELETE" });
