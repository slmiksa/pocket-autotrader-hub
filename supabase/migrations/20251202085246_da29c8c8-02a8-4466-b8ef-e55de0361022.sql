-- Add supply_demand_enabled column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN supply_demand_enabled boolean DEFAULT false;

COMMENT ON COLUMN public.profiles.supply_demand_enabled IS 'Enable/disable supply and demand analyzer for user';