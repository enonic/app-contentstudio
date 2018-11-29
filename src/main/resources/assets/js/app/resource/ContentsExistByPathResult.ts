import {ContentsExistByPathJson} from './json/ContentsExistByPathJson';

export class ContentsExistByPathResult {

    private contentsExistByPathMap: Object = {};

    constructor(json: ContentsExistByPathJson) {
        json.contentsExistJson.forEach(item => {
            this.contentsExistByPathMap[item.contentPath] = item.exists;
        });
    }

    getContentsExistMap(): Object {
        return this.contentsExistByPathMap;
    }
}
