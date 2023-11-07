import type { Options } from './tsup';

import { defineConfig } from 'tsup';
import {
    DIR_DST,
    DIR_DST_ASSETS,
    DIR_DST_STATIC,
    DIR_SRC_ASSETS,
    DIR_SRC_STATIC
} from './tsup/constants';


export default defineConfig((options: Options) => {
    // console.log('options', options);
    if (options.d === DIR_DST) {
        return import('./tsup/server').then(m => m.default());
    }
    if (options.d === DIR_DST_ASSETS) {
        return import('./tsup/assets').then(m => m.default());
    }
    if (options.d === DIR_DST_STATIC) {
        return import('./tsup/static').then(m => m.default());
    }
    if (options?.entry?.['page-editor/js/editor'] === `${DIR_SRC_ASSETS}/js/page-editor.ts`) {
        return import('./tsup/pageEditor').then(m => m.default());
    }
    if (options?.entry?.['js/swcHelpers'] === `${DIR_SRC_ASSETS}/js/swcHelpers.ts`) {
        return import('./tsup/swcHelpers').then(m => m.default());
    }
    // if (options?.entry?.[0] === `${DIR_SRC_ASSETS}/js/vendors.ts`) {
    //     return import('./tsup/vendors').then(m => m.default());
    // }
    throw new Error(`Unconfigured directory:${options.d}!`)
});
