-- Additive boundary; no legacy community is assigned automatically.
CREATE TABLE IF NOT EXISTS samaj_organisation_ownership (
 samajId TEXT PRIMARY KEY REFERENCES samaj_communities(id),
 organisationId TEXT NOT NULL UNIQUE REFERENCES platform_organisations(id)
);
