CREATE TABLE IF NOT EXISTS batchfee_staff (user_id TEXT PRIMARY KEY REFERENCES users(id), role TEXT NOT NULL CHECK(role IN ('Viewer','Collector','Manager')));
