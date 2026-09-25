# Test data only

Synthetic child names, users and assessments are created inside the in-memory PostgreSQL test in `scripts/test-db.mjs`. They are destroyed when the test ends. They are never included in the real catalogue seed or loaded by the application. No automatic demo fallback exists.
