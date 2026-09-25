import {DB} from './db.js';

const JOYO_SOURCE='https://raw.githubusercontent.com/jkindrix/japanese-language-data/main/data/core/kanji-joyo.json';
const CACHE_KEY='joyo-kanji-v20260925';

function levelFor(k,index){
  const jlpt=k.jlpt_waller;
  if(/^N[1-5]$/.test(jlpt||'')) return Number(jlpt[1]);
  const grade=Number(k.grade);
  if(grade===1)return 5;
  if(grade===2)return 4;
  if(grade===3)return 3;
  if(grade===4||grade===5)return 2;
  if(grade===6||grade===8)return 1;
  return index<103?5:index<284?4:index<654?3:index<1024?2:1;
}

function normalize(source){
  const records=source?.kanji||[];
  if(records.length!==2136) throw new Error(`El conjunto Jōyō contiene ${records.length} kanji, se esperaban 2136.`);
  const seenChars=new Set();
  const seenIds=new Set();
  return records.map((k,index)=>{
    const char=k.character;
    const id=`k-${k.unicode||char.codePointAt(0).toString(16)}`;
    if(!char||seenChars.has(char)||seenIds.has(id)) throw new Error(`Registro de kanji duplicado: ${char||id}`);
    seenChars.add(char);seenIds.add(id);
    const meanings=k.meanings?.es?.length?k.meanings.es:(k.meanings?.en||[]);
    return {
      id,char,
      meanings:[...new Set(meanings)].slice(0,8),
      meaningsEn:[...new Set(k.meanings?.en||[])].slice(0,8),
      onyomi:[...new Set((k.readings?.on||[]).map(x=>x.replace(/\./g,'')))],
      kunyomi:[...new Set((k.readings?.kun||[]).map(x=>x.replace(/\./g,'')))],
      level:levelFor(k,index),
      jlpt:k.jlpt_waller||null,
      grade:k.grade??null,
      strokeCount:k.stroke_count||0,
      strokes:[],
      components:k.radical_components||[],
      radical:k.radical?.classical??null,
      frequency:k.frequency??null,
      vocabulary:[],
      available:true
    };
  });
}

async function fetchAuthoritative(){
  const response=await fetch(JOYO_SOURCE,{cache:'no-store'});
  if(!response.ok) throw new Error(`No se pudo descargar el catálogo Jōyō (${response.status}).`);
  const records=normalize(await response.json());
  await DB.put('kanjiData',{id:CACHE_KEY,records,savedAt:Date.now(),source:JOYO_SOURCE});
  return records;
}

async function loadKanji(){
  try{
    const cached=await DB.get('kanjiData',CACHE_KEY);
    if(cached?.records?.length===2136) return cached.records;
  }catch(e){console.warn('No se pudo leer la caché local de kanji.',e)}

  try{return await fetchAuthoritative();}
  catch(error){
    console.warn('Catálogo Jōyō remoto no disponible.',error);
    throw new Error('No se pudo cargar el catálogo completo de kanji. Conéctate una vez para descargar los datos y después podrás estudiar sin conexión.');
  }
}

export async function loadData(){
  const [c,kana,kanji]=await Promise.all([
    fetch('./data/curriculum.json').then(r=>{if(!r.ok)throw new Error('curriculum');return r.json()}),
    fetch('./data/kana.json').then(r=>{if(!r.ok)throw new Error('kana');return r.json()}),
    loadKanji()
  ]);
  return {...c,kanji,kana};
}
