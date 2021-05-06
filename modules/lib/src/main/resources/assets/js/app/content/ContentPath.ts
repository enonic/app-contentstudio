import {Equitable} from 'lib-admin-ui/Equitable';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {ContentUnnamed} from './ContentUnnamed';
import {NamePrettyfier} from 'lib-admin-ui/NamePrettyfier';

export class ContentPath
    implements Equitable {

    public static ELEMENT_DIVIDER: string = '/';

    public static ROOT: ContentPath = ContentPath.fromString('/');

    private readonly elements: string[];

    private readonly refString: string;

    constructor(elements: string[]) {
        this.elements = elements;
        if (elements.length === 0) {
            this.refString = ContentPath.ELEMENT_DIVIDER;
        } else {
            this.refString = (ContentPath.ELEMENT_DIVIDER + this.elements.join(ContentPath.ELEMENT_DIVIDER)).replace(/\/\//g, '/');
        }
    }

    public static fromParent(parent: ContentPath, name: string): ContentPath {
        const elements: string[] = [].concat(parent.getElements(), name);
        return new ContentPath(elements);
    }

    public static fromString(path: string): ContentPath {
        let elements: string[] = [];

        if (path.indexOf('/') === 0 && path.length > 1) {
            path = path.substr(1);
            elements = path.split(ContentPath.ELEMENT_DIVIDER);
        }

        return new ContentPath(elements);
    }

    getPathAtLevel(level: number): ContentPath {
        let result = '';
        for (let index = 0; index < this.getElements().length; index++) {
            result = result + ContentPath.ELEMENT_DIVIDER + this.getElements()[index];
            if (index === (level - 1)) {
                return ContentPath.fromString(result);
            }
        }
        return null;
    }

    getElements(): string[] {
        return this.elements;
    }

    getName(): string {
        return this.elements[this.elements.length - 1];
    }

    getLevel(): number {
        return this.elements.length;
    }

    hasParentContent(): boolean {
        return this.elements.length > 1;
    }

    getFirstElement(): string {
        return (this.elements[0] || '');
    }

    getParentPath(): ContentPath {

        if (this.elements.length < 1) {
            return null;
        }
        let parentElements: string[] = [];
        this.elements.forEach((element: string, index: number) => {
            if (index < this.elements.length - 1) {
                parentElements.push(element);
            }
        });
        return new ContentPath(parentElements);
    }

    isRoot(): boolean {
        return this.equals(ContentPath.ROOT);
    }

    isNotRoot(): boolean {
        return !this.equals(ContentPath.ROOT);
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, ContentPath)) {
            return false;
        }

        let other = <ContentPath>o;

        if (!ObjectHelper.stringEquals(this.refString, other.refString)) {
            return false;
        }

        return true;
    }

    isDescendantOf(path: ContentPath): boolean {
        return (path.isRoot() || this.refString.indexOf(path.toString() + ContentPath.ELEMENT_DIVIDER) === 0) &&
               (this.getLevel() > path.getLevel());
    }

    isChildOf(path: ContentPath): boolean {
        return (path.isRoot() || this.refString.indexOf(path.toString() + ContentPath.ELEMENT_DIVIDER) === 0) &&
               (this.getLevel() === path.getLevel() + 1);
    }

    prettifyUnnamedPathElements(): ContentPath {

        let prettyElements: string[] = [];
        this.elements.forEach((element: string) => {
            if (element.indexOf(ContentUnnamed.UNNAMED_PREFIX) === 0) {
                prettyElements.push('<' + NamePrettyfier.getPrettyUnnamed() + '>');
            } else {
                prettyElements.push(element);
            }
        });

        return new ContentPath(prettyElements);
    }

    toString(): string {
        return this.refString;
    }
}
