import {Equitable} from 'lib-admin-ui/Equitable';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {NodePath, NodePathBuilder} from 'lib-admin-ui/NodePath';

export class ContentPath
    extends NodePath {

    public static CONTENT_ROOT: string = 'content';

    public static ARCHIVE_ROOT: string = 'archive';

    private static ROOT: ContentPath;

    private readonly root: string;

    constructor(builder: ContentPathBuilder) {
        super(builder);

        this.root = builder.root || ContentPath.CONTENT_ROOT;
    }

    getPathAtLevel(level: number): ContentPath {
        let result: string = '';

        for (let index = 0; index < this.getElements().length; index++) {
            result = result + NodePath.NODE_PATH_DIVIDER + this.getElements()[index];
            if (index === (level - 1)) {
                return new ContentPathBuilder().fromString(result).build();
            }
        }

        return null;
    }

    getName(): string {
        return this.elements[this.elements.length - 1];
    }

    hasParentContent(): boolean {
        return this.elements.length > 1;
    }

    equals(o: Equitable): boolean {
        return ObjectHelper.iFrameSafeInstanceOf(o, ContentPath) && super.equals(o);
    }

    getParentPath(): ContentPath {
        return <ContentPath>super.getParentPath();
    }

    isInContentRoot(): boolean {
        return this.getRoot() === ContentPath.CONTENT_ROOT;
    }

    isInArchiveRoot(): boolean {
        return this.getRoot() === ContentPath.ARCHIVE_ROOT;
    }

    getRoot(): string {
        return this.root;
    }

    isRoot(): boolean {
        return this.getLevel() === 0;
    }

    newBuilder(): ContentPathBuilder {
        return new ContentPathBuilder(this);
    }

    public static create(): ContentPathBuilder {
        return new ContentPathBuilder();
    }

    public static getRoot(): ContentPath {
        if (!ContentPath.ROOT) {
            ContentPath.ROOT = ContentPath.create().fromString('/').build();
        }

        return ContentPath.ROOT;
    }
}

export class ContentPathBuilder extends NodePathBuilder {

    root: string = ContentPath.CONTENT_ROOT;

    setRoot(value: string): ContentPathBuilder {
        this.root = value;
        return this;
    }

    setElements(value: string[]): ContentPathBuilder {
        return <ContentPathBuilder>super.setElements(value);
    }

    setAbsolute(value: boolean): ContentPathBuilder {
        return <ContentPathBuilder>super.setAbsolute(value);
    }

    setElementDivider(value: string): ContentPathBuilder {
        return <ContentPathBuilder>super.setElementDivider(value);
    }

    fromParent(parent: ContentPath, ...childElements): ContentPathBuilder {
        return <ContentPathBuilder>super.fromParent(parent, ...childElements);
    }

    fromString(s: string, elementDivider: string = NodePath.NODE_PATH_DIVIDER): ContentPathBuilder {
        return <ContentPathBuilder>super.fromString(s, elementDivider);
    }

    build(): ContentPath {
        return new ContentPath(this);
    }
}
