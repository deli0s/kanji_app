const DB_NAME='kanji-kori';const VER=3;let dbPromise=null;
function openRaw(version=VER){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME,version);r.onupgradeneeded=()=>{const d=r.result;for(const n of ['progress','reviews','settings','kanjiData'])if(!d.objectStoreNames.contains(n))d.createObjectStore(n,{keyPath:'id'});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error||new Error('IndexedDB error'));r.onblocked=()=>reject(new Error('IndexedDB bloqueada por otra pestaña'))})}
async function open(){if(dbPromise)return dbPromise;dbPromise=openRaw();return dbPromise}
async function put(store,value){const d=await open();return new Promise((res,rej)=>{const r=d.transaction(store,'readwrite').objectStore(store).put(value);r.onsuccess=()=>res(value);r.onerror=()=>rej(r.error)})}
async function get(store,id){const d=await open();return new Promise((res,rej)=>{const r=d.transaction(store,'readonly').objectStore(store).get(id);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function all(store){const d=await open();return new Promise((res,rej)=>{const r=d.transaction(store,'readonly').objectStore(store).getAll();r.onsuccess=()=>res(r.result||[]);r.onerror=()=>rej(r.error)})}
export const DB={open,put,get,all};
