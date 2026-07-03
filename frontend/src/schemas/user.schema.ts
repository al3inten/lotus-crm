import { z } from "zod";

export const branchStaffFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
  role: z.enum(["CONSULTANT", "CR_TEAM"]),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type BranchStaffFormValues = z.infer<typeof branchStaffFormSchema>;
