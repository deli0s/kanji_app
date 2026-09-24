const DB_NAME='kanji-kori';const VER=1;let db;
function open(){if(db)return Promise.resolve(db);return new Promise((res,rej)=>{const r=indexedDB.open(DB_NAME,VER);r.onupgradeneeded=()=>{const d=r.result;for(const n of ['progress','reviews','settings'])if(!d.objectStoreNames.contains(n))d.createObjectStore(n,{keyPath:'id'});};r.onsuccess=()=>{db=r.result;res(db)};r.onerror=()=>rej(r.error)})}
async function put(store,value){const d=await open();return new Promise((res,rej)=>{const r=d.transaction(store,'readwrite').objectStore(store).put(value);r.onsuccess=()=>res(value);r.onerror=()=>rej(r.error)})}
async function get(store,id){const d=await open();return new Promise((res,rej)=>{const r=d.transaction(store).objectStore(store).get(id);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function all(store){const d=await open();return new Promise((res,rej)=>{const r=d.transaction(store).objectStore(store).getAll();r.onsuccess=()=>res(r.result||[]);r.onerror=()=>rej(r.error)})}
export const DB={open,put,get,all};
