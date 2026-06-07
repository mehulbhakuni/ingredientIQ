/**
 * uploadImage(dataUri) → Promise<string>
 *
 * Current implementation: returns the data URI as-is.
 * Images are stored as data URIs in MongoDB during development.
 *
 * To switch to Cloudinary:
 *   1. npm install cloudinary  (in server/)
 *   2. Add to .env: CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
 *   3. Replace the function body below with:
 *
 *      const cloudinary = require("cloudinary").v2;
 *      const result = await cloudinary.uploader.upload(dataUri, {
 *        folder: "ingredientiq/products",
 *        resource_type: "image",
 *      });
 *      return result.secure_url;
 *
 * MongoDB always stores only the returned URL string — never raw image bytes.
 */
async function uploadImage(dataUri) {
  if (!dataUri) return "";

  // Validate it's actually a data URI before storing
  if (!dataUri.startsWith("data:image/")) {
    throw new Error("Invalid image format.");
  }

  // Size guard — data URIs grow ~33% from base64 encoding
  // A 5MB image becomes ~6.7MB as a data URI — reject anything over 8MB
  if (dataUri.length > 8 * 1024 * 1024) {
    throw new Error("Image too large. Please use an image under 5MB.");
  }

  // TODO: replace with Cloudinary upload when ready
  return dataUri;
}

module.exports = { uploadImage };
