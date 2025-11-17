import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {Toolbar} from '@enonic/ui';
import {ReactElement} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {SearchToggle} from './SearchToggle';
import {ContextToggle} from './ContextToggle';
import {LegacyElement} from '../../../shared/LegacyElement';

type Props = {
  toggleFilterPanelAction: Action;
};

export const BrowseToolbar = ({toggleFilterPanelAction}: Props): ReactElement => {

    return (
        // <IdProvider prefix='browse-toolbar'>
        <Toolbar>
            <Toolbar.Container
                aria-label={useI18n('aria.browser.toolbar.label')}
                className="bg-surface-neutral h-15 px-5 py-2 flex items-center gap-2.5 border-b border-bdr-soft">
              <SearchToggle action={toggleFilterPanelAction} />
              <div className="flex-1" />
              <ContextToggle />
            </Toolbar.Container>
        </Toolbar>
        // </IdProvider>
    );
};

BrowseToolbar.displayName = 'BrowseToolbar';

export class BrowseToolbarElement extends LegacyElement<typeof BrowseToolbar, Props> {
    constructor(props: Props) {
        super(props, BrowseToolbar);
    }
}
