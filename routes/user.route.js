// routes/user.route.js
import express from "express";
import { login, register, searchUser } from "../controller/auth.controller.js";
import { 
  getMyProfileData, 
  uploadProfilePic,
  updateUserProfile              // ✅ NEW import
} from "../controller/user.controller.js";
import { authMiddleware } from "../utility/auth.Middleware.js";
import { upload } from "../utility/multer.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/search/:name", searchUser);
router.get("/me", authMiddleware, getMyProfileData);

router.post(
  "/uploadProfilePic",
  authMiddleware,
  upload.single("profilePic"),
  uploadProfilePic
);

// ✅ This is what your frontend is calling: PUT /api/user/update
router.put("/update", authMiddleware, updateUserProfile);

export default router;
