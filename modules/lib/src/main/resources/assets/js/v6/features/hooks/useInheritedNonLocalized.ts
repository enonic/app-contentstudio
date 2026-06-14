import {useStore} from '@nanostores/preact';
import {$wizardToolbar} from '../store/wizardToolbar.store';

export function useInheritedNonLocalized(): boolean {
    const {isContentInherited, isContentDataInherited} = useStore($wizardToolbar, {
        keys: ['isContentInherited', 'isContentDataInherited'],
    });

    return isContentInherited && isContentDataInherited;
}
