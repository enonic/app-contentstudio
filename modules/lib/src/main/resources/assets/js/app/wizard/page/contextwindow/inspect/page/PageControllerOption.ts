import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {Equitable} from 'lib-admin-ui/Equitable';
import {TemplateOrControllerOption} from './TemplateOrControllerOption';
import {PageDescriptor} from 'lib-admin-ui/content/page/PageDescriptor';

export class PageControllerOption
    extends TemplateOrControllerOption<PageDescriptor> {

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, PageControllerOption)) {
            return false;
        }

        let other = <PageControllerOption>o;

        if (this.isAuto() && other.isAuto()) {
            return true;
        }

        return ObjectHelper.equals(this.getData(), other.getData());
    }
}
