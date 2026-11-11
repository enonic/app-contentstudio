export type ToolbarAction = {
    id: string;
    label: string;
    enabled: boolean;
    visible: boolean;
    execute: () => void;
};
