import {ListBox} from '@enonic/lib-admin-ui/ui/selector/list/ListBox';
import {type Locale} from '@enonic/lib-admin-ui/locale/Locale';
import {LocaleViewer} from './LocaleViewer';

export class LocaleListBox extends ListBox<Locale> {

    constructor() {
        super('locale-list-box');
    }

    protected createItemView(item: Locale, readOnly: boolean): LocaleViewer {
        const viewer = new LocaleViewer();

        viewer.setObject(item);

        return viewer;
    }

    protected getItemId(item: Locale): string {
        return item.getId();
    }

}
