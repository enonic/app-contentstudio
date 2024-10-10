import {ListBox} from '@enonic/lib-admin-ui/ui/selector/list/ListBox';
import {PageTemplateAndControllerOption, PageTemplateAndSelectorViewer} from './PageTemplateAndSelectorViewer';

export class PageOptionsList extends ListBox<PageTemplateAndControllerOption> {

    constructor() {
        super('common-page-list-box');
    }

    protected createItemView(item: PageTemplateAndControllerOption, readOnly: boolean): PageTemplateAndSelectorViewer {
        const viewer = new PageTemplateAndSelectorViewer();
        viewer.setObject(item);
        return viewer;
    }

    protected getItemId(item: PageTemplateAndControllerOption): string {
        return item.getKey();
    }

}
