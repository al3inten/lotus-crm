import { Request, Response } from "express";
import * as searchService from "./search.service";

export async function globalSearchHandler(req: Request, res: Response) {
  const q = typeof req.query.q === "string" ? req.query.q : "";
  const result = await searchService.globalSearch(q, req.branchFilter);
  res.json(result);
}
