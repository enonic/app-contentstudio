type CustomSelectorItemJson = {
    id: string;
    displayName: string;
    description: string;
    iconUrl: string;
    icon: CustomSelectorItemIcon;
};

type CustomSelectorItemIcon = {
    data: string;
    type: string;
};

export class CustomSelectorItem {

    id: string;
    displayName: string;
    description: string;
    iconUrl: string;
    icon: {
        data: string;
        type: string;
    };

    constructor(json: CustomSelectorItemJson) {
        this.id = json.id;
        this.displayName = json.displayName;
        this.description = json.description;
        this.iconUrl = json.iconUrl;
        this.icon = json.icon;
    }

    getId() {
        return this.id;
    }
}
