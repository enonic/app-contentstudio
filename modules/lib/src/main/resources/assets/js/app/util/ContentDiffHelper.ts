import {type ContentDiff} from '../content/ContentDiff';
import {PropertyTreeHelper} from '@enonic/lib-admin-ui/util/PropertyTreeHelper';
import {type Mixin} from '../content/Mixin';
import {MixinByMixinNameComparator} from '../content/MixinByMixinNameComparator';
import {ContentSummaryHelper} from '../content/ContentSummaryHelper';
import {type Content} from '../content/Content';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {type Property} from '@enonic/lib-admin-ui/data/Property';
import {type PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import {type PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {ValueTypes} from '@enonic/lib-admin-ui/data/ValueTypes';

export class ContentDiffHelper {
    public static diff(item: Content, other: Content, ignoreEmptyDataValues: boolean = false): ContentDiff {
        const diff: ContentDiff = ContentSummaryHelper.diff(item, other);

        if (!ContentDiffHelper.dataEquals(item.getContentData(), other.getContentData(), ignoreEmptyDataValues)) {
            diff.data = true;
        }

        if (!ContentDiffHelper.extraDataEquals(item.getMixins(), other.getMixins(), ignoreEmptyDataValues)) {
            diff.extraData = true;
        }

        if (!ObjectHelper.equals(item.getPage(), other.getPage())) {
            diff.pageObj = true;
        }

        if (!ObjectHelper.equals(item.getPermissions(), other.getPermissions())) {
            diff.permissions = true;
        }

        if (!ObjectHelper.equals(item.getAttachments(), other.getAttachments())) {
            diff.attachments = true;
        }

        return diff;
    }

    public static dataEquals(data: PropertyTree, other: PropertyTree, ignoreEmptyValues: boolean = false): boolean {
        return PropertyTreeHelper.propertyTreesEqual(data, other, ignoreEmptyValues);
    }

    /**
     * Compares two property trees for equivalence rather than strict equality.
     *
     * Unlike {@link dataEquals}, a property whose occurrences are all null is treated as
     * equal to the property being absent: the form serializes every rendered empty input
     * as an explicit null property, while content written through the API (or saved
     * before its schema gained a field) simply omits it — the two carry the same
     * information, and `dataEquals` would report them as different.
     *
     * The tolerance is per property array, and only for entirely-null arrays — the shape
     * the form produces when seeding inputs that have no stored data. A null occurrence
     * alongside real values (e.g. `['a', null]` vs `['a']`) is a deliberate occurrence
     * change and stays significant, as do null properties on `changedPathKeys` (paths the
     * user actually edited).
     *
     * Also unlike `dataEquals` with `ignoreEmptyValues=true` — which additionally ignores
     * empty strings, `false` booleans and empty sets — only null-vs-absent differences are
     * tolerated here; every actual value remains significant.
     */
    public static dataEquivalent(data: PropertyTree, other: PropertyTree, changedPathKeys: string[] = []): boolean {
        if (!data || !other) {
            return data === other;
        }

        const changedBaseKeys = new Set(changedPathKeys.map((key) => ContentDiffHelper.toBasePathKey(key)));
        const prunedData = data.copy();
        const prunedOther = other.copy();
        ContentDiffHelper.removeNullProperties(prunedData.getRoot(), changedBaseKeys);
        ContentDiffHelper.removeNullProperties(prunedOther.getRoot(), changedBaseKeys);

        return ObjectHelper.equals(prunedData, prunedOther);
    }

    private static removeNullProperties(set: PropertySet, changedBaseKeys: Set<string>): void {
        const toRemove: Property[] = [];

        for (const propertyArray of set.getPropertyArrays()) {
            const properties = propertyArray.getProperties();

            for (const property of properties) {
                if (!property.hasNullValue() && property.getType().equals(ValueTypes.DATA)) {
                    ContentDiffHelper.removeNullProperties(property.getValue().getPropertySet(), changedBaseKeys);
                }
            }

            const allNull = properties.length > 0 && properties.every((property) => property.hasNullValue());
            if (allNull && !changedBaseKeys.has(ContentDiffHelper.toBasePathKey(ContentDiffHelper.toPathKey(properties[0])))) {
                toRemove.push(...properties);
            }
        }

        set.removeProperties(toRemove);
        set.removeEmptyArrays(set);
    }

    private static toPathKey(property: Property): string {
        const pathString = property.getPath().toString();
        return pathString.startsWith('.') ? pathString.slice(1) : pathString;
    }

    private static toBasePathKey(pathKey: string): string {
        return pathKey.replace(/\[\d+]$/, '');
    }

    public static extraDataEquals(extraData: Mixin[], other: Mixin[], ignoreEmptyValues: boolean = false): boolean {
        if (ignoreEmptyValues) {
            const isOtherArrayEmpty: boolean = !other || other.length === 0 || other.every(ed => !ed.getData() || ed.getData().isEmpty());
            const isThisArrayEmpty: boolean =
                !extraData || extraData.length === 0 || extraData.every(ed => !ed.getData() || ed.getData().isEmpty());

            if (isThisArrayEmpty && isOtherArrayEmpty) {
                return true;
            }
        }

        const comparator = new MixinByMixinNameComparator();

        const arrayA = extraData.sort(comparator.compare);
        const arrayB = other.sort(comparator.compare);

        if (arrayA.length !== arrayB.length) {
            return false;
        }

        for (let i = 0; i < arrayA.length; i++) {
            if (!PropertyTreeHelper.propertyTreesEqual(arrayA[i].getData(), arrayB[i].getData(), ignoreEmptyValues)) {
                return false;
            }
        }

        return true;
    }
}
