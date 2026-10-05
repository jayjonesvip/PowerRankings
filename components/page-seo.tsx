import { siteUrl } from "@/lib/site-url";
export function PageSeo({path,name,description,league}: {path:string;name:string;description:string;league?:string}) {
  const url=`${siteUrl}${path}`;
  const breadcrumbs=[{name:"League Snapshot",item:siteUrl}];
  if(league && !path.endsWith(`${league}/`)) breadcrumbs.push({name:`${league.toUpperCase()} Snapshot`,item:`${siteUrl}${league}/`});
  if(path) breadcrumbs.push({name,item:url});
  const graph=[{"@type":"WebPage","@id":`${url}#webpage`,url,name,description,inLanguage:"en-US",isPartOf:{"@id":`${siteUrl}#website`}},...(path ? [{"@type":"BreadcrumbList",itemListElement:breadcrumbs.map((crumb,index)=>({"@type":"ListItem",position:index+1,...crumb}))}] : [])];
  return <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({"@context":"https://schema.org","@graph":graph}).replace(/</g,"\\u003c")}} />;
}
