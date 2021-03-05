import {ContentsExistJson} from './json/ContentsExistJson';

export class ContentsExistResult {

    private contentsExistMap: Object = {};

    constructor(json: ContentsExistJson) {
        json.contentsExistJson.forEach(item => {
            this.contentsExistMap[item.contentId] = item.exists;
        });
    }

    getContentsExistMap(): Object {
        return this.contentsExistMap;
    }
}
