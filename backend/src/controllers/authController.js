import User from "../models/User.js";
import bcrypt from "bcrypt";
import { cookieOptions, createToken } from "../utils/token.js";
const safeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  profile: user.profile,
});
export async function register(req, res, next) {
  try {
    const { name, email, password, role = "applicant" } = req.body;
    if (!["applicant", "recruiter"].includes(role))
      return res.status(400).json({
        message: "Only applicant or recruiter registration is allowed",
      });
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });
    res.status(201).json({ user: safeUser(user) });
  } catch (error) {
    if (error.code === 11000)
      return res
        .status(409)
        .json({ message: "That email is already registered" });
    next(error);
  }
}
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.matchesPassword(password)))
      return res.status(401).json({ message: "Incorrect email or password" });
    res
      .cookie("token", createToken(user._id), cookieOptions)
      .json({ user: safeUser(user) });
  } catch (error) {
    next(error);
  }
}
export function logout(req, res) {
  res
    .clearCookie("token", { ...cookieOptions, maxAge: undefined })
    .status(204)
    .send();
}
export const currentUser = (req, res) => res.json({ user: safeUser(req.user) });

export async function updateProfile(req, res, next) {
  try {
    const allowed = req.user.role === 'recruiter'
      ? ['headline', 'phone', 'location', 'bio', 'companyName', 'companyWebsite', 'industry', 'companySize', 'jobTitle']
      : ['headline', 'phone', 'location', 'bio', 'skills', 'resumeUrl'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] === undefined) continue;
      if (key === 'skills') {
        updates[`profile.${key}`] = (Array.isArray(req.body[key]) ? req.body[key] : String(req.body[key]).split(','))
          .map(item => String(item).trim()).filter(Boolean).slice(0, 30);
      } else {
        updates[`profile.${key}`] = String(req.body[key]).trim();
      }
    }
    if (req.body.name !== undefined) {
      const name = String(req.body.name).trim();
      if (!name) return res.status(400).json({ message: 'Name cannot be empty' });
      updates.name = name;
    }
    const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true, runValidators: true });
    res.json({ user: safeUser(user) });
  } catch (error) { next(error); }
}
