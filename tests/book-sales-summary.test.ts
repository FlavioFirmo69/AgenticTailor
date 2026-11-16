import {test} from 'node:test';import assert from 'node:assert/strict';import {groupBookSales} from '../lib/book-sales-summary.ts';
test('vendite mensili raggruppate per libro, formati separati e ordinamento per copie',()=>{
 const sale={bookId:'a',title:'Titolo',author:'Flavio',quantity:2,format:'paperback'};
 const groups=groupBookSales([sale,{...sale,quantity:1,format:'ebook'},{...sale,quantity:3,format:'hardcover'},{...sale,bookId:'b',author:'Cesare',quantity:1,format:'unspecified'}]);
 assert.equal(groups.length,2);assert.deepEqual([groups[0].total,groups[0].paperback,groups[0].ebook,groups[0].records],[6n,5n,1n,3]);assert.equal(groups[1].other,1n);assert.deepEqual(groupBookSales([]),[]);
});
