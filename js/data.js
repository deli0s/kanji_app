import {KANJI_CATALOG} from './kanji-catalog.js';

function fallbackLevel(index){return index<103?5:index<284?4:index<654?3:index<1024?2:1}
function validate(records){
  const ids=new Set(),chars=new Set();
  for(const k of records){
    if(!k?.char||ids.has(k.id)||chars.has(k.char))throw new Error('Los datos de kanji contienen una asociación duplicada.');
    if(!Array.isArray(k.meanings)||!Array.isArray(k.onyomi)||!Array.isArray(k.kunyomi))throw new Error(`Datos incompletos para ${k.char}.`);
    ids.add(k.id);chars.add(k.char);
  }
  return records;
}
function fallbackKanji(source){
  const byChar=new Map((source||[]).map(k=>[k.char,k]));
  return KANJI_CATALOG.map((char,index)=>byChar.get(char)||{id:`catalog-${index}`,char,meanings:[],onyomi:[],kunyomi:[],level:fallbackLevel(index),strokes:[],strokeCount:0,components:[],available:false});
}
export async function loadData(){
  const [c,kana]=await Promise.all([
    fetch('./data/curriculum.json').then(r=>{if(!r.ok)throw new Error('curriculum');return r.json()}),
    fetch('./data/kana.json').then(r=>{if(!r.ok)throw new Error('kana');return r.json()})
  ]);
  let kanji;
  try{
    const r=await fetch('./data/kanji.json',{cache:'no-store'});
    if(r.ok){const doc=await r.json();kanji=validate(doc.kanji||[]);}
  }catch(e){console.warn('Local kanji dataset unavailable, using safe fallback.',e)}
  if(!kanji||kanji.length!==2136)kanji=fallbackKanji(c.kanji);
  return {...c,kanji,kana};
}
