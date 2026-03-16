import type {ContentId} from '../../../../app/content/ContentId';

export type SortElementId = 'modified' | 'created' | 'displayName' | 'publish' | 'manual';

export type SortDirection = 'ASC' | 'DESC';

export type SortOrderOptionId =
    | 'modified:ASC'
    | 'modified:DESC'
    | 'created:ASC'
    | 'created:DESC'
    | 'displayName:ASC'
    | 'displayName:DESC'
    | 'publish:ASC'
    | 'publish:DESC'
    | 'manual';

export type SortOrderOption = {
    element: SortElementId;
    direction: SortDirection;
};

export type SortManualMovement = {
    contentId: ContentId;
    moveBefore?: ContentId;
};
