import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Button} from '@enonic/lib-admin-ui/ui/button/Button';
import {ConfirmationDialog} from '@enonic/lib-admin-ui/ui/dialog/ConfirmationDialog';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ContentAggregation} from './ContentAggregation';
import {AggregationSelection} from '@enonic/lib-admin-ui/aggregation/AggregationSelection';
import {ProjectContext} from '../../project/ProjectContext';
import {Path} from '@enonic/lib-admin-ui/rest/Path';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {DateRangeBucket} from '@enonic/lib-admin-ui/aggregation/DateRangeBucket';
import {ValueExpr} from '@enonic/lib-admin-ui/query/expr/ValueExpr';
import {UriHelper} from '@enonic/lib-admin-ui/util/UriHelper';
import {DateTimeFormatter} from '@enonic/lib-admin-ui/ui/treegrid/DateTimeFormatter';
import {SearchInputValues} from '@enonic/lib-admin-ui/query/SearchInputValues';
import {ContentDependency} from './ContentDependency';

enum EXPORT_TYPE {
    CSV = 'csv', JSON = 'json'
}

export class ContentExportElement extends DivEl {

    protected exportButton: Button;
    protected exportServicePath: string;
    protected exportConfirmationDialog: ConfirmationDialog;

    protected total: number;
    protected searchInputValues: SearchInputValues;
    protected constraintIds: string[] = [];
    protected dependency: ContentDependency;

    constructor() {
        super('export-button-container');

        this.initElements();
        this.initListeners();
    }

    setTotal(total: number): this {
        this.total = total;
        return this;
    }

    setSearchInputValues(searchInputValues: SearchInputValues): this {
        this.searchInputValues = searchInputValues;
        return this;
    }

    setConstraintIds(constraintIds: string[]): this {
        this.constraintIds = constraintIds || [];
        return this;
    }

    setDependency(dependency: ContentDependency): this {
        this.dependency = dependency;
        return this;
    }

    setEnabled(enabled: boolean): this {
        this.exportButton.setEnabled(enabled);
        return this;
    }

    protected initElements(): void {
        this.exportButton = new Button(i18n('action.export')).addClass('export-button') as Button;
    }

    protected initListeners(): void {
        this.onRendered(() => {
            this.appendChild(this.exportButton);
        });

        this.exportButton?.onClicked(() => {
            this.handleExportClicked();
        });
    }

    protected handleExportClicked(): void {
        if (!this.exportConfirmationDialog) {
            this.exportConfirmationDialog = new ConfirmationDialog()
                .setYesCallback(() => {
                    this.exportSearch(this.getSelectedType());
                });
        }

        const typeString = i18n(`dialog.export.type.${this.getSelectedType()}`);
        this.exportConfirmationDialog.setQuestion(i18n('dialog.confirm.export', this.total, typeString)).open();
    }

    protected getSelectedType(): EXPORT_TYPE {
        return EXPORT_TYPE.CSV;
    }

    // copied from app-users
    protected exportSearch(type: EXPORT_TYPE): void {
        const uri: string = this.makeURI(type);
        const reportName: string = `content-export-${DateTimeFormatter.createHtml(new Date()).replace(' ', 'T')}.csv`;

        this.clickFakeElementForReportDownload(uri, reportName);
    }

    protected makeURI(type: EXPORT_TYPE): string {
        const params = {
            type: type,
            project: ProjectContext.get().getProject().getName(),
            searchText: this.searchInputValues.getTextSearchFieldValue(),
            constraintIds: this.constraintIds?.join(),
        };

        if (this.dependency) {
            const dependencyType = this.dependency.isInbound ? 'inbound' : 'outbound';
            params[dependencyType] = this.dependency.dependencyId?.toString();
        }

        this.searchInputValues.aggregationSelections.filter((value) => value.getSelectedBuckets().length).forEach((selected) => {
            params[selected.name] = this.aggregationSelectionValueToString(selected);
        });

        return UriHelper.appendUrlParams(this.getReportServicePath(), params);
    }

    protected aggregationSelectionValueToString(selected: AggregationSelection): string {
        if (selected.getName() === ContentAggregation.LAST_MODIFIED.toString()) {
            return selected.getSelectedBuckets().map(
                (bucket: DateRangeBucket) => ValueExpr.dateTime(bucket.getFrom()).getValue().getString()).join();
        }

        return selected.selectedBuckets.map((bucket) => bucket.getKey()).join();
    }


    protected getReportServicePath(): string {
        if (!this.exportServicePath) {
            this.exportServicePath = Path.fromString(CONFIG.getString('services.exportServiceUrl')).toString();
        }

        return this.exportServicePath;
    }

    // copied from app-users
    protected clickFakeElementForReportDownload(uri: string, fileName: string): void {
        const element: HTMLElement = document.createElement('a');
        element.setAttribute('href', uri);
        element.setAttribute('download', fileName);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }

}
