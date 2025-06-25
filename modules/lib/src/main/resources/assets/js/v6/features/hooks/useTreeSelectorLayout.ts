import {useEffect, useMemo} from 'react';

type TreeNodeLike = {
    id: string;
    isLoading: boolean;
    data: unknown;
};

type UseTreeSelectorLayoutParams = {
    flatNodes: readonly TreeNodeLike[];
    activeId: string | null;
    setActiveId: (id: string | null) => void;
    open: boolean;
    rowHeight: number;
    rowGap: number;
    padding: number;
    maxHeight: number;
};

type UseTreeSelectorLayoutResult = {
    treeHeight: number;
};

export const useTreeSelectorLayout = ({
    flatNodes,
    activeId,
    setActiveId,
    open,
    rowHeight,
    rowGap,
    padding,
    maxHeight,
}: UseTreeSelectorLayoutParams): UseTreeSelectorLayoutResult => {
    const treeHeight = useMemo(() => {
        const count = flatNodes.length;
        if (count === 0) {
            return rowHeight + padding;
        }
        const contentHeight = count * rowHeight + Math.max(count - 1, 0) * rowGap + padding;
        return Math.min(contentHeight, maxHeight);
    }, [flatNodes.length, maxHeight, padding, rowGap, rowHeight]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const activeExists = activeId && flatNodes.some((node) => node.id === activeId);
        if (activeExists) {
            return;
        }

        const firstNode = flatNodes.find((node) => !node.isLoading && node.data);
        setActiveId(firstNode?.id ?? null);
    }, [activeId, flatNodes, open, setActiveId]);

    return {treeHeight};
};
