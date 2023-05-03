import {FormView} from '@enonic/lib-admin-ui/form/FormView';

export class SiteConfiguratorFormView extends FormView {

    getTotalFormItems(): number {
        return this.formItemViews.length;
    }
}
