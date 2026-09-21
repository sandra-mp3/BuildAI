import { z } from "zod";

// Every AI generation call must produce output matching this schema before
// anything is persisted. This is what keeps generation from degrading into
// "ask the model for a blob of code and hope for the best."

export const DataFieldSchema = z.object({
  name: z.string(),
  type: z.enum(["string", "number", "boolean", "date", "relation"]),
  required: z.boolean().default(true),
});

export const DataModelSchema = z.object({
  name: z.string(),
  fields: z.array(DataFieldSchema).min(1),
});

export const ComponentSchema = z.object({
  name: z.string(),
  path: z.string(),
  description: z.string(),
});

export const PageSchema = z.object({
  route: z.string(),
  title: z.string(),
  components: z.array(z.string()),
});

export const ProjectFileSchema = z.object({
  path: z.string(),
  language: z.enum(["typescript", "css", "json", "markdown"]),
  content: z.string(),
});

export const AppSpecSchema = z.object({
  summary: z.string(),
  pages: z.array(PageSchema).min(1),
  components: z.array(ComponentSchema).min(1),
  dataModels: z.array(DataModelSchema),
  files: z.array(ProjectFileSchema).min(1),
});

export type AppSpec = z.infer<typeof AppSpecSchema>;

export const ChatEditSchema = z.object({
  summary: z.string(),
  filesChanged: z.array(ProjectFileSchema),
  filesDeleted: z.array(z.string()).default([]),
});

export type ChatEdit = z.infer<typeof ChatEditSchema>;

export const ErrorDiagnosisSchema = z.object({
  rootCause: z.string(),
  fix: z.object({
    path: z.string(),
    content: z.string(),
  }),
  explanation: z.string(),
});

export type ErrorDiagnosis = z.infer<typeof ErrorDiagnosisSchema>;
