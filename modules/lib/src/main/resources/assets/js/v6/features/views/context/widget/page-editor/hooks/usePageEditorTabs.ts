import {useEffect, useState} from 'react';

type UsePageEditorTabsResult = {
    activeTab: string;
    setActiveTab: (tab: string) => void;
};

export function usePageEditorTabs(
    inspectedPath: string | null,
    isInsertTabAvailable: boolean,
    selectionEventNonce: number,
): UsePageEditorTabsResult {
    const [activeTab, setActiveTab] = useState<string>('inspect');

    // Auto-switch tabs when an item is selected. Depending on the nonce
    // (not just the path) ensures a re-select fires the switch even when
    // the new component takes the previously-selected path — e.g. inserting
    // a sibling that shifts the old selection forward.
    useEffect(() => {
        if (inspectedPath != null) {
            setActiveTab('inspect');
        } else if (isInsertTabAvailable) {
            setActiveTab('insert');
        }
    }, [inspectedPath, isInsertTabAvailable, selectionEventNonce]);

    // Fall back to Inspect tab when Insert becomes unavailable
    useEffect(() => {
        if (activeTab === 'insert' && !isInsertTabAvailable) {
            setActiveTab('inspect');
        }
    }, [activeTab, isInsertTabAvailable]);

    return {activeTab, setActiveTab};
}
