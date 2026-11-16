type Sale={bookId:string;title:string;author:string;quantity:number;format:string};
export function groupBookSales(sales:Sale[]){
 const groups=new Map<string,{bookId:string;title:string;author:string;total:bigint;paperback:bigint;ebook:bigint;other:bigint;records:number}>();
 for(const s of sales){let g=groups.get(s.bookId);if(!g){g={bookId:s.bookId,title:s.title,author:s.author,total:0n,paperback:0n,ebook:0n,other:0n,records:0};groups.set(s.bookId,g);}const n=BigInt(s.quantity);g.total+=n;g.records++;if(['paperback','hardcover'].includes(s.format))g.paperback+=n;else if(s.format==='ebook')g.ebook+=n;else g.other+=n;}
 return [...groups.values()].sort((a,b)=>a.total===b.total?a.title.localeCompare(b.title,'it')||a.bookId.localeCompare(b.bookId):a.total>b.total?-1:1);
}
