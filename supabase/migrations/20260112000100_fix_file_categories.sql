-- Fix existing records with wrong category/type
UPDATE courses
SET 
  file_category = CASE
    WHEN file_format IN ('txt', 'docx', 'rtf', 'odt', 'md') THEN 'text'
    WHEN file_format IN ('jpg', 'jpeg', 'png', 'webp', 'heic', 'tiff', 'tif') THEN 'image'
    WHEN file_format = 'pdf' THEN 'pdf'
    ELSE 'pdf' -- Default fallback
  END,
  original_file_type = CASE
    WHEN file_format IN ('txt', 'docx', 'rtf', 'odt', 'md') THEN 'text'
    WHEN file_format IN ('jpg', 'jpeg', 'png', 'webp', 'heic', 'tiff', 'tif') THEN 'image'
    WHEN file_format = 'pdf' THEN 'pdf'
    ELSE original_file_type
  END
WHERE file_format IS NOT NULL;
