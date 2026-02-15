import {type ContentsExistJson} from './json/ContentsExistJson';

export class ContentsExistResult {

    private contentsExistMap: Map<string, boolean> = new Map<string, boolean>();

    constructor(json: ContentsExistJson) {
        json.contentsExistJson.forEach(item => {
            this.contentsExistMap.set(item.contentId, item.exists);
        });
    }

    getContentsExistMap(): Map<string, boolean> {
        return this.contentsExistMap;
    }
}
