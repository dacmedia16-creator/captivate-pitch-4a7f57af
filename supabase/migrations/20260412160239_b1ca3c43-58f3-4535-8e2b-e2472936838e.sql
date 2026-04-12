
ALTER TABLE agency_profiles ADD COLUMN IF NOT EXISTS objectives jsonb DEFAULT NULL;
ALTER TABLE agency_profiles ADD COLUMN IF NOT EXISTS value_propositions jsonb DEFAULT NULL;
ALTER TABLE agency_profiles ADD COLUMN IF NOT EXISTS global_stats jsonb DEFAULT NULL;
ALTER TABLE presentations ADD COLUMN IF NOT EXISTS required_documents jsonb DEFAULT NULL;
