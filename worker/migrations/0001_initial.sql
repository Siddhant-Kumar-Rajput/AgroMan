CREATE TABLE IF NOT EXISTS district_context (
  district_id TEXT PRIMARY KEY,
  soil_ph REAL,
  rainfall_mm REAL,
  moisture REAL,
  observed_at TEXT NOT NULL,
  source TEXT NOT NULL,
  summary TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS district_boundaries (
  district_id TEXT PRIMARY KEY,
  geometry_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS quotas (
  quota_key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS requests (
  request_key TEXT PRIMARY KEY,
  state TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS threads (
  thread_key TEXT PRIMARY KEY,
  district_id TEXT NOT NULL,
  turns INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS receipts (
  id TEXT PRIMARY KEY,
  uid_hash TEXT NOT NULL,
  district_id TEXT NOT NULL,
  diagnosis_json TEXT NOT NULL,
  model TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  used INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  installation TEXT NOT NULL,
  district_id TEXT NOT NULL,
  crop TEXT NOT NULL,
  disease_code TEXT NOT NULL,
  name TEXT NOT NULL,
  confidence REAL NOT NULL,
  latitude_approx REAL NOT NULL,
  longitude_approx REAL NOT NULL,
  timestamp INTEGER NOT NULL,
  origin TEXT NOT NULL CHECK (origin = 'live'),
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS reports_district_time
  ON reports(district_id, timestamp DESC);

CREATE TABLE IF NOT EXISTS translations (
  cache_key TEXT PRIMARY KEY,
  copy_json TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
