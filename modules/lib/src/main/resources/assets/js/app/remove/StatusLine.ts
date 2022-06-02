import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import * as Q from 'q';
import {H6El} from '@enonic/lib-admin-ui/dom/H6El';

export class StatusLine extends H6El {

    private readonly icon: DivEl;

    private readonly part1: SpanEl;

    private readonly part2: SpanEl;

    constructor() {
        super('status-line');

        this.icon = new DivEl('icon');
        this.part1 = new SpanEl('part part1');
        this.part2 =  new SpanEl('part part2');

        this.icon.hide();
        this.part1.hide();
        this.part2.hide();
    }

    setIconClass(value: string): StatusLine {
        this.icon.setClass(`icon ${value}`).show();
        return this;
    }

    setMainText(value: string): StatusLine {
        this.part1.setHtml(value).show();
        return this;
    }

    setSecondaryText(value: string): StatusLine {
        this.part2.setHtml(value).show();
        return this;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChildren(this.icon, this.part1, this.part2);

            return rendered;
        });
    }
}
