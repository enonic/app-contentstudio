import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {useStore} from '@nanostores/preact';
import {PenLine} from 'lucide-react';
import type {ReactElement} from 'react';
import {TextComponent} from '../../../../../../../../app/page/region/TextComponent';
import {ItemLabel} from '../../../../../../shared/ItemLabel';
import {$inspectedItem, $pageEditorLifecycle} from '../../../../../../store/page-editor';
import {$pageVersion} from '../../../../../../store/page-editor/store';
import {TextEditor} from './TextEditor';

function getDisplayName(component: TextComponent): string {
    const raw = component.getText();
    if (raw) {
        const stripped = StringHelper.htmlToString(raw.trim()).trim();
        if (stripped) {
            return stripped;
        }
    }
    return component.getName().toString();
}

const TEXT_INSPECTION_PANEL_NAME = 'TextInspectionPanel';

export const TextInspectionPanel = (): ReactElement | null => {
    const item = useStore($inspectedItem);
    useStore($pageVersion);
    const lifecycle = useStore($pageEditorLifecycle);

    if (!(item instanceof TextComponent)) return null;

    const displayName = getDisplayName(item);
    const path = item.getPath();

    return (
        <div data-component={TEXT_INSPECTION_PANEL_NAME} className="flex flex-col gap-5">
            <ItemLabel
                className="mt-8"
                icon={<PenLine />}
                primary={displayName}
                secondary={path?.isRoot() ? undefined : path?.toString()}
            />

            <TextEditor
                key={path?.toString()}
                textComponent={item}
                disabled={lifecycle.isPageLocked}
            />
        </div>
    );
};

TextInspectionPanel.displayName = TEXT_INSPECTION_PANEL_NAME;
