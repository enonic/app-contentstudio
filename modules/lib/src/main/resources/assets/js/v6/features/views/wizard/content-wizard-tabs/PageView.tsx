import {type ReactElement} from 'react';
import {PageComponentsView} from './page-components/PageComponentsView';

export const PageView = (): ReactElement => {
    return <PageComponentsView showTitle />;
};

PageView.displayName = 'PageView';
