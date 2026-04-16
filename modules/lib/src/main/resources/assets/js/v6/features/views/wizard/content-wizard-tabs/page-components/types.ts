export type PageComponentNodeType = 'page' | 'region' | 'part' | 'layout' | 'text' | 'fragment';

export type PageComponentNodeData = {
    displayName: string;
    nodeType: PageComponentNodeType;
    draggable: boolean;
    layoutFragment: boolean;
    hasDescriptor: boolean;
};
