import PropertyTree = api.data.PropertyTree;

export class PropertyTreeHelper {

    static trimPropertyTree(data: PropertyTree): PropertyTree {
        const copy: PropertyTree = data.copy();
        copy.getRoot().removeEmptyValues();

        return copy;
    }

    static configsEqual(config: PropertyTree, otherConfig: PropertyTree): boolean {
        if ((!config || config.isEmpty()) && (!otherConfig || otherConfig.isEmpty())) {
            return true;
        }

        const data: PropertyTree = !!config ? PropertyTreeHelper.trimPropertyTree(config) : config;
        const otherData: PropertyTree = !!otherConfig ? PropertyTreeHelper.trimPropertyTree(otherConfig) : otherConfig;

        return api.ObjectHelper.equals(data, otherData);
    }
}
