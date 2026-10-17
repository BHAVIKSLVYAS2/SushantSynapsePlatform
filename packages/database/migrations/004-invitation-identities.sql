-- Only identities explicitly created for invitation onboarding may be activated
-- by an invitation. Existing disabled accounts are never eligible.
CREATE TABLE platform_pending_identities (
  userId TEXT PRIMARY KEY REFERENCES users(id),
  createdAt INTEGER NOT NULL,
  activatedAt INTEGER
);
