
CREATE TABLE public.owner_info (
  id INTEGER PRIMARY KEY DEFAULT 1,
  first_name TEXT,
  last_name TEXT,
  age INTEGER,
  email TEXT,
  phone TEXT,
  address TEXT,
  bio TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT owner_info_singleton CHECK (id = 1)
);

ALTER TABLE public.owner_info ENABLE ROW LEVEL SECURITY;

-- Anyone (even anonymous visitors) can read the owner info
CREATE POLICY "Public can read owner info"
  ON public.owner_info
  FOR SELECT
  USING (true);

-- No client can directly INSERT/UPDATE/DELETE — only the edge function (service role) can.
-- Service role bypasses RLS, so no policies needed for writes.

-- Seed the single row with current values
INSERT INTO public.owner_info (id, first_name, last_name, age, email, phone, address, bio)
VALUES (
  1,
  'Adnane',
  'Ouaazizi',
  16,
  'ouaazizisafouan11@gmail.com',
  '+212 6 00 00 00 00',
  'Maroc',
  'Bienvenue sur mon site ! Je m''appelle Adnane et c''est mon premier projet web. J''apprends le développement web et je suis passionné par le code.'
);
