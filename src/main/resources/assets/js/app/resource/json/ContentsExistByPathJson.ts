export interface ContentsExistByPathJson {

    contentsExistJson: ContentExistByPathJson[];
}

export interface ContentExistByPathJson {

    contentPath: string;

    exists: boolean;
}
