import {AppId} from '../AppId';

export class SettingAppId extends AppId {

    static ID: string = 'settings';

    constructor() {
        super(SettingAppId.ID);
    }

}
