export async function loadData(){const [c,k]=await Promise.all([fetch('./data/curriculum.json').then(r=>r.json()),fetch('./data/kana.json').then(r=>r.json())]);return { ...c,kana:k }}
