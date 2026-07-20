import { z } from "zod";

export const branchStaffFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
  // Every employee must belong to a department of their branch (mirrors the API rule).
  staffDepartmentId: z.string().min(1, "Department is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type BranchStaffFormValues = z.infer<typeof branchStaffFormSchema>;
