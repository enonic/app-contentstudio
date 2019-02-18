import {TemplateOrControllerOption} from './TemplateOrControllerOption';
import PageDescriptor = api.content.page.PageDescriptor;

export class PageControllerOption
    extends TemplateOrControllerOption<PageDescriptor> {

    equals(o: api.Equitable): boolean {

        if (!api.ObjectHelper.iFrameSafeInstanceOf(o, PageControllerOption)) {
            return false;
        }

        let other = <PageControllerOption>o;

        if (this.isAuto() && other.isAuto()) {
            return true;
        }

        return api.ObjectHelper.equals(this.getData(), other.getData());
    }
}
