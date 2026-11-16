import Workspace from './Workspace';
import {validClient} from '@/lib/domain';
export default function Page(){const configured=process.env.CLIENT_ID??'';return <Workspace initialClient={validClient(configured)?configured:'personal'}/>;}
