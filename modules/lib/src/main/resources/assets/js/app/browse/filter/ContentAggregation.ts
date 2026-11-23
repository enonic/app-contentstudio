export enum ContentAggregation {
    CONTENT_TYPE = 'contentTypes',
    WORKFLOW = 'workflow',
    LAST_MODIFIED = 'lastModified',
    MODIFIED_BY = 'modifier',
    OWNER = 'owner',
    LANGUAGE = 'lang',
}

// Bucket of the Workflow section for published content with pending changes.
// Not a workflow state
export const MODIFIED_BUCKET_KEY = 'modified';
