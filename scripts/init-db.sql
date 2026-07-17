-- Auth.js required tables
CREATE TABLE IF NOT EXISTS users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text,
  email text,
  "emailVerified" timestamp with time zone,
  image text,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  "userId" uuid NOT NULL,
  type text NOT NULL,
  provider text NOT NULL,
  "providerAccountId" text NOT NULL,
  refresh_token text,
  access_token text,
  expires_at bigint,
  id_token text,
  scope text,
  session_state text,
  token_type text,
  PRIMARY KEY (id),
  CONSTRAINT fk_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  "userId" uuid NOT NULL,
  "expires" timestamp with time zone NOT NULL,
  "sessionToken" text NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS verification_token (
  identifier text NOT NULL,
  expires timestamp with time zone NOT NULL,
  token text NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- Custom tables for pycourse
CREATE TABLE IF NOT EXISTS progress (
  user_id uuid NOT NULL,
  completed text[] DEFAULT '{}',
  quiz_scores jsonb DEFAULT '{}',
  challenges_passed jsonb DEFAULT '{}',
  badges text[] DEFAULT '{}',
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (user_id),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS streaks (
  user_id uuid NOT NULL,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_active_date date,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
