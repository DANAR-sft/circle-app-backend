import joi from "joi";

export const loginSchema = joi.object({
  email: joi.string().email().required(),
  password: joi.string().min(6).required(),
});

export const registerSchema = joi.object({
  fullname: joi.string().min(3).required(),
  username: joi.string().min(3).required(),
  email: joi.string().email().required(),
  password: joi.string().min(6).required(),
});

export const threadSchema = joi.object({
  content: joi.string().required(),
});

export const replySchema = joi.object({
  content: joi.string().required(),
  threadId: joi.number().required(),
});

export const profileUpdateSchema = joi.object({
  fullname: joi.string().min(3).optional(),
  username: joi.string().min(3).optional(),
  bio: joi.string().max(160).optional(),
});
