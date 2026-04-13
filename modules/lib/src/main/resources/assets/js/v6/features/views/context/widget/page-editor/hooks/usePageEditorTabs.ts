import {useEffect, useState} from 'react';

type UsePageEditorTabsResult = {
    activeTab: string;
    setActiveTab: (tab: string) => void;
};

export function usePageEditorTabs(
    isInspecting: boolean,
    isInsertTabAvailable: boolean,
): UsePageEditorTabsResult {
    const [activeTab, setActiveTab] = useState<string>('inspect');

    // Auto-switch tabs based on inspection state
    useEffect(() => {
        if (isInspecting) {
            setActiveTab('inspect');
        } else if (isInsertTabAvailable) {
            setActiveTab('insert');
        }
    }, [isInspecting, isInsertTabAvailable]);

    // Fall back to Inspect tab when Insert becomes unavailable
    useEffect(() => {
        if (activeTab === 'insert' && !isInsertTabAvailable) {
            setActiveTab('inspect');
        }
    }, [activeTab, isInsertTabAvailable]);

    return {activeTab, setActiveTab};
}
