export interface StyleJson {
    element: string;
    name: string;
    label: string;
    aspectRatio?: string;
    filter?: string;
}

export interface StylesJson {
    css: string[];
    styles: StyleJson[];
}
