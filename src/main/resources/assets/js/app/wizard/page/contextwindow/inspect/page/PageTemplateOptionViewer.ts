import {PageTemplateOption} from './PageTemplateOption';
import {PageTemplate} from '../../../../../content/PageTemplate';
import {PageTemplateDisplayName} from '../../../../../page/PageMode';
import i18n = api.util.i18n;

export class PageTemplateOptionViewer extends api.ui.NamesAndIconViewer<PageTemplateOption> {

    private defaultPageTemplate: PageTemplate;

    constructor(defaultPageTemplate: PageTemplate) {
        super();

        this.defaultPageTemplate = defaultPageTemplate;
    }

    getCloneArgs(): any[] {
        return [this.defaultPageTemplate];
    }

    resolveDisplayName(object: PageTemplateOption): string {
        let pageTemplateDisplayName = PageTemplateDisplayName;

        return !!object.getData() ?
               (object.isCustom() ? pageTemplateDisplayName[pageTemplateDisplayName.Custom] : object.getData().getDisplayName())
                                  : pageTemplateDisplayName[pageTemplateDisplayName.Automatic];
    }

    resolveSubName(object: PageTemplateOption, relativePath: boolean = false): string {
        if (!object.isAuto()) {
            if (object.isCustom()) {
                return i18n('field.page.template.help');
            }
            return object.getData().getPath().toString();
        }

        if (this.defaultPageTemplate) {
            return '(' + this.defaultPageTemplate.getDisplayName().toString() + ')';
        }

        return i18n('field.page.template.noDefault');
    }

    resolveIconClass(object: PageTemplateOption): string {
        const iconClass = object.isAuto() ? 'icon-wand' : (object.isCustom() ? 'icon-cog' : 'icon-page-template');

        return iconClass + ' icon-large';
    }

    getPreferredHeight(): number {
        return 50;
    }
}
