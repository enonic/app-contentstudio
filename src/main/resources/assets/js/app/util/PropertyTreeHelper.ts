import PropertyTree = api.data.PropertyTree;

export class PropertyTreeHelper {

    static trimPropertyTree(data: PropertyTree): PropertyTree {
        const copy: PropertyTree = data.copy();
        copy.getRoot().removeEmptyValues();

        return copy;
    }

    static propertyTreesEqual(config: PropertyTree, otherConfig: PropertyTree, ignoreEmptyValues: boolean = true): boolean {
        if (ignoreEmptyValues && (!config || config.isEmpty()) && (!otherConfig || otherConfig.isEmpty())) {
            return true;
        }

        const data: PropertyTree = !!config && ignoreEmptyValues ? PropertyTreeHelper.trimPropertyTree(config) : config;
        const otherData: PropertyTree = !!otherConfig && ignoreEmptyValues ? PropertyTreeHelper.trimPropertyTree(otherConfig) : otherConfig;

        return api.ObjectHelper.equals(data, otherData);
    }
}
