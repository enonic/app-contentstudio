export interface ImageStyleParamsJson {
    scale: string;
}

export interface ImageStyleRequiresJson {
    name: string;
    displayName: string;
}

export interface ImageStyleJson {
    name: string;
    displayName: string;
    type: string;
    params: ImageStyleParamsJson;
    requires: ImageStyleRequiresJson;
}
