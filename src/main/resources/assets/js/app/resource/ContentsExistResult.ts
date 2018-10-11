export class ContentsExistResult {

    private contentsExistMap: Object = {};

    constructor(json: api.content.json.ContentsExistJson) {
        json.contentsExistJson.forEach(item => {
            this.contentsExistMap[item.contentId] = item.exists;
        });
    }

    getContentsExistMap(): Object {
        return this.contentsExistMap;
    }
}
