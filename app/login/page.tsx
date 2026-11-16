import LoginForm from './LoginForm';import {authConfigured} from '@/lib/supabase-auth';
export const dynamic='force-dynamic';
export default function Login(){return <LoginForm configured={authConfigured()}/>;}
