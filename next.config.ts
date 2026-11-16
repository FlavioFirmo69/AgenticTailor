import type {NextConfig} from 'next';
const config:NextConfig={turbopack:{root:process.cwd()},outputFileTracingIncludes:{'/api/**':['./database/**/*.sql','./agents/**/*.md']}};
export default config;
