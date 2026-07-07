import {type PortalComponentType} from '../../../v6/widgets/inspectors/model/page-editor/drag';

// Routes v6 insert-panel drag interactions to the live-edit iframe through the
// active LiveEditPageProxy, which owns the protocol bus. The proxy registers
// itself on load and clears the registration on unload, so v6 code never holds
// a direct reference to the proxy or the transport.
export interface LiveEditDraggableHost {
    createDraggable: (kind: PortalComponentType) => void;
    destroyDraggable: (kind: PortalComponentType) => void;
    setDraggableVisible: (kind: PortalComponentType, visible: boolean) => void;
}

let host: LiveEditDraggableHost | undefined;

export function setLiveEditDraggableHost(value: LiveEditDraggableHost | undefined): void {
    host = value;
}

export function getLiveEditDraggableHost(): LiveEditDraggableHost | undefined {
    return host;
}
