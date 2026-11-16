import Image from 'next/image';

export default function Brand({admin=false}:{admin?:boolean}){
 return <a className={'brand-lockup compact-brand'+(admin?' brand-admin':'')} href="/" aria-label="Agentic Tailor"><span className="brand-emblem" aria-hidden="true"><Image src="/branding/cesare-strategy-navy.png" alt="" width={2172} height={724} priority/></span><span className="brand-name">Agentic Tailor</span></a>;
}
