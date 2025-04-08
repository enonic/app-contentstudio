import {Aggregation} from '@enonic/lib-admin-ui/aggregation/Aggregation';
import {Bucket} from '@enonic/lib-admin-ui/aggregation/Bucket';
import {BucketAggregation} from '@enonic/lib-admin-ui/aggregation/BucketAggregation';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ContentAggregation} from './ContentAggregation';
import {GetPrincipalsByKeysRequest} from '../../security/GetPrincipalsByKeysRequest';
import * as Q from 'q';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {GetLocalesRequest} from '../../resource/GetLocalesRequest';
import {Locale} from '@enonic/lib-admin-ui/locale/Locale';
import {GetAllContentTypesRequest} from '../../resource/GetAllContentTypesRequest';
import {ContentTypeSummary} from '@enonic/lib-admin-ui/schema/content/ContentTypeSummary';

export class AggregationsDisplayNamesResolver {

    private principals: Map<string, string> = new Map<string, string>();
    private locales: Locale[];
    private contentTypes: Map<string, string>;
    private currentUserId?: string;

    updateAggregationsDisplayNames(aggregations: Aggregation[], userId: string): Q.Promise<void> {
        this.updateWorkflowAggregations(aggregations);

        const updatePromises: Q.Promise<void>[] = [];
        updatePromises.push(this.updateLanguageAggregations(aggregations));
        updatePromises.push(this.updatePrincipalsAggregations(aggregations, userId));
        updatePromises.push(this.updateContentTypeAggregations(aggregations));


        return Q.all(updatePromises).thenResolve(null);
    }

    private updateWorkflowAggregations(aggregations: Aggregation[]) {
        const workflowAggr: Aggregation = aggregations.find((aggr: Aggregation) => aggr.getName() === ContentAggregation.WORKFLOW.toString());

        if (workflowAggr) {
            this.updateWorkflowAggregation(workflowAggr as BucketAggregation);
        }
    }

    private updateWorkflowAggregation(workflowAggr: BucketAggregation): void {
        workflowAggr.getBuckets().forEach((bucket: Bucket) => bucket.setDisplayName(i18n(`status.workflow.${bucket.getKey()}`)));
    }

    updatePrincipalsAggregations(aggregations: Aggregation[], userId: string): Q.Promise<void> {
        this.currentUserId = userId;

        const principalsAggregations: BucketAggregation[] =
            aggregations.filter((aggr: Aggregation) => this.isPrincipalAggregation(aggr)) as BucketAggregation[];

        return Q.all(principalsAggregations.map((principalAggr: BucketAggregation) => this.updatePrincipalsAggregation(principalAggr)))
            .thenResolve(null);
    }

    protected isPrincipalAggregation(aggregation: Aggregation): boolean {
        return aggregation.getName() === ContentAggregation.MODIFIED_BY.toString() || aggregation.getName() === ContentAggregation.OWNER.toString();
    }

    private updatePrincipalsAggregation(principalsAggregation: BucketAggregation): Q.Promise<void> {
        this.updateKnownPrincipals(principalsAggregation);
        return this.updateUnknownPrincipals(principalsAggregation);
    }

    private updateKnownPrincipals(principalsAggregation: BucketAggregation): void {
        principalsAggregation.getBuckets().forEach((bucket: Bucket) => {
            const displayName: string = bucket.getKey() === this.currentUserId
                                        ? StringHelper.capitalize(i18n('field.me'))
                                        : this.principals.get(bucket.getKey());
            bucket.setDisplayName(displayName);
        });

        principalsAggregation.getBuckets().sort(this.sortPrincipalsBuckets.bind(this));
    }

    private sortPrincipalsBuckets(a: Bucket, b: Bucket): number {
        if (a.getKey() === this.currentUserId) {
            return -1;
        }

        if (b.getKey() === this.currentUserId) {
            return 1;
        }

        return b.getDocCount() - a.getDocCount();
    }

    private updateUnknownPrincipals(principalsAggregation: BucketAggregation): Q.Promise<void> {
        // finding keys which display names are not loaded
        const unknownPrincipals: PrincipalKey[] = principalsAggregation.getBuckets()
            .filter((bucket: Bucket) => !this.principals.has(bucket.getKey()))
            .map((bucket: Bucket) => PrincipalKey.fromString(bucket.getKey()));

        if (unknownPrincipals.length === 0) {
            return Q();
        }

        return new GetPrincipalsByKeysRequest(unknownPrincipals).sendAndParse().then((principals: Principal[]) => {
            unknownPrincipals.forEach((unknownPrincipal: PrincipalKey) => {
                // if principal is not found (im might be deleted) then using key
                const principal: Principal = principals.find((p: Principal) => p.getKey().equals(unknownPrincipal));
                this.principals.set(unknownPrincipal.toString(), principal?.getDisplayName() || unknownPrincipal.toString());
            });

            this.updateKnownPrincipals(principalsAggregation);
        });
    }

    updateLanguageAggregations(aggregations: Aggregation[]): Q.Promise<void> {
        const langAggr: Aggregation = aggregations.find((aggr: Aggregation) => aggr.getName() === ContentAggregation.LANGUAGE.toString());

        return !!langAggr ? this.updateLanguageAggregation(langAggr as BucketAggregation) : Q.resolve(null);
    }

    private updateLanguageAggregation(langAggr: BucketAggregation): Q.Promise<void> {
        if (this.locales) {
            langAggr.getBuckets().forEach((bucket: Bucket) => {
                const displayName: string =
                    this.locales.find((locale: Locale) => locale.getId().toLowerCase() === bucket.getKey())?.getDisplayName();

                if (displayName) {
                    bucket.setDisplayName(displayName);
                }
            });

            return Q();
        }

        return new GetLocalesRequest().sendAndParse().then((locales: Locale[]) => {
            this.locales = locales;
            return this.updateLanguageAggregation(langAggr);
        });
    }

    updateContentTypeAggregations(aggregations: Aggregation[]): Q.Promise<void> {
        const contentTypeAggr: Aggregation = aggregations.find((aggr: Aggregation) => aggr.getName() === ContentAggregation.CONTENT_TYPE.toString());

        return !!contentTypeAggr ? this.updateContentTypeAggregation(contentTypeAggr as BucketAggregation) : Q.resolve(null);
    }

    private updateContentTypeAggregation(aggregation: BucketAggregation): Q.Promise<void> {
        if (this.contentTypes) {
            aggregation.getBuckets().forEach((bucket: Bucket) => {
                bucket.setDisplayName(this.contentTypes.get(bucket.getKey()) || bucket.getKey());
            });

            return Q();
        }

        return new GetAllContentTypesRequest().sendAndParse().then((items: ContentTypeSummary[]) => {
            this.contentTypes = new Map<string, string>();

            items.forEach((item: ContentTypeSummary) => {
                this.contentTypes.set(item.getName().toLowerCase(), item.getDisplayName());
            });

            return this.updateContentTypeAggregation(aggregation);
        });
    }
}
