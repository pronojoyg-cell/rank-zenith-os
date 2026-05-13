
-- Enums
CREATE TYPE subject_t AS ENUM ('Physics','Chemistry','Maths');
CREATE TYPE mistake_t AS ENUM ('silly','concept','calculation','time','misread');
CREATE TYPE difficulty_t AS ENUM ('easy','medium','hard','advanced');
CREATE TYPE rev_stage_t AS ENUM ('D1','D3','D7','D14','D30','mastered');

-- profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name text,
  target_air int DEFAULT 100,
  exam_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- daily tasks (non-negotiables)
CREATE TABLE public.daily_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  task_date date NOT NULL DEFAULT current_date,
  title text NOT NULL,
  target int NOT NULL DEFAULT 1,
  done int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.daily_tasks(user_id, task_date);

-- practice sessions
CREATE TABLE public.practice_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  subject subject_t NOT NULL,
  chapter text,
  attempted int NOT NULL DEFAULT 0,
  correct int NOT NULL DEFAULT 0,
  duration_min int NOT NULL DEFAULT 0,
  difficulty difficulty_t NOT NULL DEFAULT 'medium',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.practice_sessions(user_id, created_at DESC);

-- mistakes
CREATE TABLE public.mistakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  subject subject_t NOT NULL,
  chapter text,
  question text NOT NULL,
  type mistake_t NOT NULL DEFAULT 'concept',
  mark_cost int NOT NULL DEFAULT 4,
  notes text,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.mistakes(user_id, created_at DESC);

-- revisions
CREATE TABLE public.revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  topic text NOT NULL,
  subject subject_t NOT NULL,
  stage rev_stage_t NOT NULL DEFAULT 'D1',
  confidence int NOT NULL DEFAULT 50,
  last_revised_at timestamptz NOT NULL DEFAULT now(),
  next_review_at timestamptz NOT NULL DEFAULT (now() + interval '1 day'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.revisions(user_id, next_review_at);

-- focus sessions
CREATE TABLE public.focus_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  subject subject_t,
  label text,
  started_at timestamptz NOT NULL DEFAULT now(),
  duration_sec int NOT NULL DEFAULT 0,
  distractions int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.focus_sessions(user_id, started_at DESC);

-- mocks
CREATE TABLE public.mocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  taken_on date NOT NULL DEFAULT current_date,
  marks int NOT NULL DEFAULT 0,
  max_marks int NOT NULL DEFAULT 300,
  rank_projection int,
  physics int DEFAULT 0,
  chemistry int DEFAULT 0,
  maths int DEFAULT 0,
  silly_loss int DEFAULT 0,
  concept_loss int DEFAULT 0,
  time_loss int DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.mocks(user_id, taken_on DESC);

-- mentor messages
CREATE TABLE public.mentor_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.mentor_messages(user_id, created_at);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mistakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_messages ENABLE ROW LEVEL SECURITY;

-- Generic owner-only policies
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['daily_tasks','practice_sessions','mistakes','revisions','focus_sessions','mocks','mentor_messages']) LOOP
    EXECUTE format('CREATE POLICY "own_select_%1$s" ON public.%1$s FOR SELECT USING (auth.uid() = user_id);', t);
    EXECUTE format('CREATE POLICY "own_insert_%1$s" ON public.%1$s FOR INSERT WITH CHECK (auth.uid() = user_id);', t);
    EXECUTE format('CREATE POLICY "own_update_%1$s" ON public.%1$s FOR UPDATE USING (auth.uid() = user_id);', t);
    EXECUTE format('CREATE POLICY "own_delete_%1$s" ON public.%1$s FOR DELETE USING (auth.uid() = user_id);', t);
  END LOOP;
END $$;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)));
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Spaced-rep helper: advance stage and bump next_review_at
CREATE OR REPLACE FUNCTION public.advance_revision(_id uuid, _confidence int)
RETURNS public.revisions LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  cur public.revisions;
  next_stage rev_stage_t;
  delta interval;
BEGIN
  SELECT * INTO cur FROM public.revisions WHERE id = _id AND user_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Not found'; END IF;

  next_stage := CASE cur.stage
    WHEN 'D1' THEN 'D3'::rev_stage_t
    WHEN 'D3' THEN 'D7'::rev_stage_t
    WHEN 'D7' THEN 'D14'::rev_stage_t
    WHEN 'D14' THEN 'D30'::rev_stage_t
    WHEN 'D30' THEN 'mastered'::rev_stage_t
    ELSE 'mastered'::rev_stage_t
  END;

  delta := CASE next_stage
    WHEN 'D3' THEN interval '3 days'
    WHEN 'D7' THEN interval '7 days'
    WHEN 'D14' THEN interval '14 days'
    WHEN 'D30' THEN interval '30 days'
    WHEN 'mastered' THEN interval '90 days'
    ELSE interval '1 day'
  END;

  UPDATE public.revisions
    SET stage = next_stage,
        confidence = GREATEST(0, LEAST(100, _confidence)),
        last_revised_at = now(),
        next_review_at = now() + delta
  WHERE id = _id
  RETURNING * INTO cur;

  RETURN cur;
END $$;
