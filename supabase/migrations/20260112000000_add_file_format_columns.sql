-- Add file_format column to courses table
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS file_format TEXT,
ADD COLUMN IF NOT EXISTS file_category TEXT CHECK (file_category IN ('pdf', 'text', 'image')),
ADD COLUMN IF NOT EXISTS processing_metadata JSONB DEFAULT '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN courses.file_format IS 'Specific file extension (pdf, docx, heic, etc.)';
COMMENT ON COLUMN courses.file_category IS 'Broad category: pdf, text, or image';
COMMENT ON COLUMN courses.processing_metadata IS 'Processing details: method, word_count, confidence, etc.';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_courses_file_format ON courses(file_format);
CREATE INDEX IF NOT EXISTS idx_courses_file_category ON courses(file_category);
