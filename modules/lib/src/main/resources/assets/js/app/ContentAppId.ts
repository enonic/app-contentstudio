import {AppId} from './AppId';

export class ContentAppId extends AppId {

    static ID: string = 'main';

    constructor() {
        super(ContentAppId.ID);
    }
}
