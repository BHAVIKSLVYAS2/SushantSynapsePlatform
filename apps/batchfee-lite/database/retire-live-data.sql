-- One-time production cleanup. Run only after the old APIs are retired.
DELETE FROM batchfee_organisation_events;
DELETE FROM batchfee_organisation_workspaces;
DELETE FROM batchfee_legacy_ownership;
DELETE FROM batchfee_events;
DELETE FROM batchfee_staff;
DELETE FROM batchfee_workspace;
DELETE FROM platform_app_assignments WHERE appId='batchfee-lite';
DELETE FROM platform_app_licences WHERE appId='batchfee-lite';
DELETE FROM app_access WHERE appId='batchfee-lite';
