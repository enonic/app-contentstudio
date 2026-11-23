import { LegacyElement as BaseLegacyElement } from '@enonic/lib-admin-ui/ui2/LegacyElement';
import { IdProvider } from '@enonic/ui';
import type { ComponentType } from 'react';
import { render } from 'react-dom';

// ? preact 11 `ComponentProps` as both constraint and default of a generic hits TS2589
type PropsOf<C> = C extends ComponentType<infer P> ? P : never;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class LegacyElement<C extends ComponentType<any>, P extends PropsOf<C> = PropsOf<C>> extends BaseLegacyElement<
    C,
    P
> {
    protected renderJsx(): void {
        const Component = this.component;

        render(
            <IdProvider prefix={this.getPrefix()}>
                <Component {...this.props.get()} />
            </IdProvider>,
            this.getHTMLElement(),
        );
    }
}
