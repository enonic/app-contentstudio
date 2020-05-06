import {i18n} from 'lib-admin-ui/util/Messages';
import {StyleHelper} from 'lib-admin-ui/StyleHelper';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {PageTemplateOption} from './PageTemplateOption';
import {PageTemplate} from '../../../../../content/PageTemplate';
import {PageControllerOption} from './PageControllerOption';
import {NamesAndIconViewer} from 'lib-admin-ui/ui/NamesAndIconViewer';

export type PageTemplateAndControllerOption = PageTemplateOption | PageControllerOption;

export class PageTemplateAndSelectorViewer
    extends NamesAndIconViewer<PageTemplateAndControllerOption> {

    private defaultPageTemplate: PageTemplate;

    constructor() {
        super();
    }

    setDefaultPageTemplate(defaultPageTemplate: PageTemplate) {
        this.defaultPageTemplate = defaultPageTemplate;
    }

    getCloneArgs(): any[] {
        return [this.defaultPageTemplate];
    }

    resolveDisplayName(object: PageTemplateAndControllerOption): string {
        return object.isAuto() ? i18n('widget.pagetemplate.automatic') : object.getData().getDisplayName();
    }

    resolveSubName(object: PageTemplateAndControllerOption, relativePath: boolean = false): string {
        if (!object.isAuto()) {
            if (ObjectHelper.iFrameSafeInstanceOf(object, PageTemplateOption)) {
                return (<PageTemplateOption>object).getData().getPath().toString();
            } else {
                return (<PageControllerOption>object).getData().getDescription() || `<${i18n('text.noDescription')}>`;
            }
        }

        if (this.defaultPageTemplate) {
            return '(' + this.defaultPageTemplate.getDisplayName().toString() + ')';
        }

        return i18n('field.page.template.noDefault');
    }

    resolveIconClass(object: PageTemplateAndControllerOption): string {
        let iconClass = '';

        if (ObjectHelper.iFrameSafeInstanceOf(object, PageTemplateOption)) {
            iconClass = object.getData() ? ((<PageTemplateOption>object).isCustom() ? 'icon-cog' : 'icon-page-template') : 'icon-wand';
            return iconClass + ' icon-large';
        }

        iconClass = (<PageControllerOption>object).getData().getIconCls();
        return (iconClass ? StyleHelper.getCommonIconCls(iconClass) + ' ' : '') + 'icon-large';
    }

    getPreferredHeight(): number {
        return 50;
    }
}
