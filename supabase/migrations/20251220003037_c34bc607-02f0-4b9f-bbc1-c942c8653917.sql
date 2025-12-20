-- Add display_duration column to banners table (in seconds)
ALTER TABLE public.banners 
ADD COLUMN display_duration integer NOT NULL DEFAULT 5;

-- Add comment explaining the column
COMMENT ON COLUMN public.banners.display_duration IS 'Duration in seconds that this banner should be displayed before rotating to the next';