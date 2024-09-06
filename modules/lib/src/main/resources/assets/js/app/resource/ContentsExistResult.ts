import {ContentsExistJson} from './json/ContentsExistJson';

export class ContentsExistResult {

    private contentsExistMap: object = {};

    constructor(json: ContentsExistJson) {
        json.contentsExistJson.forEach(item => {
            this.contentsExistMap[item.contentId] = item.exists;
        });
    }

    getContentsExistMap(): object {
        return this.contentsExistMap;
    }
}
