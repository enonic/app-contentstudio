import {useStore} from '@nanostores/preact';
import type {ReactElement} from 'react';
import {DescriptorBasedComponent} from '../../../../../../../../app/page/region/DescriptorBasedComponent';
import {FormRenderer} from '../../../../../../shared/form/FormRenderer';
import {$contentContext, $inspectedItem, $pageEditorLifecycle} from '../../../../../../store/page-editor';
import {$componentConfigDescriptor} from '../../../../../../store/component-inspection.store';
import {useInspectFormTracking} from '../useInspectFormTracking';
import {ComponentDescriptorSelector} from './ComponentDescriptorSelector';

type ComponentInspectionPanelProps = {
    componentType: 'part' | 'layout';
};

const COMPONENT_INSPECTION_PANEL_NAME = 'ComponentInspectionPanel';

export const ComponentInspectionPanel = ({componentType}: ComponentInspectionPanelProps): ReactElement | null => {
    const item = useStore($inspectedItem);
    const ctx = useStore($contentContext);
    const lifecycle = useStore($pageEditorLifecycle);
    const descriptor = useStore($componentConfigDescriptor);

    const isDescriptorComponent = item instanceof DescriptorBasedComponent;
    const hasDescriptor = isDescriptorComponent && item.hasDescriptor();
    const configForm = descriptor?.getConfig() ?? null;
    const configRoot = hasDescriptor ? (item.getConfig()?.getRoot() ?? null) : null;

    useInspectFormTracking(configForm, configRoot);

    if (!isDescriptorComponent) return null;

    return (
        <div data-component={COMPONENT_INSPECTION_PANEL_NAME} className="flex flex-col gap-5">
            <div className="flex flex-col -mx-5 p-5 bg-surface-primary gap-5">
                <ComponentDescriptorSelector componentType={componentType} />
            </div>

            {hasDescriptor && configForm && configRoot && (
                <FormRenderer
                    form={configForm}
                    propertySet={configRoot}
                    enabled={!lifecycle.isPageLocked}
                    applicationKey={ctx?.applicationKey ?? undefined}
                />
            )}
        </div>
    );
};

ComponentInspectionPanel.displayName = COMPONENT_INSPECTION_PANEL_NAME;
