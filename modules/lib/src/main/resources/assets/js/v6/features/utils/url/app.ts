
type UrlAction = 'browse' | 'new' | 'edit' | 'issue' | 'outbound' | 'inbound' | 'custom';

const WIZARD_ACTIONS: UrlAction[] = ['edit', 'new'];

const WIZARD_ACTION_PATTERN = new RegExp(`/(?:${WIZARD_ACTIONS.join('|')})/`);

export const isWizardUrl = (): boolean => {
    if (typeof window === 'undefined') return false;
    return WIZARD_ACTION_PATTERN.test(window.location.pathname)
        || WIZARD_ACTION_PATTERN.test(window.location.hash);
};
