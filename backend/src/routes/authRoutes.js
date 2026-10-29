import { Router } from "express";
import {
  currentUser,
  login,
  logout,
  register,
  updateProfile,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = Router();
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protect, currentUser);
router.patch("/profile", protect, updateProfile);
export default router;
