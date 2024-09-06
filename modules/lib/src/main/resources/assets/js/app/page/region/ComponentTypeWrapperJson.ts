import {ImageComponentJson} from './ImageComponentJson';
import {TextComponentJson} from './TextComponentJson';
import {LayoutComponentJson} from './LayoutComponentJson';
import {FragmentComponentJson} from './FragmentComponentJson';
import {DescriptorBasedComponentJson} from './DescriptorBasedComponentJson';

export interface ComponentTypeWrapperJson {

    ImageComponent?: ImageComponentJson;

    PartComponent?: DescriptorBasedComponentJson;

    TextComponent?: TextComponentJson;

    LayoutComponent?: LayoutComponentJson;

    FragmentComponent?: FragmentComponentJson;
}
