export interface ProjectsTreeItemJson {
    name: string;

    parent: string;
}

export interface ProjectsTreeItemJsonContainer {
    entries: ProjectsTreeItemJson[];
}
