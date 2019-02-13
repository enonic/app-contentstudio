import {PageTemplate} from '../../../../../content/PageTemplate';
import {PageTemplateDisplayName} from '../../../../../page/PageMode';
import {TemplateOrControllerOption} from './TemplateOrControllerOption';

export class PageTemplateOption
    extends TemplateOrControllerOption<PageTemplate> {

    isCustom(): boolean {
        return this.getData() && this.getData().getDisplayName() === PageTemplateDisplayName[PageTemplateDisplayName.Custom];
    }

    equals(o: api.Equitable): boolean {

        if (!api.ObjectHelper.iFrameSafeInstanceOf(o, PageTemplateOption)) {
            return false;
        }

        let other = <PageTemplateOption>o;

        if (this.isAuto() && other.isAuto()) {
            return true;
        }

        return api.ObjectHelper.equals(this.getData(), other.getData());
    }
}
