import { readFile, access } from "node:fs/promises";
import { siteUrl } from "../lib/site-url.ts";
const decode=value=>value.replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#x27;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">");
const attrs=tag=>Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(m=>[m[1],decode(m[2])]));
const paths=["","nfl/","nhl/","mlb/",...["nfl","nhl","mlb","nba"].map(league=>`${league}/power-rankings/`)];
const titles=new Set(),descriptions=new Set();
for(const path of paths) {
 const html=await readFile(`out/${path}index.html`,"utf8");
 const fail=message=>{throw new Error(`${path||"Home"}: ${message}`);};
 const titleTags=[...html.matchAll(/<title>(.*?)<\/title>/g)];
 if(titleTags.length!==1 || (html.match(/<h1(?:\s|>)/g)??[]).length!==1) fail("Expected one title and one H1");
 const title=decode(titleTags[0][1]); if(titles.has(title)) fail("Duplicate title");titles.add(title);
 const meta=Object.fromEntries([...html.matchAll(/<meta\b[^>]*>/g)].map(m=>{const a=attrs(m[0]);return [a.name??a.property,a.content];}));
 if(!meta.description||descriptions.has(meta.description)) fail("Missing or duplicate description");descriptions.add(meta.description);
 const canonical=[...html.matchAll(/<link\b[^>]*>/g)].map(m=>attrs(m[0])).filter(a=>a.rel==="canonical");
 if(canonical.length!==1||canonical[0].href!==`${siteUrl}${path}`||meta['og:url']!==canonical[0].href) fail("Canonical/social URL mismatch");
 if(meta['og:title']!==title||meta['twitter:title']!==title||!meta['twitter:card']) fail("Social title/card missing or inherited incorrectly");
 for(const key of ['og:image','twitter:image']) {
  if(!meta[key]?.startsWith(siteUrl)) fail(`Missing local ${key}`);
  await access(`out/${meta[key].slice(siteUrl.length)}`);
 }
 let ready=true;
 if(path.includes('power-rankings')) {
  const league=path.split('/')[0];
  try{ready=JSON.parse(await readFile(`content/power-rankings/${league}.json`,'utf8')).ready;}catch(error){if(league!=='nba'||error.code!=='ENOENT')throw error;ready=false;}
 }
 if(!(ready ? /\bindex\b/.test(meta.robots??'')&&!/noindex/.test(meta.robots??'') : /noindex/.test(meta.robots??''))) fail("Incorrect indexability");
 const blocks=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
 const nodes=blocks.flatMap(block=>block['@graph']??[block]);
 for(const type of ['Organization','WebSite','WebPage',...(path?['BreadcrumbList']:[])]) if(!nodes.some(n=>n['@type']===type)) fail(`Missing ${type} structured data`);
 const page=nodes.find(n=>n['@type']==='WebPage');if(page.url!==`${siteUrl}${path}`) fail("Structured page URL mismatch");
 const article=nodes.find(n=>n['@type']==='BlogPosting');
 if(path.includes('power-rankings') && ready) {
  if(!article||article.url!==page.url||article.mainEntityOfPage['@id']!==page['@id']||!article.image?.length||!Number.isFinite(Date.parse(article.datePublished))||article.dateModified!==article.datePublished) fail("Incomplete or unfrozen article schema");
 } else if(article) fail("Unpublished page has article schema");
 for(const tag of html.matchAll(/<a\b[^>]*>/g)) {
  const href=attrs(tag[0]).href;if(!href)continue;
  const target=new URL(href,`${siteUrl}${path}`);if(!target.href.startsWith(siteUrl))continue;
  const relative=target.pathname.slice(new URL(siteUrl).pathname.length);
  if(!relative||relative.endsWith('/'))await access(`out/${relative}index.html`);
 }
}
console.log('SEO verified on all 8 pages: unique metadata, canonicals, social images, schema, indexability and internal links');
