import {ContentsExistByPathJson} from './json/ContentsExistByPathJson';

export class ContentsExistByPathResult {

    private contentsExistByPathMap: object = {};

    constructor(json: ContentsExistByPathJson) {
        json.contentsExistJson.forEach(item => {
            this.contentsExistByPathMap[item.contentPath] = item.exists;
        });
    }

    getContentsExistMap(): object {
        return this.contentsExistByPathMap;
    }
}
