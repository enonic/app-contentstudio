import { type ComponentJson } from './ComponentJson';
import type { PropertyTreeJson } from '@enonic/ui-types';

export interface ConfigBasedComponentJson extends ComponentJson {
    config: PropertyTreeJson;
}
