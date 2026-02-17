import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {type Equitable} from '@enonic/lib-admin-ui/Equitable';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {type Property} from '@enonic/lib-admin-ui/data/Property';
import {type PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {Content, ContentBuilder} from './Content';
import {PageTemplateKey} from '../page/PageTemplateKey';
import {type Regions} from '../page/region/Regions';
import {type DescriptorKey} from '../page/DescriptorKey';

export class PageTemplate
    extends Content
    implements Equitable {

    private readonly canRender: ContentTypeName[];

    constructor(builder: PageTemplateBuilder) {

        super(builder);

        this.canRender = [];
        this.getContentData().forEachProperty('supports', (property: Property) => {
            this.canRender.push(new ContentTypeName(property.getString()));
        });
    }

    getKey(): PageTemplateKey {
        return PageTemplateKey.fromContentId(this.getContentId());
    }

    getController(): DescriptorKey {

        return this.getPage().getController();
    }

    isCanRender(pattern: ContentTypeName): boolean {
        return this.getCanRender().some((name: ContentTypeName) => {
            return name.equals(pattern);
        });
    }

    getCanRender(): ContentTypeName[] {

        return this.canRender;
    }

    hasRegions(): boolean {
        if (!this.isPage()) {
            return false;
        }
        return this.getPage().hasNonEmptyRegions();
    }

    getRegions(): Regions {
        if (!this.isPage()) {
            return null;
        }
        return this.getPage().getRegions();
    }

    hasConfig(): boolean {
        if (!this.isPage()) {
            return false;
        }
        return this.getPage().hasConfig();
    }

    getConfig(): PropertyTree {
        if (!this.isPage()) {
            return null;
        }
        return this.getPage().getConfig();
    }

    equals(o: Equitable, ignoreEmptyValues: boolean = false): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, PageTemplate)) {
            return false;
        }

        return super.equals(o, ignoreEmptyValues);
    }

    clone(): PageTemplate {

        return this.newBuilder().build();
    }

    newBuilder(): PageTemplateBuilder {
        return new PageTemplateBuilder(this);
    }
}

export class PageTemplateBuilder
    extends ContentBuilder {

    constructor(source?: PageTemplate) {
        super(source);
    }

    public build(): PageTemplate {
        return new PageTemplate(this);
    }
}
