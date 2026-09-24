import {KANJI_CATALOG} from './kanji-catalog.js';

function enrichKanji(kanji){
  const detailed=new Map(kanji.map(k=>[k.char,k]));
  const generated=KANJI_CATALOG.map((char,index)=>{
    if(detailed.has(char)){
      const k={...detailed.get(char)};
      k.level=index<103?5:index<284?4:index<1023?3:index<1979?1:1;
      k.available=true;
      return k;
    }
    return {
      id:`catalog-${index}`,
      char,
      meanings:['Carácter japonés'],
      onyomi:[],
      kunyomi:[],
      level:index<103?5:index<284?4:index<1023?3:index<1979?1:1,
      strokes:[],
      components:[],
      available:false
    };
  });
  return generated;
}

export async function loadData(){
  const [c,k]=await Promise.all([
    fetch('./data/curriculum.json').then(r=>{if(!r.ok)throw new Error('curriculum');return r.json()}),
    fetch('./data/kana.json').then(r=>{if(!r.ok)throw new Error('kana');return r.json()})
  ]);
  return {...c,kanji:enrichKanji(c.kanji),kana:k};
}
