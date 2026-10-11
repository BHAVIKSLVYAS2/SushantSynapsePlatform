-- Free target only. These triggers keep all multi-record writes atomic at capacity.
CREATE TRIGGER free_records_insert BEFORE INSERT ON records
WHEN (SELECT COUNT(*) FROM records)>=250 OR length(CAST(NEW.data AS BLOB))>8192
 OR (SELECT COALESCE(SUM(length(CAST(data AS BLOB))),0) FROM records)+length(CAST(NEW.data AS BLOB))>262144
BEGIN SELECT RAISE(ABORT,'free_workspace_capacity'); END;
CREATE TRIGGER free_records_update BEFORE UPDATE ON records
WHEN length(CAST(NEW.data AS BLOB))>8192
 OR (SELECT COALESCE(SUM(length(CAST(data AS BLOB))),0) FROM records)-length(CAST(OLD.data AS BLOB))+length(CAST(NEW.data AS BLOB))>262144
BEGIN SELECT RAISE(ABORT,'free_workspace_capacity'); END;
CREATE TRIGGER free_users_insert BEFORE INSERT ON users
WHEN (SELECT COUNT(*) FROM users)>=25
BEGIN SELECT RAISE(ABORT,'free_workspace_capacity'); END;
