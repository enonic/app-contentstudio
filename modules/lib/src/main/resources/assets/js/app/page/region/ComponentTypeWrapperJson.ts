import {type ImageComponentJson} from './ImageComponentJson';
import {type TextComponentJson} from './TextComponentJson';
import {type LayoutComponentJson} from './LayoutComponentJson';
import {type FragmentComponentJson} from './FragmentComponentJson';
import {type DescriptorBasedComponentJson} from './DescriptorBasedComponentJson';

export interface ComponentTypeWrapperJson {

    ImageComponent?: ImageComponentJson;

    PartComponent?: DescriptorBasedComponentJson;

    TextComponent?: TextComponentJson;

    LayoutComponent?: LayoutComponentJson;

    FragmentComponent?: FragmentComponentJson;
}
