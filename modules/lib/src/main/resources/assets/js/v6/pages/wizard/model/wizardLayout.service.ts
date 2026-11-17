import { $activeWidgetId, setContextOpen } from '../../../widgets/context-panel/model/contextWidgets.store';
import { $isContentFormExpanded, setContentFormExpanded } from './wizardContent.store';
import {
    $isWizardLayoutMeasured,
    $wizardContextPanelMode,
    $wizardViewMode,
    setWizardViewMode,
    shouldCollapseWizardContextInitially,
} from './wizardLayout.store';

//
// * Wizard Layout Service
//
// Decides which of the form and the page editor the wizard shows: form only,
// both side by side, or (in the mobile range) the editor only, and whether the
// form is minimized next to the editor. The legacy panel applies the result to
// its elements through the host.
//

export type WizardLayoutHost = {
    /** The page editor is shown next to, or instead of, the form. */
    applyLiveEdit: (shown: boolean) => void;
    applyMinimized: (minimized: boolean) => void;
};

export type WizardLayoutOptions = {
    /** Without a content type the editor is not restored when the wizard leaves the mobile range. */
    hasContentType: boolean;
};

let host: WizardLayoutHost | undefined;
let hasContentType = false;
let minimized = false;
let minimizedFromFormOnly = false;
let inMobileViewMode = false;
let restoreSplitViewAfterMobile = false;

export function showWizardForm(): void {
    setWizardViewMode('form');
    host?.applyLiveEdit(false);

    if (minimized) toggleWizardFormMinimized();
}

export function showWizardLiveEdit(): void {
    setWizardViewMode(inMobileViewMode ? 'live' : 'split');
    host?.applyLiveEdit(true);
}

export function toggleWizardFormMinimized(): void {
    minimized = !minimized;
    host?.applyMinimized(minimized);

    if (minimized) {
        // A form minimized while it is alone needs the editor beside it.
        minimizedFromFormOnly = $wizardViewMode.get() === 'form';

        if (minimizedFromFormOnly) {
            if (inMobileViewMode) restoreSplitViewAfterMobile = true;
            setWizardViewMode('split');
        }
    } else if (minimizedFromFormOnly) {
        minimizedFromFormOnly = false;
        setWizardViewMode('form');
    }

    setContentFormExpanded(!minimized);
}

/** Shows the page editor, or the form alone in the mobile range. */
export function openWizardLiveEdit(): void {
    if ($wizardContextPanelMode.get() === 'mobile') {
        inMobileViewMode = true;
        restoreSplitViewAfterMobile = hasContentType;
        showWizardForm();
        return;
    }

    showWizardLiveEdit();
}

function handleMobileModeChanged(isMobile: boolean): void {
    const viewMode = $wizardViewMode.get();
    const withEditor = viewMode === 'split' || viewMode === 'live';

    inMobileViewMode = isMobile;

    if (isMobile) {
        restoreSplitViewAfterMobile = restoreSplitViewAfterMobile || withEditor;

        if (viewMode === 'split' && !minimized) showWizardForm();
        return;
    }

    if (restoreSplitViewAfterMobile || viewMode === 'live') {
        if (minimized) minimizedFromFormOnly = false;
        showWizardLiveEdit();
    }

    restoreSplitViewAfterMobile = false;
}

/** Starts the layout for a rendered wizard; the returned function stops it. */
export function startWizardLayout(nextHost: WizardLayoutHost, options: WizardLayoutOptions): () => void {
    host = nextHost;
    hasContentType = options.hasContentType;
    minimized = false;
    minimizedFromFormOnly = false;
    inMobileViewMode = false;
    restoreSplitViewAfterMobile = false;

    const unsubscribeMode = $wizardContextPanelMode.subscribe((mode, prevMode) => {
        const isMobile = mode === 'mobile';
        if (prevMode !== undefined && isMobile === (prevMode === 'mobile')) return;
        if (prevMode === undefined && !isMobile) {
            inMobileViewMode = false;
            return;
        }

        handleMobileModeChanged(isMobile);
    });

    // The editor opens once the layout reports its first measurement.
    let unsubscribeMeasured: (() => void) | undefined;
    let opened = false;
    unsubscribeMeasured = $isWizardLayoutMeasured.subscribe((measured) => {
        if (!measured || opened) return;
        opened = true;
        unsubscribeMeasured?.();

        openWizardLiveEdit();

        if (!shouldCollapseWizardContextInitially() && $activeWidgetId.get() != null) setContextOpen(true);
    });
    if (opened) unsubscribeMeasured();

    const unsubscribeExpanded = $isContentFormExpanded.listen((expanded) => {
        if (expanded === minimized) toggleWizardFormMinimized();
    });

    return () => {
        unsubscribeMode();
        unsubscribeMeasured?.();
        unsubscribeExpanded();
        if (host === nextHost) host = undefined;
    };
}
