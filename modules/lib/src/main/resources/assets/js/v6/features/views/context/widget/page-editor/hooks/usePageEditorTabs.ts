import {useEffect, useState} from 'react';

type UsePageEditorTabsResult = {
    activeTab: string;
    setActiveTab: (tab: string) => void;
};

export function usePageEditorTabs(
    inspectedPath: string | null,
    isInsertTabAvailable: boolean,
): UsePageEditorTabsResult {
    const [activeTab, setActiveTab] = useState<string>('inspect');

    // Auto-switch tabs when the inspected item changes.
    // Depending on the path (not just a boolean) ensures that selecting a
    // different item re-triggers the switch — e.g. dropping a new component
    // while another was already inspected.
    useEffect(() => {
        if (inspectedPath != null) {
            setActiveTab('inspect');
        } else if (isInsertTabAvailable) {
            setActiveTab('insert');
        }
    }, [inspectedPath, isInsertTabAvailable]);

    // Fall back to Inspect tab when Insert becomes unavailable
    useEffect(() => {
        if (activeTab === 'insert' && !isInsertTabAvailable) {
            setActiveTab('inspect');
        }
    }, [activeTab, isInsertTabAvailable]);

    return {activeTab, setActiveTab};
}
