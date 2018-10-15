import {ImageComponentJson} from './ImageComponentJson';
import {PartComponentJson} from './PartComponentJson';
import {TextComponentJson} from './TextComponentJson';
import {LayoutComponentJson} from './LayoutComponentJson';
import {FragmentComponentJson} from './FragmentComponentJson';

export interface ComponentTypeWrapperJson {

    ImageComponent?: ImageComponentJson;

    PartComponent?: PartComponentJson;

    TextComponent?: TextComponentJson;

    LayoutComponent?: LayoutComponentJson;

    FragmentComponent?: FragmentComponentJson;
}
