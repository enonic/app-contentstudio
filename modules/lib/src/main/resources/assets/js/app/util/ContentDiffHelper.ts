import {ContentDiff} from '../content/ContentDiff';
import {PropertyTreeHelper} from '@enonic/lib-admin-ui/util/PropertyTreeHelper';
import {Mixin} from '../content/Mixin';
import {MixinByMixinNameComparator} from '../content/MixinByMixinNameComparator';
import {ContentSummaryHelper} from '../content/ContentSummaryHelper';
import {Content} from '../content/Content';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';

export class ContentDiffHelper {
    public static diff(item: Content, other: Content, ignoreEmptyDataValues: boolean = false): ContentDiff {
        const diff: ContentDiff = ContentSummaryHelper.diff(item, other);

        if (!ContentDiffHelper.dataEquals(item.getContentData(), other.getContentData(), ignoreEmptyDataValues)) {
            diff.data = true;
        }

        if (!ContentDiffHelper.mixinsEquals(item.getMixins(), other.getMixins(), ignoreEmptyDataValues)) {
            diff.mixins = true;
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

    public static mixinsEquals(mixins: Mixin[], other: Mixin[], ignoreEmptyValues: boolean = false): boolean {
        if (ignoreEmptyValues) {
            const isOtherArrayEmpty: boolean = !other || other.length === 0 || other.every(ed => !ed.getData() || ed.getData().isEmpty());
            const isThisArrayEmpty: boolean =
                !mixins || mixins.length === 0 || mixins.every(ed => !ed.getData() || ed.getData().isEmpty());

            if (isThisArrayEmpty && isOtherArrayEmpty) {
                return true;
            }
        }

        const comparator = new MixinByMixinNameComparator();

        const arrayA = mixins.sort(comparator.compare);
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
