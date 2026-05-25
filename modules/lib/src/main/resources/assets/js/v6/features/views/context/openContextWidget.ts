import {InspectEvent} from '../../../../app/event/InspectEvent';
import {$registeredWidgets} from '../../store/contextWidgets.store';

export type OpenContextWidgetOptions = {
    applicationKey?: string;
    showPanel?: boolean;
};

export function openContextWidget(name: string, options: OpenContextWidgetOptions = {}): boolean {
    const {applicationKey, showPanel = true} = options;

    if (!isContextWidgetRegistered(name, applicationKey)) return false;

    InspectEvent.create()
        .setWidgetName(name, applicationKey)
        .setShowPanel(showPanel)
        .build()
        .fire();

    return true;
}

export function isContextWidgetRegistered(name: string, applicationKey?: string): boolean {
    return $registeredWidgets.get().some(w => {
        if (w.name !== name) return false;
        if (applicationKey === undefined) return true;
        return w.applicationKey === applicationKey;
    });
}
