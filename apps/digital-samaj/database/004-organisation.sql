-- Explicit one-to-one ownership. Existing communities require a reviewed mapping.
CREATE TABLE IF NOT EXISTS samaj_organisation_ownership (
 samajId TEXT PRIMARY KEY REFERENCES samaj_communities(id),
 organisationId TEXT NOT NULL UNIQUE REFERENCES platform_organisations(id)
);
