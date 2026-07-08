export type MediaUploaderAllowType = {
    name: string;
    extensions: string;
};

export type MediaUploaderConfig = {
    hideDropZone: boolean;
    allowExtensions: MediaUploaderAllowType[];
};
