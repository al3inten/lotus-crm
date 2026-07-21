import { Request, Response } from "express";
import * as locationsService from "./locations.service";

export async function pincodeLookupHandler(req: Request, res: Response) {
  const pincode = req.params.pincode;
  if (!/^\d{6}$/.test(pincode)) {
    res.status(400).json({ error: "Pincode must be exactly 6 digits" });
    return;
  }
  const result = await locationsService.lookupPincode(pincode);
  res.json(result);
}

export async function locationSearchHandler(req: Request, res: Response) {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (q.length < 3) {
    res.json([]);
    return;
  }
  const result = await locationsService.searchByName(q);
  res.json(result);
}
