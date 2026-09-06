-- Chambers-owned business tables and reporting views. Preserve names for existing databases.
CREATE TABLE IF NOT EXISTS records (
    kind TEXT NOT NULL,
    id TEXT NOT NULL,
    data TEXT NOT NULL CHECK (json_valid(data)),
    PRIMARY KEY (kind, id)
);

CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    mime TEXT NOT NULL,
    content BLOB NOT NULL
);

CREATE INDEX IF NOT EXISTS records_case ON records(kind, json_extract(data, '$.caseId'));

CREATE INDEX IF NOT EXISTS records_client ON records(kind, json_extract(data, '$.clientId'));

CREATE INDEX IF NOT EXISTS records_invoice ON records(kind, json_extract(data, '$.invoiceId'));

CREATE VIEW IF NOT EXISTS clients AS
SELECT id, json_extract(data, '$.name') AS name,
       json_extract(data, '$.email') AS email,
       json_extract(data, '$.phone') AS phone,
       json_extract(data, '$.archived') AS archived, data
FROM records WHERE kind = 'clients';

CREATE VIEW IF NOT EXISTS cases AS
SELECT id, json_extract(data, '$.title') AS title,
       json_extract(data, '$.clientId') AS client_id,
       json_extract(data, '$.number') AS case_number,
       json_extract(data, '$.cnr') AS cnr,
       json_extract(data, '$.court') AS court,
       json_extract(data, '$.status') AS status,
       json_extract(data, '$.archived') AS archived, data
FROM records WHERE kind = 'cases';

CREATE VIEW IF NOT EXISTS hearings AS
SELECT id, json_extract(data, '$.caseId') AS case_id,
       json_extract(data, '$.date') AS hearing_date,
       json_extract(data, '$.time') AS hearing_time,
       json_extract(data, '$.status') AS status,
       json_extract(data, '$.archived') AS archived, data
FROM records WHERE kind = 'hearings';

CREATE VIEW IF NOT EXISTS invoices AS
SELECT id, json_extract(data, '$.number') AS invoice_number,
       json_extract(data, '$.clientId') AS client_id,
       json_extract(data, '$.caseId') AS case_id,
       json_extract(data, '$.amount') AS amount,
       json_extract(data, '$.date') AS issue_date,
       json_extract(data, '$.due') AS due_date,
       json_extract(data, '$.archived') AS archived, data
FROM records WHERE kind = 'invoices';

CREATE VIEW IF NOT EXISTS payments AS
SELECT id, json_extract(data, '$.invoiceId') AS invoice_id,
       json_extract(data, '$.amount') AS amount,
       json_extract(data, '$.date') AS payment_date,
       json_extract(data, '$.archived') AS archived, data
FROM records WHERE kind = 'payments';

CREATE VIEW IF NOT EXISTS invoice_balances AS
SELECT i.id, i.invoice_number, i.client_id, i.amount,
       COALESCE(ROUND(SUM(p.amount), 2), 0) AS paid,
       ROUND(i.amount - COALESCE(SUM(p.amount), 0), 2) AS balance
FROM invoices i
LEFT JOIN payments p ON p.invoice_id = i.id AND p.archived = 0
WHERE i.archived = 0
GROUP BY i.id;
