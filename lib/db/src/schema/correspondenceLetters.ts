import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Correspondence-Assistant letters table.
 * Govtl letter drafting tool – Hindi/English bilingual, with DOCX export.
 */
export const correspondenceLettersTable = pgTable("correspondence_letters", {
  id:              serial("id").primaryKey(),
  type:            text("type").notNull().$type<"new" | "reply">(),
  status:          text("status").notNull().default("draft").$type<"draft" | "final">(),
  letterNumber:    text("letter_number").notNull().default(""),
  date:            text("date").notNull().default(""),
  toName:          text("to_name").notNull().default(""),
  toDesignation:   text("to_designation").notNull().default(""),
  toOffice:        text("to_office").notNull().default(""),
  subject:         text("subject").notNull().default(""),
  reference:       text("reference"),
  body:            text("body").notNull().default(""),
  fromName:        text("from_name").notNull().default(""),
  fromDesignation: text("from_designation").notNull().default(""),
  fromOffice:      text("from_office").notNull().default(""),
  cc:              text("cc"),
  language:        text("language").notNull().default("hindi").$type<"hindi" | "english" | "both">(),
  toNameEn:        text("to_name_en").notNull().default(""),
  toDesignationEn: text("to_designation_en").notNull().default(""),
  toOfficeEn:      text("to_office_en").notNull().default(""),
  subjectEn:       text("subject_en").notNull().default(""),
  referenceEn:     text("reference_en").notNull().default(""),
  bodyEn:          text("body_en").notNull().default(""),
  fromNameEn:      text("from_name_en").notNull().default(""),
  fromDesignationEn: text("from_designation_en").notNull().default(""),
  fromOfficeEn:    text("from_office_en").notNull().default(""),
  ccEn:            text("cc_en").notNull().default(""),
  toMany:          text("to_many").notNull().default(""),
  createdAt:       timestamp("created_at",  { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp("updated_at",  { withTimezone: true }).notNull().defaultNow()
                     .$onUpdate(() => new Date()),
});

export const insertCorrespondenceLetterSchema = createInsertSchema(
  correspondenceLettersTable
).omit({ id: true, createdAt: true, updatedAt: true });

export type InsertCorrespondenceLetter = z.infer<typeof insertCorrespondenceLetterSchema>;
export type CorrespondenceLetter       = typeof correspondenceLettersTable.$inferSelect;
