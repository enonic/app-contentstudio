import type {ReactElement} from 'react';
import {ProjectSelectionDialog} from '../../../shared/dialogs/ProjectSelectionDialog';


export const BrowseAppShell = (): ReactElement => {
  return (
      <>
          {/* Shared dialogs */}
          <ProjectSelectionDialog />
      </>
  );
};

BrowseAppShell.displayName = 'AppShell';
