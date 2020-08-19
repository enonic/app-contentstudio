import {WidgetItemView} from '../../WidgetItemView';
import {LayersView} from './LayersView';
import * as Q from 'q';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';

export class LayersWidgetItemView
    extends WidgetItemView {

    private layersView: LayersView;

    public layout(): Q.Promise<any> {
        this.removeChildren();

        return super.layout().then(() => {
            this.layersView = new LayersView();

            this.appendChild(this.layersView);
        });
    }

    setContentAndUpdateView(item: ContentSummaryAndCompareStatus): Q.Promise<any> {
        if (this.layersView) {
            this.layersView.setCurrentItem(item);
            return this.layersView.reload();
        }

        return Q(null);
    }

    reload() {
        if (this.layersView && this.layersView.isVisible()) {
            return this.layersView.reload();
        }
    }
}
