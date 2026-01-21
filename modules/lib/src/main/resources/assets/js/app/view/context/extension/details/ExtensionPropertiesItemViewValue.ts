
export class ExtensionPropertiesItemViewValue {

    private readonly displayName: string;
    private readonly title?: string;

    constructor(displayName: string, title?: string) {
        this.displayName = displayName;
        this.title = title;
    }

    getDisplayName(): string {
        return this.displayName;
    }

    getTitle(): string {
        return this.title;
    }
}
