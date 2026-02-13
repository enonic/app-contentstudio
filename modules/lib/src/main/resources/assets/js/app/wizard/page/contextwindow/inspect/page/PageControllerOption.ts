import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {type Equitable} from '@enonic/lib-admin-ui/Equitable';
import {TemplateOrControllerOption} from './TemplateOrControllerOption';
import {type Descriptor} from '../../../../../page/Descriptor';

export class PageControllerOption
    extends TemplateOrControllerOption<Descriptor> {

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, PageControllerOption)) {
            return false;
        }

        const other = o as PageControllerOption;

        if (this.isAuto() && other.isAuto()) {
            return true;
        }

        return ObjectHelper.equals(this.getData(), other.getData());
    }
}
