import type { Options } from './tsup';

import { defineConfig } from 'tsup';
import {
    DIR_DST,
    // DIR_DST_TEST
} from './tsup/constants';


export default defineConfig((options: Options) => {
    if (options.d === DIR_DST) {
        return import('./tsup/server').then(m => m.default());
	}
    // if (options.d === DIR_DST_TEST) {
    //     return import('./tsup/test').then(m => m.default());
	// }
    // if (options.d === 'build/resources/main/assets') {
    //     return import('./tsup/assets').then(m => m.default());
	// }
    // if (options.d === 'build/resources/main/static') {
    //     return import('./tsup/static').then(m => m.default());
    // }
    throw new Error(`Unconfigured directory:${options.d}!`)
});
