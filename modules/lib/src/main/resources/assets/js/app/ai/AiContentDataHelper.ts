import {XDataWizardStepForm} from '../wizard/XDataWizardStepForm';
import {PropertyPath} from '@enonic/lib-admin-ui/data/PropertyPath';
import {Property} from '@enonic/lib-admin-ui/data/Property';
import {Value} from '@enonic/lib-admin-ui/data/Value';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {PageState} from '../wizard/page/PageState';
import {PageItem} from '../page/region/PageItem';
import {ComponentPath} from '../page/region/ComponentPath';
import {DescriptorBasedComponent} from '../page/region/DescriptorBasedComponent';
import {TextComponent} from '../page/region/TextComponent';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {ContentWizardHeader} from '../wizard/ContentWizardHeader';

export class AiContentDataHelper {

    public static DATA_PREFIX = '__data__';

    public static XDATA_PREFIX = '__xdata__';

    public static PAGE_PREFIX = '__page__';

    public static TOPIC = '__topic__';

    private static CONFIG_PREFIX = '__config__';

    private data: PropertyTree;

    private contentHeader: ContentWizardHeader;

    setDataTree(dataTree: PropertyTree): void {
        this.data = dataTree;
    }

    setContentHeader(contentHeader: ContentWizardHeader): void {
        this.contentHeader = contentHeader;
    }

    setValue(path: string, text: string): void {
        if (this.isTopicPath(path)) {
            if (!StringHelper.isBlank(text)) {
                this.contentHeader?.setName('', true); // resetting name to trigger name generation after updating displayName
            }
            this.contentHeader?.setDisplayName(text);
        } else if (this.isXDataPath(path)) {
            this.handleXDataEvent(path, text);
        } else if (this.isPagePath(path)) {
            this.handlePageEvent(path, text);
        } else if (this.isDataPath(path)) {
            this.handleDataEvent(path, text);
        }
    }

    transformPathOnDemand(path: string): string {
        if (this.isXDataPath(path)) {
            return this.transformXDataPath(path);
        }

        return path;
    }

    private isXDataPath(path: string): boolean {
        return path.startsWith(AiContentDataHelper.XDATA_PREFIX);
    }

    private isPagePath(path: string): boolean {
        return path.startsWith(AiContentDataHelper.PAGE_PREFIX);
    }

    private isDataPath(path: string): boolean {
        return path.startsWith(AiContentDataHelper.DATA_PREFIX);
    }

    isPageComponentPath(path: string): boolean {
        return this.isPagePath(path) && path.indexOf(AiContentDataHelper.CONFIG_PREFIX) < 0;
    }

    isTopicPath(path: string): boolean {
        return path.indexOf(AiContentDataHelper.TOPIC) > -1;
    }

    private getXData(path: string): { xDataStepForm: XDataWizardStepForm, xDataPath: PropertyPath } | undefined {
        const pathParts = path.split('/');
        const appName = pathParts[1];
        const xDataName = pathParts[2];
        const key = `${appName.replace(/[/-]/g, '.')}:${xDataName}`;
        const xDataStepForm = XDataWizardStepForm.getXDataWizardStepForm(key);

        return xDataStepForm ? {xDataStepForm, xDataPath: PropertyPath.fromString(`.${pathParts.slice(3).join('.')}`)} : undefined;
    }

    private handleXDataEvent(path: string, text: string): void {
        const xData = this.getXData(path);
        const prop = xData?.xDataStepForm.getData().getRoot().getPropertyByPath(xData.xDataPath);
        this.updateProperty(prop, text);
    }

    private handleDataEvent(path: string, text: string): void {
        const pathNoPrefix = path.replace(AiContentDataHelper.DATA_PREFIX, '');
        const propPath = PropertyPath.fromString(this.replaceSlashesWithDots(pathNoPrefix));
        const prop = this.data.getRoot().getPropertyByPath(propPath);
        this.updateProperty(prop, text);
    }

    private updateProperty(property: Property | undefined, value: string): void {
        property?.setValue(new Value(value, property.getType()));
    }

    replaceSlashesWithDots(path: string): string {
        return path.replace(/\//g, '.');
    }

    private handlePageEvent(path: string, text: string): void {
        if (path.indexOf(AiContentDataHelper.CONFIG_PREFIX) > -1) {
            this.handleComponentConfigEvent(path, text);
        } else {
            this.handleComponentEvent(path, text);
        }
    }

    private handleComponentConfigEvent(path: string, text: string): void {
        const parts = path.replace(AiContentDataHelper.PAGE_PREFIX, '').split(`/${AiContentDataHelper.CONFIG_PREFIX}`);
        const configComponentPath = parts[0];
        const dataPath = parts[1];
        const propPath = PropertyPath.fromString(this.replaceSlashesWithDots(dataPath));

        if (StringHelper.isBlank(configComponentPath)) {
            const prop = PageState.getState()?.getConfig().getRoot().getPropertyByPath(propPath);
            prop?.setValue(new Value(text, prop.getType()));
        } else {
            const item: PageItem = PageState.getState()?.getComponentByPath(ComponentPath.fromString(configComponentPath));

            if (item instanceof DescriptorBasedComponent) {
                const prop = item.getConfig().getRoot().getPropertyByPath(propPath);
                prop?.setValue(new Value(text, prop.getType()));
            }
        }
    }

    private handleComponentEvent(path: string, text: string): void {
        const pathNoPrefix = path.replace(AiContentDataHelper.PAGE_PREFIX, '');
        const componentPath = ComponentPath.fromString(pathNoPrefix);
        const item: PageItem = PageState.getState().getComponentByPath(componentPath);

        if (item instanceof TextComponent) {
            item.setText(text);
        }
    }

    private transformXDataPath(path: string): string { // take path parts and make a right xdata group name
        const pathParts = path.split('/');
        const appName = pathParts[1];
        const xDataName = pathParts[2];
        const key = `${appName.replace(/[/-]/g, '.')}:${xDataName}`;

        return `__${key}__/${pathParts.slice(3).join('/')}`;
    }
}
