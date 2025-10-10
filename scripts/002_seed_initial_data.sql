-- Insert initial boss data
INSERT INTO public.bosses (name, description, image_url) VALUES
('Hidras', 'A powerful multi-headed dragon boss', '/blue-dragon-head-boss-hidras.jpg'),
('Kraken', 'A massive sea creature with tentacles', '/placeholder-214ps.png'),
('Phoenix', 'A legendary fire bird that rises from ashes', '/placeholder-wlw71.png')
ON CONFLICT (name) DO NOTHING;

-- Get boss IDs for loot items
DO $$
DECLARE
    hidras_id UUID;
    kraken_id UUID;
    phoenix_id UUID;
BEGIN
    SELECT id INTO hidras_id FROM public.bosses WHERE name = 'Hidras';
    SELECT id INTO kraken_id FROM public.bosses WHERE name = 'Kraken';
    SELECT id INTO phoenix_id FROM public.bosses WHERE name = 'Phoenix';

    -- Insert loot items for Hidras
    INSERT INTO public.loot_items (name, boss_id, base_price, rarity) VALUES
    ('Dragon Scale', hidras_id, 15.50, 'common'),
    ('Dragon Claw', hidras_id, 25.00, 'uncommon'),
    ('Dragon Heart', hidras_id, 150.00, 'rare'),
    ('Dragon Eye', hidras_id, 300.00, 'epic'),
    ('Dragon Soul', hidras_id, 1000.00, 'legendary'),
    ('Fire Essence', hidras_id, 45.00, 'uncommon'),
    ('Ancient Bone', hidras_id, 8.75, 'common')
    ON CONFLICT DO NOTHING;

    -- Insert loot items for Kraken
    INSERT INTO public.loot_items (name, boss_id, base_price, rarity) VALUES
    ('Tentacle', kraken_id, 12.00, 'common'),
    ('Kraken Ink', kraken_id, 35.00, 'uncommon'),
    ('Sea Pearl', kraken_id, 120.00, 'rare'),
    ('Trident Fragment', kraken_id, 250.00, 'epic'),
    ('Ocean Crown', kraken_id, 800.00, 'legendary')
    ON CONFLICT DO NOTHING;

    -- Insert loot items for Phoenix
    INSERT INTO public.loot_items (name, boss_id, base_price, rarity) VALUES
    ('Phoenix Feather', phoenix_id, 20.00, 'common'),
    ('Flame Crystal', phoenix_id, 40.00, 'uncommon'),
    ('Rebirth Ash', phoenix_id, 180.00, 'rare'),
    ('Phoenix Egg', phoenix_id, 400.00, 'epic'),
    ('Eternal Flame', phoenix_id, 1200.00, 'legendary')
    ON CONFLICT DO NOTHING;
END $$;
