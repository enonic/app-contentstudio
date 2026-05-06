import type {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import {Input} from '@enonic/lib-admin-ui/form/Input';
import type {FormItem} from '@enonic/lib-admin-ui/form/FormItem';
import {RawValueProvider, ValidationVisibilityProvider} from '@enonic/lib-admin-ui/form2';
import {useStore} from '@nanostores/preact';
import {type ReactElement, useMemo} from 'react';
import {LegacyElement} from '../../../shared/LegacyElement';
import {FormItemRenderer, FormRenderProvider} from '../../../shared/form';
import {ImageUploaderDescriptor} from '../../../shared/form/input-types/image-uploader/ImageUploaderDescriptor';
import {$contentType, $wizardDraftData} from '../../../store/wizardContent.store';
import {$validationVisibility, getContentRawValueMap} from '../../../store/wizardValidation.store';
import {instanceOf} from '../../../utils/object/instanceOf';
import {WIDGET_AUTO_DESCRIPTOR, $activeWidget} from '../../../store/liveViewWidgets.store';
import {cn} from '@enonic/ui';

const COMPONENT_NAME = 'LiveViewImageEditor';

// Surfaces the form's ImageUploader input inside the preview area so the user can
// crop/focus the image alongside the preview instead of in the left form panel.
// Mounted into `FrameContainer` and active only when the auto widget is selected on
// an image content type; `ContentForm` excludes the same input so it is not rendered
// twice.
const LiveViewImageEditor = (): ReactElement | null => {
    const active = useStore($activeWidget);
    const contentType = useStore($contentType);
    const draftData = useStore($wizardDraftData);
    const visibility = useStore($validationVisibility);

    const rawValueMap = useMemo(() => getContentRawValueMap(), []);

    const imageUploaderItem = useMemo<FormItem | undefined>(() => {
        if (contentType == null) return undefined;
        return contentType
            .getForm()
            .getFormItems()
            .find(
                (item) =>
                    instanceOf(item, Input) && item.getInputType().getName().toLowerCase() === ImageUploaderDescriptor.name.toLowerCase()
            );
    }, [contentType]);

    if (active?.getDescriptorKey().getName() !== WIDGET_AUTO_DESCRIPTOR) return null;
    if (contentType == null || draftData == null) return null;
    if (!contentType.getContentTypeName().isImage()) return null;
    if (imageUploaderItem == null) return null;

    const applicationKey = contentType.getContentTypeName().getApplicationKey();
    const propertySet: PropertySet = draftData.getRoot();

    return (
        <ValidationVisibilityProvider visibility={visibility}>
            <RawValueProvider map={rawValueMap}>
                <FormRenderProvider enabled={true} applicationKey={applicationKey}>
                    <div
                        data-component={COMPONENT_NAME}
                        className={cn(
                            'flex flex-col flex-1 min-h-0 p-5',
                            // Reuse the standard ImageUploader rendering but adapt it to the
                            // preview area: hide the input label and let the input field grow
                            // to fill the available height.
                            "**:data-[component='InputLabel']:hidden **:data-[component='InputField']:flex-1 **:data-[component='InputField']:min-h-0"
                        )}
                    >
                        <FormItemRenderer formItem={imageUploaderItem} propertySet={propertySet} />
                    </div>
                </FormRenderProvider>
            </RawValueProvider>
        </ValidationVisibilityProvider>
    );
};

LiveViewImageEditor.displayName = COMPONENT_NAME;

export class LiveViewImageEditorElement extends LegacyElement<typeof LiveViewImageEditor, Record<string, never>> {
    constructor() {
        super({}, LiveViewImageEditor);
    }
}
