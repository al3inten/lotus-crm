import { z } from "zod";

export const branchFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  city: z.string().min(1, "City is required"),
  locationId: z.string().min(1, "Location is required"),
  address: z.string().optional(),
  autoAssignEnabled: z.boolean().default(true),
});

export type BranchFormValues = z.infer<typeof branchFormSchema>;
export interface BranchFormInput {
  name: string;
  code: string;
  city: string;
  locationId: string;
  address?: string;
  autoAssignEnabled?: boolean;
}
