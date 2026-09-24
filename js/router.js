export function router(){return location.hash.replace(/^#/,'')||'home'}
export function go(route){location.hash=route}
