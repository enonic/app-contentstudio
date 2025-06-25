import {LegacyElement as BaseLegacyElement} from '@enonic/lib-admin-ui/ui2/LegacyElement';
import {IdProvider} from '@enonic/ui';
import type {ComponentProps, ComponentType} from 'react';
import {render} from 'react-dom';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class LegacyElement<C extends ComponentType<any>, P extends ComponentProps<C> = ComponentProps<C>> extends BaseLegacyElement<C, P> {

    protected renderJsx(): void {
        const Component = this.component;

        render(
            <IdProvider prefix={this.getPrefix()}>
                <Component {...this.props.get()} />
            </IdProvider>,
            this.getHTMLElement()
        );
    }
}
