import { Request, Response } from "express";

export const createMockResponse = (): Response => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res as Response);
  res.json = jest.fn().mockReturnValue(res as Response);
  res.send = jest.fn().mockReturnValue(res as Response);
  (res as any).locals = {};
  return res as Response;
};

export const createMockRequest = (opts?: Partial<Request>): Request => {
  return opts as Request;
};

export const createMockFiles = (names: string[]) =>
  names.map((n) => ({ filename: n })) as unknown as Express.Multer.File[];
