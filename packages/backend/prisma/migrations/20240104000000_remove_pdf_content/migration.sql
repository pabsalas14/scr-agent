-- Remove unused pdfContent column from reports table
-- PDF generation is handled client-side via jsPDF
ALTER TABLE "reports" DROP COLUMN IF EXISTS "pdfContent";
