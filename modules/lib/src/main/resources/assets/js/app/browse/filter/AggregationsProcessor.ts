import {Aggregation} from 'lib-admin-ui/aggregation/Aggregation';
import {Bucket} from 'lib-admin-ui/aggregation/Bucket';
import {BucketAggregation} from 'lib-admin-ui/aggregation/BucketAggregation';
import {WorkflowState} from 'lib-admin-ui/content/WorkflowState';
import {i18n} from 'lib-admin-ui/util/Messages';
import {ContentAggregations} from './ContentAggregations';
import {GetPrincipalsByKeysRequest} from '../../security/GetPrincipalsByKeysRequest';
import * as Q from 'q';
import {PrincipalKey} from 'lib-admin-ui/security/PrincipalKey';
import {Principal} from 'lib-admin-ui/security/Principal';
import {StringHelper} from 'lib-admin-ui/util/StringHelper';
import {GetLocalesRequest} from '../../resource/GetLocalesRequest';
import {Locale} from 'lib-admin-ui/locale/Locale';

export class AggregationsProcessor {

    private principals: Map<string, string> = new Map<string, string>();
    private locales: Locale[];
    private readonly currentUserId: string;

    constructor(userId: string) {
        this.currentUserId = userId;
    }

    updateWorkflowAggregations(aggregations: Aggregation[], total: number) {
        const workflowAggr: Aggregation = aggregations.find((aggr: Aggregation) => aggr.getName() === ContentAggregations.WORKFLOW);

        if (workflowAggr) {
            this.updateWorkflowAggregation(<BucketAggregation>workflowAggr, total);
        }
    }

    private updateWorkflowAggregation(workflowAggr: BucketAggregation, total: number): void {
        // contents might not have a workflow property, thus aggregation won't see those contents, but they are treated as ready
        const inProgressKey: string = WorkflowState[WorkflowState.IN_PROGRESS].toLowerCase();
        const inProgressBucket: Bucket = workflowAggr.getBucketByName(inProgressKey);
        const result: Bucket[] = [];

        const inProgressCount: number = inProgressBucket?.docCount || 0;
        const readyCount: number = total - inProgressCount;

        if (readyCount > 0) {
            const readyKey: string = WorkflowState[WorkflowState.READY].toLowerCase();
            const bucket: Bucket = new Bucket(readyKey, readyCount);
            bucket.setDisplayName(i18n(`status.workflow.${readyKey}`));
            result.push(bucket);
        }

        if (inProgressBucket) {
            inProgressBucket.setDisplayName(i18n(`status.workflow.${inProgressKey}`));
            result.push(inProgressBucket);
        }

        workflowAggr.setBuckets(result);
    }

    updatePrincipalsAggregations(aggregations: Aggregation[]): Q.Promise<BucketAggregation[]> {
        const principalsAggregations: BucketAggregation[] = <BucketAggregation[]>aggregations.filter((aggr: Aggregation) => {
            return aggr.getName() === ContentAggregations.MODIFIER || aggr.getName() === ContentAggregations.OWNER;
        });

        return Q.all(principalsAggregations.map((principalAggr: BucketAggregation) => this.updatePrincipalsAggregation(principalAggr)));
    }

    private updatePrincipalsAggregation(principalsAggregation: BucketAggregation): Q.Promise<BucketAggregation> {
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

    private updateUnknownPrincipals(principalsAggregation: BucketAggregation): Q.Promise<BucketAggregation> {
        // finding keys which display names are not loaded
        const unknownPrincipals: PrincipalKey[] = principalsAggregation.getBuckets()
            .filter((bucket: Bucket) => !this.principals.has(bucket.getKey()))
            .map((bucket: Bucket) => PrincipalKey.fromString(bucket.getKey()));

        if (unknownPrincipals.length === 0) {
            return Q(principalsAggregation);
        }

       return new GetPrincipalsByKeysRequest(unknownPrincipals).sendAndParse().then((principals: Principal[]) => {
            unknownPrincipals.forEach((unknownPrincipal: PrincipalKey) => {
                // if principal is not found (im might be deleted) then using key
                const principal: Principal = principals.find((p: Principal) => p.getKey().equals(unknownPrincipal));
                this.principals.set(unknownPrincipal.toString(), principal?.getDisplayName() || unknownPrincipal.toString());
            });

            this.updateKnownPrincipals(principalsAggregation);

            return Q.resolve(principalsAggregation);
        });
    }

    updateLanguageAggregations(aggregations: Aggregation[]): Q.Promise<BucketAggregation> {
        const langAggr: Aggregation = aggregations.find((aggr: Aggregation) => aggr.getName() === ContentAggregations.LANGUAGE);

        return !!langAggr? this.updateLanguageAggregation(<BucketAggregation>langAggr) : Q.resolve(null);
    }

    private updateLanguageAggregation(langAggr: BucketAggregation): Q.Promise<BucketAggregation> {
        if (this.locales) {
            langAggr.getBuckets().forEach((bucket: Bucket) => {
                const displayName: string =
                    this.locales.find((locale: Locale) => locale.getId().toLowerCase() === bucket.getKey())?.getDisplayName();

                if (displayName) {
                    bucket.setDisplayName(displayName);
                }
            });

            return Q.resolve(langAggr);
        }

        return new GetLocalesRequest().sendAndParse().then((locales: Locale[]) => {
            this.locales = locales;
            return this.updateLanguageAggregation(langAggr);
        });
    }
}
