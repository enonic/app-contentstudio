import * as $ from 'jquery';
import 'jquery-simulate/jquery.simulate.js';
import 'jquery-ui/ui/widgets/draggable';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {PEl} from '@enonic/lib-admin-ui/dom/PEl';
import {ContentWizardPanel} from '../../../ContentWizardPanel';
import {LiveEditPageProxy} from '../../LiveEditPageProxy';
import {InsertablesGrid} from './InsertablesGrid';
import {Insertables} from './Insertables';
import {SaveAsTemplateAction} from '../../../action/SaveAsTemplateAction';
import {DragHelper} from '@enonic/lib-admin-ui/ui/DragHelper';
import {Panel} from '@enonic/lib-admin-ui/ui/panel/Panel';
import {PageEventsManager} from '../../../PageEventsManager';
import {PageState} from '../../PageState';

export interface ComponentTypesPanelConfig {

    liveEditPage: LiveEditPageProxy;

    contentWizardPanel: ContentWizardPanel;

    saveAsTemplateAction: SaveAsTemplateAction;
}

export class InsertablesPanel
    extends Panel {

    private liveEditPageProxy: LiveEditPageProxy;

    private insertablesGrid: InsertablesGrid;

    private hideContextWindowRequestListeners: (() => void)[] = [];

    private overIFrame: boolean = false;

    private iFrameDraggable: HTMLElement;

    private contextWindowDraggable: JQuery<HTMLElement>;

    private modifyPermissions: boolean = false;

    public static debug: boolean = false;

    constructor(config: ComponentTypesPanelConfig) {
        super('insertables-panel');
        this.liveEditPageProxy = config.liveEditPage;

        let topDescription = new PEl();
        topDescription.getEl().setInnerHtml(i18n('field.insertables'));

        this.insertablesGrid = new InsertablesGrid({draggableRows: true, rowClass: 'comp'});
        this.insertablesGrid.setItems(Insertables.ALL);

        this.appendChildren(topDescription, this.insertablesGrid);

        PageEventsManager.get().onLiveEditPageViewReady(() => {
            if (PageState.getState()?.isFragment()) {
                this.destroyDraggables();
                this.insertablesGrid.setItems(Insertables.ALLOWED_IN_FRAGMENT);
                this.initializeDraggables();
            }
        });

        PageEventsManager.get().onComponentDragStopped(() => {
            // Drop was performed on live edit page
            if (this.contextWindowDraggable) {
                if (InsertablesPanel.debug) {
                    console.log('Simulating mouse up for', this.contextWindowDraggable);
                }
                // draggable was appended to sortable, set it to null to prevent dragStop callback
                this.iFrameDraggable = null;
                this.contextWindowDraggable.simulate('mouseup');
            }
        });

        this.insertablesGrid.onRendered(this.initializeDraggables.bind(this));
        this.onRemoved(this.destroyDraggables.bind(this));
    }

    setModifyPermissions(modifyPermissions: boolean): void {
        this.modifyPermissions = modifyPermissions;
    }

    private initializeDraggables() {
        let components = $('[data-context-window-draggable="true"]:not(.ui-draggable)');

        if (InsertablesPanel.debug) {
            console.log('InsertablesPanel.initializeDraggables', components);
        }

        components.draggable({
            cursorAt: DragHelper.CURSOR_AT,
            appendTo: 'body',
            cursor: 'move',
            revert: 'true',
            distance: 10,
            scope: 'component',
            helper: (event: JQueryEventObject, ui: JQueryUI.DraggableEventUIParams) => DragHelper.get().getHTMLElement(),
            start: (event: JQueryEventObject, ui: JQueryUI.DraggableEventUIParams) => this.handleDragStart(event, ui),
            drag: (event: JQueryEventObject, ui: JQueryUI.DraggableEventUIParams) => this.handleDrag(event, ui),
            stop: (event: JQueryEventObject, ui: JQueryUI.DraggableEventUIParams) => this.handleDragStop(event, ui)
        });
    }

    private destroyDraggables() {
        let components = $('[data-context-window-draggable="true"]:not(.ui-draggable)');

        components.draggable('destroy');
    }

    private handleDragStart(event: JQueryEventObject, ui: JQueryUI.DraggableEventUIParams) {
        if (InsertablesPanel.debug) {
            console.log('InsertablesPanel.handleDragStart', event, ui);
        }

        if (!this.modifyPermissions) {
            return;
        }

        ui.helper.show();

        this.liveEditPageProxy.getDragMask().show();

        // force the lock mask to be shown
        this.contextWindowDraggable = $(event.target) as JQuery<HTMLElement>;
    }

    private handleDrag(event: JQueryEventObject, ui: JQueryUI.DraggableEventUIParams) {
        if (!PageState.getState() || !this.modifyPermissions) {
            // page view is either not ready or there was an error
            // so there is no point in handling drag inside it
            return;
        }

        let over = this.isOverIFrame(event);
        if (this.overIFrame !== over) {
            if (over) {
                this.onEnterIFrame(event, ui);
            } else {
                this.onLeftIFrame(event, ui);
            }
            this.overIFrame = over;
        }
    }

    private handleDragStop(event: JQueryEventObject, ui: JQueryUI.DraggableEventUIParams) {
        if (InsertablesPanel.debug) {
            console.log('InsertablesPanel.handleDragStop', event, ui);
        }
        this.liveEditPageProxy.getDragMask().hide();
        // remove forced lock mask
        this.contextWindowDraggable = null;

        if (this.iFrameDraggable) {
            this.liveEditPageProxy.destroyDraggable(this.iFrameDraggable.getAttribute("data-draggable-hash"));
            // this.iFrameDraggable.simulate('mouseup');

            this.iFrameDraggable = null;
        }
    }

    private isOverIFrame(event: JQueryEventObject): boolean {
        return event.originalEvent.target === this.liveEditPageProxy.getDragMask().getHTMLElement();
    }

    private onLeftIFrame(event: JQueryEventObject, ui: JQueryUI.DraggableEventUIParams) {
        if (InsertablesPanel.debug) {
            console.log('InsertablesPanel.onLeftIFrame');
        }
        this.liveEditPageProxy.getDragMask().show();

        if (this.iFrameDraggable) {
            // let livejq = this.liveEditPageProxy.getJQuery();
            // hide the helper of the iframe draggable,
            // it's a function so call it to get element and wrap in jquery to hide
            // livejq(this.iFrameDraggable.draggable('option', 'helper')()).hide();
        }

        // and show the one in the parent
        ui.helper.show();
    }

    private onEnterIFrame(event: JQueryEventObject, ui: JQueryUI.DraggableEventUIParams) {
        if (InsertablesPanel.debug) {
            console.log('InsertablesPanel.onEnterIFrame');
        }
        this.liveEditPageProxy.getDragMask().hide();
        // let livejq = this.liveEditPageProxy.getJQuery();

        let iFrame = this.liveEditPageProxy.getIFrame().getHTMLElement() as HTMLIFrameElement;
        let hasBody = iFrame && iFrame.contentDocument && iFrame.contentDocument.body;
        if (!hasBody) {
            if (InsertablesPanel.debug) {
                console.warn('InsertablesPanel.onEnterIFrame, skip due to missing body in document');
            }
            return;
        }

        if (!this.iFrameDraggable) {
            this.iFrameDraggable = event.target.cloneNode(true) as HTMLElement;
            const hash = new Date().getTime();
            this.iFrameDraggable.setAttribute('data-draggable-hash', hash.toString());

            //TODO: is this allowed for cross-domain iframes?
            // remove livejq reference!
            // pass necessary data in event instead

            // livejq('body').append(this.iFrameDraggable);
            this.liveEditPageProxy.createDraggable(hash);
            // this.iFrameDraggable.simulate('mousedown').hide();
        }

        // show the helper of the iframe draggable
        // it's a function so call it to get element and wrap in jquery to show
        // livejq(this.iFrameDraggable.draggable('option', 'helper')()).show();

        // and hide the one in the parent
        ui.helper.hide();

        this.notifyHideContextWindowRequest();
    }

    onHideContextWindowRequest(listener: () => void) {
        this.hideContextWindowRequestListeners.push(listener);
    }

    unHideContextWindowRequest(listener: () => void) {
        this.hideContextWindowRequestListeners = this.hideContextWindowRequestListeners
            .filter(function (curr: () => void) {
                return curr !== listener;
            });
    }

    private notifyHideContextWindowRequest() {
        this.hideContextWindowRequestListeners.forEach((listener) => {
            listener();
        });
    }
}
