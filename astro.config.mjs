import { defineConfig } from 'astro/config';

import unocss from 'unocss/astro'
import { presetUno, presetIcons } from 'unocss'
import presetAttributify from '@unocss/preset-attributify'
import presetTypography from '@unocss/preset-typography'

// https://astro.build/config
export default defineConfig({
    integrations: [
        unocss({
          presets: [
            presetAttributify(),
            presetUno(),
            presetIcons({
              collections: {
                carbon: () =>
                  import('@iconify-json/carbon').then((i) => i.icons )
              },
            }),
            presetTypography(),
          ]
        }),
      ],
});
