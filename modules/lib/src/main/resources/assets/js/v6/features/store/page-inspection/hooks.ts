import {useStore} from '@nanostores/preact';
import type {PageTemplate} from '../../../../app/content/PageTemplate';
import type {Descriptor} from '../../../../app/page/Descriptor';
import {$isPageInspectionLoading, $pageConfigDescriptor, $pageControllerOptions, $pageTemplateOptions} from './store';

//
// * Hooks
//

export function usePageTemplateOptions(): PageTemplate[] {
    return useStore($pageTemplateOptions);
}

export function usePageControllerOptions(): Descriptor[] {
    return useStore($pageControllerOptions);
}

export function usePageConfigDescriptor(): Descriptor | null {
    return useStore($pageConfigDescriptor);
}

export function useIsPageInspectionLoading(): boolean {
    return useStore($isPageInspectionLoading);
}
