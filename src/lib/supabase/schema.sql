CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS recovery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  date DATE NOT NULL,
  sleep_score INTEGER NOT NULL,
  sleep_duration NUMERIC NOT NULL,
  hrv NUMERIC NOT NULL,
  body_battery INTEGER NOT NULL,
  stress_level INTEGER NOT NULL,
  soreness INTEGER NOT NULL,
  energy_level INTEGER NOT NULL,
  notes TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  date DATE NOT NULL,
  name TEXT NOT NULL,
  overall_fatigue INTEGER NOT NULL,
  overall_soreness INTEGER NOT NULL,
  workout_quality INTEGER NOT NULL,
  session_feeling INTEGER NOT NULL,
  notes TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  workout_log_id UUID REFERENCES workout_logs(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  sets JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS nutrition_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  date DATE NOT NULL,
  meal_quality INTEGER NOT NULL,
  hydration_liters NUMERIC NOT NULL,
  caffeine_intake NUMERIC NOT NULL,
  meal_timing TEXT NOT NULL,
  protein_adequacy TEXT NOT NULL,
  junk_food_today BOOLEAN NOT NULL DEFAULT false,
  energy_stability INTEGER NOT NULL,
  notes TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS supplement_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  date DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS supplement_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  supplement_log_id UUID REFERENCES supplement_logs(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  timing TEXT NOT NULL,
  taken BOOLEAN NOT NULL DEFAULT false,
  purpose TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS lifestyle_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  date DATE NOT NULL,
  mood INTEGER NOT NULL,
  motivation INTEGER NOT NULL,
  focus INTEGER NOT NULL,
  productivity INTEGER NOT NULL,
  energy INTEGER NOT NULL,
  stress INTEGER NOT NULL,
  notes TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS user_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  avg_sleep_score NUMERIC NOT NULL,
  avg_sleep_duration NUMERIC NOT NULL,
  avg_hrv NUMERIC NOT NULL,
  avg_body_battery NUMERIC NOT NULL,
  avg_stress_level NUMERIC NOT NULL,
  avg_fatigue_level NUMERIC NOT NULL,
  avg_recovery_score NUMERIC NOT NULL,
  avg_workout_quality NUMERIC NOT NULL,
  hrv_std_dev NUMERIC NOT NULL,
  sleep_std_dev NUMERIC NOT NULL
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  name TEXT NOT NULL,
  baseline_period_complete BOOLEAN NOT NULL DEFAULT false,
  onboarding_complete BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS pending_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  date DATE NOT NULL,
  severity TEXT NOT NULL,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_recovery_logs_user_id_date ON recovery_logs (user_id, date);
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_id_date ON workout_logs (user_id, date);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_user_id_workout_log_id ON workout_exercises (user_id, workout_log_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_user_id_date ON nutrition_logs (user_id, date);
CREATE INDEX IF NOT EXISTS idx_supplement_logs_user_id_date ON supplement_logs (user_id, date);
CREATE INDEX IF NOT EXISTS idx_supplement_entries_user_id_supplement_log_id ON supplement_entries (user_id, supplement_log_id);
CREATE INDEX IF NOT EXISTS idx_lifestyle_logs_user_id_date ON lifestyle_logs (user_id, date);
CREATE INDEX IF NOT EXISTS idx_user_baselines_user_id ON user_baselines (user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences (user_id);
CREATE INDEX IF NOT EXISTS idx_pending_insights_user_id_date ON pending_insights (user_id, date);

ALTER TABLE recovery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplement_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplement_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE lifestyle_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY recovery_logs_select ON recovery_logs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY recovery_logs_insert ON recovery_logs FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY recovery_logs_update ON recovery_logs FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY recovery_logs_delete ON recovery_logs FOR DELETE USING (user_id = auth.uid());

CREATE POLICY workout_logs_select ON workout_logs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY workout_logs_insert ON workout_logs FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY workout_logs_update ON workout_logs FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY workout_logs_delete ON workout_logs FOR DELETE USING (user_id = auth.uid());

CREATE POLICY workout_exercises_select ON workout_exercises FOR SELECT USING (user_id = auth.uid());
CREATE POLICY workout_exercises_insert ON workout_exercises FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY workout_exercises_update ON workout_exercises FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY workout_exercises_delete ON workout_exercises FOR DELETE USING (user_id = auth.uid());

CREATE POLICY nutrition_logs_select ON nutrition_logs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY nutrition_logs_insert ON nutrition_logs FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY nutrition_logs_update ON nutrition_logs FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY nutrition_logs_delete ON nutrition_logs FOR DELETE USING (user_id = auth.uid());

CREATE POLICY supplement_logs_select ON supplement_logs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY supplement_logs_insert ON supplement_logs FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY supplement_logs_update ON supplement_logs FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY supplement_logs_delete ON supplement_logs FOR DELETE USING (user_id = auth.uid());

CREATE POLICY supplement_entries_select ON supplement_entries FOR SELECT USING (user_id = auth.uid());
CREATE POLICY supplement_entries_insert ON supplement_entries FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY supplement_entries_update ON supplement_entries FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY supplement_entries_delete ON supplement_entries FOR DELETE USING (user_id = auth.uid());

CREATE POLICY lifestyle_logs_select ON lifestyle_logs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY lifestyle_logs_insert ON lifestyle_logs FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY lifestyle_logs_update ON lifestyle_logs FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY lifestyle_logs_delete ON lifestyle_logs FOR DELETE USING (user_id = auth.uid());

CREATE POLICY user_baselines_select ON user_baselines FOR SELECT USING (user_id = auth.uid());
CREATE POLICY user_baselines_insert ON user_baselines FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY user_baselines_update ON user_baselines FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY user_baselines_delete ON user_baselines FOR DELETE USING (user_id = auth.uid());

CREATE POLICY user_profiles_select ON user_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY user_profiles_insert ON user_profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY user_profiles_update ON user_profiles FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY user_profiles_delete ON user_profiles FOR DELETE USING (user_id = auth.uid());

CREATE POLICY user_preferences_select ON user_preferences FOR SELECT USING (user_id = auth.uid());
CREATE POLICY user_preferences_insert ON user_preferences FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY user_preferences_update ON user_preferences FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY user_preferences_delete ON user_preferences FOR DELETE USING (user_id = auth.uid());

CREATE POLICY pending_insights_select ON pending_insights FOR SELECT USING (user_id = auth.uid());
CREATE POLICY pending_insights_insert ON pending_insights FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY pending_insights_update ON pending_insights FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY pending_insights_delete ON pending_insights FOR DELETE USING (user_id = auth.uid());
