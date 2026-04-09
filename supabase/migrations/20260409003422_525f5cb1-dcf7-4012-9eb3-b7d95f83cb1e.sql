
-- Create checklist_items table
CREATE TABLE public.checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  checked BOOLEAN NOT NULL DEFAULT false,
  memo TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read checklist items (no auth required for this app)
CREATE POLICY "Anyone can view checklist items"
  ON public.checklist_items FOR SELECT
  USING (true);

-- Allow anyone to update checklist items
CREATE POLICY "Anyone can update checklist items"
  ON public.checklist_items FOR UPDATE
  USING (true);

-- Allow anyone to insert checklist items
CREATE POLICY "Anyone can insert checklist items"
  ON public.checklist_items FOR INSERT
  WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_checklist_items_updated_at
  BEFORE UPDATE ON public.checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
