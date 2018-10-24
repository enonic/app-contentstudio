import {PageTemplate} from '../../../../../content/PageTemplate';
import {PageTemplateDisplayName} from '../../../../../page/PageMode';

export class PageTemplateOption implements api.Equitable {

    private template: PageTemplate;

    constructor(template?: PageTemplate) {
        this.template = template;
    }

    getPageTemplate(): PageTemplate {
        return this.template;
    }

    isCustom(): boolean {
        return this.template && this.template.getDisplayName() === PageTemplateDisplayName[PageTemplateDisplayName.Custom];
    }

    isAuto(): boolean {
        return !this.template;
    }

    equals(o: api.Equitable): boolean {

        if (!api.ObjectHelper.iFrameSafeInstanceOf(o, PageTemplateOption)) {
            return false;
        }

        let other = <PageTemplateOption>o;

        if (this.isAuto() && other.isAuto()) {
            return true;
        }

        return api.ObjectHelper.equals(this.template, other.getPageTemplate());
    }
}
