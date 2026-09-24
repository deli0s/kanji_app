import {DB} from './db.js';

const API='https://kanjiapi.dev/v1/kanji/jlpt-';
const CACHE_ID='jlpt-kanji-v2';

function normalize(x,level){
  return {
    id:`jlpt-${level}-${x.kanji}`,
    char:x.kanji,
    meanings:Array.isArray(x.meanings)&&x.meanings.length?x.meanings:[''],
    onyomi:x.on_readings||[],
    kunyomi:x.kun_readings||[],
    level,
    strokes:[],
    components:[],
    strokeCount:x.stroke_count||0,
    grade:x.grade??null,
    frequency:x.freq_mainichi_shinbun??null,
    source:'KANJIDIC2 via kanjiapi.dev'
  };
}

async function loadRemoteKanji(){
  const responses=await Promise.all([1,2,3,4,5].map(async level=>{
    const r=await fetch(`${API}${level}-enriched`,{cache:'no-store'});
    if(!r.ok)throw new Error(`JLPT N${level} dataset unavailable`);
    return {level,data:await r.json()};
  }));

  const byChar=new Map();
  for(const {level,data} of responses){
    for(const item of data){
      const k=normalize(item,level);
      if(!byChar.has(k.char)||level>byChar.get(k.char).level)byChar.set(k.char,k);
    }
  }
  const result=[...byChar.values()].sort((a,b)=>a.level-b.level||(a.frequency??99999)-(b.frequency??99999)||a.char.localeCompare(b.char));
  await DB.put('datasets',{id:CACHE_ID,value:result,updatedAt:Date.now()});
  return result;
}

export async function loadData(){
  const [seed,kana]=await Promise.all([
    fetch('./data/curriculum.json').then(r=>r.json()),
    fetch('./data/kana.json').then(r=>r.json())
  ]);

  let kanji=seed.kanji||[];
  const cached=await DB.get('datasets',CACHE_ID).catch(()=>null);

  if(cached?.value?.length){
    kanji=cached.value;
  }else{
    try{kanji=await loadRemoteKanji();}
    catch{kanji=kanji.map(k=>({...k,level:Math.max(1,Math.min(5,6-(k.level||5)))}));}
  }

  return {...seed,kanji,kana};
}
