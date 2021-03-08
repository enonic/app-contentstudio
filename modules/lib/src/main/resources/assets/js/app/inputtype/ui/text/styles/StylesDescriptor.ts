export interface StyleJson {
    element: string;
    name: string;
    displayName: string;
    aspectRatio?: string;
    filter?: string;
}

export interface StylesJson {
    css: string[];
    styles: StyleJson[];
}
