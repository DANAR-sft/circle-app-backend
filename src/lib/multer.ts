import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "placeholder_cloud_name",
  api_key: process.env.CLOUDINARY_API_KEY || "placeholder_api_key",
  api_secret: process.env.CLOUDINARY_API_SECRET || "placeholder_api_secret",
});

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: "circle_app", // Folder name in Cloudinary
      allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
      // Optional: you can set transformation or public_id here
    };
  },
});

const fileFilter: multer.Options["fileFilter"] = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `File type not allowed. Allowed types: ${ALLOWED_TYPES.join(", ")}`,
      ),
    );
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});
