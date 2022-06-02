import {ListBox} from '@enonic/lib-admin-ui/ui/selector/list/ListBox';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';

export class TextListBox extends ListBox<string> {

    protected createItemView(item: string, _readOnly: boolean): DivEl {
        const result: DivEl = new DivEl();
        result.setHtml(item);
        return result;
    }

    protected getItemId(item: string): string {
        return item;
    }
}
