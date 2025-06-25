import type {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import type {PublishStatus} from '../../../../app/publish/PublishStatus';
import type {WorkflowStateStatus} from '../../../../app/wizard/WorkflowStateManager';
import type {TreeState, TreeNode, FlatNode} from '../../lib/tree-store';

//
// * Shared Types
//

/** Loading state for tree operations */
export type LoadingStateValue = 'loading' | 'ok';

/**
 * Lightweight data stored in tree nodes.
 * Full content data is looked up from $contentCache using the id.
 */
export type ContentTreeNodeData = {
    /** Content ID - used to look up full data from content cache */
    id: string;
    /** Display name for quick rendering */
    displayName: string;
    /** Content name (path segment) */
    name: string;
    /** Publish status for visual indicators */
    publishStatus: PublishStatus;
    /** Workflow status */
    workflowStatus: WorkflowStateStatus | null;
    /** Content type name */
    contentType: ContentTypeName;
    /** Icon URL */
    iconUrl: string | null;
};

//
// * Type Aliases
//

export type ContentTreeState = TreeState<ContentTreeNodeData>;
export type ContentTreeNode = TreeNode<ContentTreeNodeData>;
export type ContentFlatNode = FlatNode<ContentTreeNodeData>;
