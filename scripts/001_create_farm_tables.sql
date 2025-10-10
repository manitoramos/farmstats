-- Create bosses table
CREATE TABLE IF NOT EXISTS public.bosses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create loot_items table
CREATE TABLE IF NOT EXISTS public.loot_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  boss_id UUID REFERENCES public.bosses(id) ON DELETE CASCADE,
  base_price DECIMAL(10,2) DEFAULT 0,
  rarity TEXT CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create farm_runs table
CREATE TABLE IF NOT EXISTS public.farm_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  boss_id UUID REFERENCES public.bosses(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  kills INTEGER DEFAULT 0,
  chests INTEGER DEFAULT 0,
  time_spent INTEGER DEFAULT 0, -- in minutes
  total_earnings DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create farm_run_loot table (junction table for loot obtained in each run)
CREATE TABLE IF NOT EXISTS public.farm_run_loot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_run_id UUID REFERENCES public.farm_runs(id) ON DELETE CASCADE,
  loot_item_id UUID REFERENCES public.loot_items(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  price_per_item DECIMAL(10,2) DEFAULT 0,
  total_value DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create price_history table for tracking item price changes
CREATE TABLE IF NOT EXISTS public.price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loot_item_id UUID REFERENCES public.loot_items(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.bosses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loot_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_run_loot ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for bosses (public read, no user-specific data)
CREATE POLICY "Allow public read access to bosses" ON public.bosses FOR SELECT USING (true);

-- Create RLS policies for loot_items (public read, no user-specific data)
CREATE POLICY "Allow public read access to loot_items" ON public.loot_items FOR SELECT USING (true);

-- Create RLS policies for farm_runs (user can only access their own data)
CREATE POLICY "Users can view their own farm runs" ON public.farm_runs FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert their own farm runs" ON public.farm_runs FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update their own farm runs" ON public.farm_runs FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can delete their own farm runs" ON public.farm_runs FOR DELETE USING (auth.uid()::text = user_id::text);

-- Create RLS policies for farm_run_loot (user can only access loot from their own runs)
CREATE POLICY "Users can view loot from their own farm runs" ON public.farm_run_loot FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.farm_runs 
  WHERE farm_runs.id = farm_run_loot.farm_run_id 
  AND farm_runs.user_id::text = auth.uid()::text
));

CREATE POLICY "Users can insert loot for their own farm runs" ON public.farm_run_loot FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.farm_runs 
  WHERE farm_runs.id = farm_run_loot.farm_run_id 
  AND farm_runs.user_id::text = auth.uid()::text
));

CREATE POLICY "Users can update loot from their own farm runs" ON public.farm_run_loot FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.farm_runs 
  WHERE farm_runs.id = farm_run_loot.farm_run_id 
  AND farm_runs.user_id::text = auth.uid()::text
));

CREATE POLICY "Users can delete loot from their own farm runs" ON public.farm_run_loot FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.farm_runs 
  WHERE farm_runs.id = farm_run_loot.farm_run_id 
  AND farm_runs.user_id::text = auth.uid()::text
));

-- Create RLS policies for price_history (public read, authenticated users can insert)
CREATE POLICY "Allow public read access to price history" ON public.price_history FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert price history" ON public.price_history FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_farm_runs_user_id ON public.farm_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_farm_runs_date ON public.farm_runs(date);
CREATE INDEX IF NOT EXISTS idx_farm_runs_boss_id ON public.farm_runs(boss_id);
CREATE INDEX IF NOT EXISTS idx_farm_run_loot_farm_run_id ON public.farm_run_loot(farm_run_id);
CREATE INDEX IF NOT EXISTS idx_price_history_loot_item_id ON public.price_history(loot_item_id);
CREATE INDEX IF NOT EXISTS idx_price_history_date ON public.price_history(date);
