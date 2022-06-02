import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {Equitable} from '@enonic/lib-admin-ui/Equitable';
import {TemplateOrControllerOption} from './TemplateOrControllerOption';
import {Descriptor} from '../../../../../page/Descriptor';

export class PageControllerOption
    extends TemplateOrControllerOption<Descriptor> {

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
