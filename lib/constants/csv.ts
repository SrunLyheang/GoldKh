// Hard ceiling on one CSV import — enforced server-side by
// /api/transactions/bulk and mirrored in the import dialog's preview so
// the user sees the limit before submitting.
export const MAX_BULK_ROWS = 200;
