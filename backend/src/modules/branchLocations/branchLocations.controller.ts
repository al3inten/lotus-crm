import { Request, Response } from "express";
import * as locationsService from "./branchLocations.service";

export async function createLocationHandler(req: Request, res: Response) {
  const location = await locationsService.createLocation(req.body);
  res.status(201).json(location);
}

export async function listLocationsHandler(_req: Request, res: Response) {
  const locations = await locationsService.listLocations();
  res.json(locations);
}

export async function getLocationHandler(req: Request, res: Response) {
  const location = await locationsService.getLocation(req.params.locationId);
  res.json(location);
}

export async function updateLocationHandler(req: Request, res: Response) {
  const location = await locationsService.updateLocation(req.params.locationId, req.body);
  res.json(location);
}

export async function deleteLocationHandler(req: Request, res: Response) {
  await locationsService.deleteLocation(req.params.locationId);
  res.status(204).send();
}
