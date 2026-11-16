import {test} from 'node:test';import assert from 'node:assert/strict';import {bookSalesPeriod} from '../lib/book-sales-period.ts';
test('periodi vendite: mesi bisestili, singolo giorno e intervalli su più anni',()=>{
 assert.deepEqual(bookSalesPeriod({month:'2028-02'}),{start:'2028-02-01',end:'2028-02-29'});
 assert.deepEqual(bookSalesPeriod({start:'2025-12-15',end:'2027-01-01'}),{start:'2025-12-15',end:'2027-01-01'});
 assert.deepEqual(bookSalesPeriod({start:'2026-11-05',end:'2026-11-05'}),{start:'2026-11-05',end:'2026-11-05'});
 for(const input of [{start:'2026-02-30',end:'2026-03-01'},{start:'2026-12-01',end:'2026-11-01'},{start:'2026-01-01'},{month:'2026-13'}])assert.throws(()=>bookSalesPeriod(input));
});
