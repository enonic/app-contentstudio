export enum CustomSelectorMode {
    FLAT,
    GALLERY
}

export class CustomSelectorModeHelper {

    static isFlat(mode: CustomSelectorMode): boolean {
        return mode === CustomSelectorMode.FLAT;
    }

    static isGallery(mode: CustomSelectorMode): boolean {
        return mode === CustomSelectorMode.GALLERY;
    }
}
