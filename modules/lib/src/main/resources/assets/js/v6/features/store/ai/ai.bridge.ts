import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {PropertyPath} from '@enonic/lib-admin-ui/data/PropertyPath';
import {Value} from '@enonic/lib-admin-ui/data/Value';
import {CompareStatusChecker} from '../../../../app/content/CompareStatus';
import {ComponentPath} from '../../../../app/page/region/ComponentPath';
import {DescriptorBasedComponent} from '../../../../app/page/region/DescriptorBasedComponent';
import type {PageItem} from '../../../../app/page/region/PageItem';
import {TextComponent} from '../../../../app/page/region/TextComponent';
import {PageState} from '../../../../app/wizard/page/PageState';
import {isBlank} from '../../utils/format/isBlank';
import type {AiFieldPath} from './ai-protocol';
import {$aiCompareStatus, $aiContentHeader, $aiDataTree, $aiWizardBridge} from './ai.store';

//
// * Value writes
//

// Returns `false` when the path is recognized but its target field no longer
// exists (form changed since the plugin read the payload). Callers use this
// to warn the user that a translated value could not be applied.
export function setAiValueAtPath(path: AiFieldPath, text: string): boolean {
    switch (path.kind) {
        case 'topic':
            return handleTopicEvent(text);
        case 'data':
            return handleDataEvent(path.field, text);
        case 'mixin':
            return handleMixinEvent(path.mixin, path.field, text);
        case 'pageConfig':
            return handleComponentConfigEvent('', path.field, text);
        case 'componentText':
            return handleComponentEvent(path.component, text);
        case 'componentConfig':
            return handleComponentConfigEvent(path.component, path.field, text);
    }
}

function handleTopicEvent(text: string): boolean {
    // The v6 DisplayNameInput renders from the wizard draft display-name atom. The
    // bridge is the only way to reach it without re-introducing a wizardContent →
    // ai → wizardContent module cycle. The legacy header is kept in sync so any
    // remaining legacy consumers (name auto-generation) keep working.
    const bridge = $aiWizardBridge.get();
    if (!bridge) {
        return false;
    }

    const currentDisplayName = bridge.getCurrentDisplayName() ?? '';
    bridge.applyDisplayName(text);

    const header = $aiContentHeader.get();
    if (header) {
        if (isAllowedToChangeName(text, currentDisplayName)) {
            // Reset name to trigger name generation after updating displayName.
            header.setName('', true);
        }
        header.setDisplayName(text);
    }

    return true;
}

function isAllowedToChangeName(text: string, currentDisplayName: string): boolean {
    const status = $aiCompareStatus.get();
    if (status == null) {
        return false;
    }

    return !isBlank(text)
        && !ObjectHelper.stringEquals(text?.trim(), currentDisplayName)
        && CompareStatusChecker.isNew(status);
}

function handleDataEvent(field: string, text: string): boolean {
    const data = $aiDataTree.get();
    if (!data) {
        return false;
    }

    const prop = data.getRoot().getPropertyByPath(PropertyPath.fromString(`.${field}`));
    if (!prop) {
        return false;
    }

    prop.setValue(new Value(text, prop.getType()), true);
    return true;
}

function handleMixinEvent(mixin: string, field: string, text: string): boolean {
    // `mixin` is the resolved key (`app.name:MixinName`) addressed directly.
    const tree = $aiWizardBridge.get()?.findMixinByKey(mixin)?.getData();
    if (!tree) {
        return false;
    }

    const prop = tree.getRoot().getPropertyByPath(PropertyPath.fromString(`.${field}`));
    if (!prop) {
        return false;
    }

    prop.setValue(new Value(text, prop.getType()), true);
    return true;
}

function handleComponentEvent(component: string, text: string): boolean {
    const item: PageItem = PageState.getState().getComponentByPath(ComponentPath.fromString(component));
    if (!(item instanceof TextComponent)) {
        return false;
    }

    item.setText(text);
    return true;
}

// An empty `component` targets the page config root; otherwise it targets the
// config of the descriptor-based component at that path.
function handleComponentConfigEvent(component: string, field: string, text: string): boolean {
    const propPath = PropertyPath.fromString(`.${field}`);

    if (isBlank(component)) {
        const prop = PageState.getState()?.getConfig().getRoot().getPropertyByPath(propPath);
        if (!prop) {
            return false;
        }
        prop.setValue(new Value(text, prop.getType()));
        return true;
    }

    const item: PageItem = PageState.getState()?.getComponentByPath(ComponentPath.fromString(component));
    if (!(item instanceof DescriptorBasedComponent)) {
        return false;
    }

    const prop = item.getConfig().getRoot().getPropertyByPath(propPath);
    if (!prop) {
        return false;
    }
    prop.setValue(new Value(text, prop.getType()));
    return true;
}
