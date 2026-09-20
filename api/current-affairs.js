const FEEDS = [
  'https://news.google.com/rss/search?q=India+defence+OR+military+OR+NDA&hl=en-IN&gl=IN&ceid=IN:en',
  'https://news.google.com/rss/search?q=India+science+technology+economy+OR+space&hl=en-IN&gl=IN&ceid=IN:en',
  'https://news.google.com/rss/search?q=India+national+international+sports&hl=en-IN&gl=IN&ceid=IN:en',
  'https://www.pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=1'
];
function stripTags(s=''){return s.replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ').trim();}
function extract(xml,tag){const re=new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`,'i');const m=xml.match(re);return m?m[1].trim():'';}
function allItems(xml){const chunks=xml.match(/<item[\s\S]*?<\/item>/gi)||[];return chunks.map(chunk=>({title:stripTags(extract(chunk,'title')),link:extract(chunk,'link')||extract(chunk,'guid'),pubDate:extract(chunk,'pubDate')})).filter(x=>x.title&&x.link);}
export default async function handler(req,res){
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','s-maxage=900, stale-while-revalidate=1800');
  try{
    const responses=await Promise.all(FEEDS.map(u=>fetch(u,{headers:{'User-Agent':'NDA-Aspirants-Community/1.0'}}).then(r=>r.ok?r.text():'')));
    const items=responses.flatMap(allItems),seen=new Set(),cutoff=Date.now()-48*60*60*1000;
    const cleaned=items.map(x=>({...x,t:Date.parse(x.pubDate)||0}))
      .filter(x=>x.t>=cutoff||!x.t).sort((a,b)=>b.t-a.t)
      .filter(x=>{const k=x.title.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();if(seen.has(k))return false;seen.add(k);return true;})
      .slice(0,18).map(x=>({title:x.title,link:x.link,source:(()=>{try{return new URL(x.link).hostname.replace(/^www\./,'')}catch{return 'News source'}})(),date:x.t?new Date(x.t).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}):'Recent'}));
    res.status(200).json({items:cleaned,updatedAt:new Date().toISOString()});
  }catch(e){res.status(200).json({items:[],updatedAt:new Date().toISOString(),error:'feed unavailable'});}
}
