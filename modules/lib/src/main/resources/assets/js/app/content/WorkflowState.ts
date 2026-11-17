export enum WorkflowState {
    READY = 'ready', IN_PROGRESS = 'in_progress'
}

// Filter-only bucket key for published content with pending changes. Not a workflow state
export const MODIFIED_BUCKET_KEY = 'modified';
