import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {PropertyPath} from '@enonic/lib-admin-ui/data/PropertyPath';
import type {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {Value} from '@enonic/lib-admin-ui/data/Value';
import {CompareStatusChecker} from '../../../../app/content/CompareStatus';
import {ComponentPath} from '../../../../app/page/region/ComponentPath';
import {DescriptorBasedComponent} from '../../../../app/page/region/DescriptorBasedComponent';
import type {PageItem} from '../../../../app/page/region/PageItem';
import {TextComponent} from '../../../../app/page/region/TextComponent';
import {PageState} from '../../../../app/wizard/page/PageState';
import {isBlank} from '../../utils/format/isBlank';
import {$aiCompareStatus, $aiContentHeader, $aiDataTree, $aiWizardBridge} from './ai.store';
import {AI_CONFIG_PREFIX, AI_DATA_PREFIX, AI_PAGE_PREFIX, AI_TOPIC, AI_XDATA_PREFIX} from './ai.types';

//
// * Path predicates
//

export function isTopicPath(path: string): boolean {
    return path.indexOf(AI_TOPIC) > -1;
}

export function isXDataPath(path: string): boolean {
    return path.startsWith(AI_XDATA_PREFIX);
}

export function isPagePath(path: string): boolean {
    return path.startsWith(AI_PAGE_PREFIX);
}

export function isDataPath(path: string): boolean {
    return path.startsWith(AI_DATA_PREFIX);
}

export function isPageComponentPath(path: string): boolean {
    return isPagePath(path) && path.indexOf(AI_CONFIG_PREFIX) < 0;
}

//
// * Path transforms
//

export function replaceSlashesWithDots(path: string): string {
    return path.replace(/\//g, '.');
}

export function transformPathOnDemand(path: string): string {
    return isXDataPath(path) ? transformXDataPath(path) : path;
}

function transformXDataPath(path: string): string {
    const parts = path.split('/');
    const appName = parts[1];
    const xDataName = parts[2];
    const key = `${appName.replace(/[/-]/g, '.')}:${xDataName}`;

    return `__${key}__/${parts.slice(3).join('/')}`;
}

//
// * Value writes
//

// Returns `false` when the path is recognized but its target field no longer
// exists (form changed since the translator read the payload). Callers use this
// to warn the user that a translated value could not be applied.
export function setAiValueAtPath(path: string, text: string): boolean {
    if (isTopicPath(path)) {
        return handleTopicEvent(text);
    }
    if (isXDataPath(path)) {
        return handleXDataEvent(path, text);
    }
    if (isPagePath(path)) {
        return handlePageEvent(path, text);
    }
    if (isDataPath(path)) {
        return handleDataEvent(path, text);
    }
    return false;
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

function handleXDataEvent(path: string, text: string): boolean {
    const target = getXDataTarget(path);
    if (!target) {
        return false;
    }

    const prop = target.tree.getRoot().getPropertyByPath(target.propPath);
    if (!prop) {
        return false;
    }

    prop.setValue(new Value(text, prop.getType()), true);
    return true;
}

function getXDataTarget(path: string): {tree: PropertyTree; propPath: PropertyPath} | undefined {
    const parts = path.split('/');
    const appName = parts[1];
    const xDataName = parts[2];
    const key = `${appName.replace(/[/-]/g, '.')}:${xDataName}`;

    const mixin = $aiWizardBridge.get()?.findMixinByKey(key);
    const tree = mixin?.getData();
    if (!tree) {
        return undefined;
    }

    return {tree, propPath: PropertyPath.fromString(`.${parts.slice(3).join('.')}`)};
}

function handleDataEvent(path: string, text: string): boolean {
    const data = $aiDataTree.get();
    if (!data) {
        return false;
    }

    const pathNoPrefix = path.replace(AI_DATA_PREFIX, '');
    const propPath = PropertyPath.fromString(replaceSlashesWithDots(pathNoPrefix));
    const prop = data.getRoot().getPropertyByPath(propPath);
    if (!prop) {
        return false;
    }

    prop.setValue(new Value(text, prop.getType()), true);
    return true;
}

function handlePageEvent(path: string, text: string): boolean {
    return path.indexOf(AI_CONFIG_PREFIX) > -1
        ? handleComponentConfigEvent(path, text)
        : handleComponentEvent(path, text);
}

function handleComponentConfigEvent(path: string, text: string): boolean {
    const parts = path.replace(AI_PAGE_PREFIX, '').split(`/${AI_CONFIG_PREFIX}`);
    const configComponentPath = parts[0];
    const dataPath = parts[1];
    const propPath = PropertyPath.fromString(replaceSlashesWithDots(dataPath));

    if (isBlank(configComponentPath)) {
        const prop = PageState.getState()?.getConfig().getRoot().getPropertyByPath(propPath);
        if (!prop) {
            return false;
        }
        prop.setValue(new Value(text, prop.getType()));
        return true;
    }

    const item: PageItem = PageState.getState()?.getComponentByPath(ComponentPath.fromString(configComponentPath));
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

function handleComponentEvent(path: string, text: string): boolean {
    const pathNoPrefix = path.replace(AI_PAGE_PREFIX, '');
    const componentPath = ComponentPath.fromString(pathNoPrefix);
    const item: PageItem = PageState.getState().getComponentByPath(componentPath);

    if (!(item instanceof TextComponent)) {
        return false;
    }

    item.setText(text);
    return true;
}
