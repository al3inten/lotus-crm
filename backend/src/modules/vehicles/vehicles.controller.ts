import { Request, Response } from "express";
import * as vehiclesService from "./vehicles.service";

export async function createVehicleModelHandler(req: Request, res: Response) {
  const model = await vehiclesService.createVehicleModel(req.body);
  res.status(201).json(model);
}

export async function listVehicleModelsHandler(req: Request, res: Response) {
  const models = await vehiclesService.listVehicleModels();
  res.json(models);
}

export async function updateVehicleModelHandler(req: Request, res: Response) {
  const model = await vehiclesService.updateVehicleModel(req.params.modelId, req.body);
  res.json(model);
}

export async function deleteVehicleModelHandler(req: Request, res: Response) {
  await vehiclesService.deleteVehicleModel(req.params.modelId);
  res.status(204).send();
}

export async function createVehicleVariantHandler(req: Request, res: Response) {
  const variant = await vehiclesService.createVehicleVariant(req.params.modelId, req.body);
  res.status(201).json(variant);
}

export async function updateVehicleVariantHandler(req: Request, res: Response) {
  const variant = await vehiclesService.updateVehicleVariant(req.params.variantId, req.body);
  res.json(variant);
}

export async function deleteVehicleVariantHandler(req: Request, res: Response) {
  await vehiclesService.deleteVehicleVariant(req.params.variantId);
  res.status(204).send();
}
