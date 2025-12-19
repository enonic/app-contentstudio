import {UrlAction} from '../../../../app/UrlAction';
import type {AppPage} from '../../store/app.store';

const WIZARD_ACTION_PATTERN = new RegExp(`/(?:${UrlAction.EDIT}|${UrlAction.NEW})/`);

export const isWizardLocation = (): boolean => {
    if (typeof window === 'undefined') return false;
    return WIZARD_ACTION_PATTERN.test(window.location.pathname)
        || WIZARD_ACTION_PATTERN.test(window.location.hash);
};

export const getAppPageFromLocation = (): AppPage => (isWizardLocation() ? 'wizard' : 'browse');
