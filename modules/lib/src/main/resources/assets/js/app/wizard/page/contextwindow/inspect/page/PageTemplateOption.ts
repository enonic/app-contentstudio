import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {type Equitable} from '@enonic/lib-admin-ui/Equitable';
import {type PageTemplate} from '../../../../../content/PageTemplate';
import {PageTemplateDisplayName} from '../../../../../page/PageMode';
import {TemplateOrControllerOption} from './TemplateOrControllerOption';

export class PageTemplateOption
    extends TemplateOrControllerOption<PageTemplate> {

    isCustom(): boolean {
        return this.getData() && this.getData().getDisplayName() === PageTemplateDisplayName[PageTemplateDisplayName.Custom];
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, PageTemplateOption)) {
            return false;
        }

        const other = o as PageTemplateOption;

        if (this.isAuto() && other.isAuto()) {
            return true;
        }

        return ObjectHelper.equals(this.getData(), other.getData());
    }
}
