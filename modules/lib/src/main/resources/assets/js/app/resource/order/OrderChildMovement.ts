import {type ReorderChildContentJson} from '../json/ReorderChildContentJson';
import {type ContentId} from '../../content/ContentId';

export class OrderChildMovement {

    private contentId: ContentId;

    private moveBefore: ContentId;

    constructor(id: ContentId, moveBeforeId: ContentId) {
        this.contentId = id;
        this.moveBefore = moveBeforeId;
    }

    getContentId(): ContentId {
        return this.contentId;
    }

    getMoveBefore(): ContentId {
        return this.moveBefore;
    }

    toJson(): ReorderChildContentJson {
        return {
            contentId: this.contentId.toString(),
            moveBefore: this.moveBefore ? this.moveBefore.toString() : ''
        };
    }

}
