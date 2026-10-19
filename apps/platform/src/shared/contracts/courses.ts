import { z } from "zod";

export const courseSchema = z.object({});
export type CourseInput = z.infer<typeof courseSchema>;
