-- Additive boundary only. Legacy ownership is mapped separately after inspection.
CREATE TABLE tournament_lite_ownership (
 eventId TEXT PRIMARY KEY REFERENCES tournament_lite_events(id),
 organisationId TEXT NOT NULL REFERENCES platform_organisations(id)
);
CREATE INDEX tournament_lite_ownership_organisation ON tournament_lite_ownership(organisationId);
