import {SortContentEvent} from './browse/sort/SortContentEvent';
import {ContentEventsProcessor} from './ContentEventsProcessor';
import {NewContentEvent} from './create/NewContentEvent';
import {ContentUpdatedEvent} from './event/ContentUpdatedEvent';
import {EditContentEvent} from './event/EditContentEvent';

export class ContentEventsListener {

    private started: boolean = false;

    constructor() {

        NewContentEvent.on((event) => {
            if (this.started) {
                ContentEventsProcessor.handleNew(event);
            }
        });

        EditContentEvent.on((event) => {
            if (this.started) {
                ContentEventsProcessor.handleEdit(event);
            }
        });

        ContentUpdatedEvent.on((event) => {
            if (this.started) {
                ContentEventsProcessor.handleUpdated(event);
            }
        });

        SortContentEvent.on((event) => {
            if (this.started) {
                ContentEventsProcessor.handleSort(event);
            }
        });
    }

    start() {
        this.started = true;
    }

    stop() {
        this.started = false;
    }
}
