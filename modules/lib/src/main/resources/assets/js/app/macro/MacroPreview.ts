import {type Equitable} from '@enonic/lib-admin-ui/Equitable';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {type MacroPreviewJson} from './resource/MacroPreviewJson';
import {PageContributions} from './PageContributions';

export class MacroPreview
    implements Equitable {

    private readonly html: string;

    private readonly macroString: string;

    private readonly pageContributions: PageContributions;

    constructor(builder: MacroPreviewBuilder) {
        this.html = builder.html;
        this.macroString = builder.macroString;
        this.pageContributions = builder.pageContributions;
    }

    static create(): MacroPreviewBuilder {
        return new MacroPreviewBuilder();
    }

    getHtml(): string {
        return this.html;
    }

    getMacroString(): string {
        return this.macroString;
    }

    getPageContributions(): PageContributions {
        return this.pageContributions;
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, MacroPreview)) {
            return false;
        }

        const other = o as MacroPreview;

        if (this.html !== other.html) {
            return false;
        }

        if (this.macroString !== other.macroString) {
            return false;
        }

        if (!ObjectHelper.equals(this.pageContributions, other.pageContributions)) {
            return false;
        }

        return true;
    }
}

export class MacroPreviewBuilder {

    html: string;

    macroString: string;

    pageContributions: PageContributions;

    fromJson(json: MacroPreviewJson) {
        this.html = json.html;
        this.macroString = json.macro;
        this.pageContributions = PageContributions.create().fromJson(json.pageContributions).build();
        return this;
    }

    setHtml(html: string): MacroPreviewBuilder {
        this.html = html;
        return this;
    }

    setMacroString(macroString: string): MacroPreviewBuilder {
        this.macroString = macroString;
        return this;
    }

    setPageContributions(pageContributions: PageContributions): MacroPreviewBuilder {
        this.pageContributions = pageContributions;
        return this;
    }

    build(): MacroPreview {
        return new MacroPreview(this);
    }
}
