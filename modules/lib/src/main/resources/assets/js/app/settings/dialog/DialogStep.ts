import * as Q from 'q';
import {Element} from '@enonic/lib-admin-ui/dom/Element';

export abstract class DialogStep {

    private dataChangedListeners: { (): void }[] = [];

    validate(): Q.Promise<void> {
        return Q.resolve();
    }

    isValid(): Q.Promise<boolean> {
        return Q.resolve(true);
    }

    getData(): Object {
        return null;
    }

    hasData(): boolean {
        return !!this.getData();
    }

    isOptional(): boolean {
        return false;
    }

    abstract getHtmlEl(): Element;

    onDataChanged(listener: () => void) {
        this.dataChangedListeners.push(listener);
    }

    unDataChanged(listener: () => void) {
        this.dataChangedListeners.filter((currentListener: () => void) => {
            return listener === currentListener;
        });
    }

    protected notifyDataChanged() {
        this.dataChangedListeners.forEach((listener: () => void) => {
            listener();
        });
    }
}
