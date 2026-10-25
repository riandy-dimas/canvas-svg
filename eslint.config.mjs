import nextVitals from 'eslint-config-next/core-web-vitals'
import prettier from 'eslint-plugin-prettier/recommended'

const config = [
  ...nextVitals,
  prettier,
  { ignores: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts'] },
]

export default config
