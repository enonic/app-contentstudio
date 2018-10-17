import {DescriptorBasedComponent, DescriptorBasedComponentBuilder} from './DescriptorBasedComponent';

/*
Proxy classes to prevent cyclic dependencies
 */

export class LayoutBasedComponent
    extends DescriptorBasedComponent {}

export class LayoutBasedComponentBuilder<DESCRIPTOR_BASED_COMPONENT extends DescriptorBasedComponent>
    extends DescriptorBasedComponentBuilder<DESCRIPTOR_BASED_COMPONENT> {}
