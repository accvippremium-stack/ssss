'use strict';
const http = require('node:http');
const crypto = require('node:crypto');
const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const key = process.env.ACCESS_KEY;
if (!key || key.length < 16) throw new Error('Set ACCESS_KEY to at least 16 characters.');
const session = crypto.randomBytes(32).toString('hex');
let browser, page, shot, queue = Promise.resolve();
async function ready() {
  if (page && !page.isClosed()) return;
  const {chromium} = require('playwright');
  browser = await chromium.launch({args:['--disable-dev-shm-usage']});
  const context = await browser.newContext({viewport:{width:360,height:480},acceptDownloads:false,serviceWorkers:'block'});
  await context.route('**/*', route => {
    const u = new URL(route.request().url());
    // This is a personal, password-protected browser, not a public proxy.
    if (!['https:','http:'].includes(u.protocol)) return route.abort();
    if (/^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[)/i.test(u.hostname)) return route.abort();
    return route.continue();
  });
  page = await context.newPage();
  page.setDefaultTimeout(15000);
  browser.on('disconnected', () => {page = null; browser = null; shot = null;});
}
function html(message='') {
  return '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=360"><title>E7 Web</title></head><body style="margin:0;font-family:Arial;background:#eee">'+
  '<h3>E7 Web</h3><p>'+escape(message)+'</p><form method="post" action="/action"><input name="url" size="28" placeholder="https://example.com"><button name="op" value="go">Mo</button><br><button name="op" value="back">Lui</button> <button name="op" value="up">Len</button> <button name="op" value="down">Xuong</button> <button name="op" value="refresh">Cap nhat</button></form>'+
  (shot ? '<form method="post" action="/action"><input type="hidden" name="op" value="click"><input type="image" name="point" src="/screen?t='+Date.now()+'" width="360" height="480" alt="Trang web"></form>' : '<p>Nhap dia chi de bat dau.</p>')+
  '<form method="post" action="/action"><input name="text" size="26"><button name="op" value="type">Nhap chu</button><button name="op" value="enter">Enter</button></form><p>Bam o nhap trong anh truoc khi nhap chu. Video va am thanh chua duoc ho tro.</p><form method="post" action="/action"><button name="op" value="reset">Xoa phien</button></form></body></html>';
}
async function body(req) {
  const chunks=[]; let size=0;
  for await (const chunk of req) {size+=chunk.length; if(size>8192) throw new Error('Request too large'); chunks.push(chunk);}
  return new URLSearchParams(Buffer.concat(chunks).toString('utf8'));
}
function send(res,status,data,type='text/html; charset=utf-8') {
  res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'}); res.end(data);
}
async function handle(req,res) {
  const path = new URL(req.url,'http://local').pathname;
  if(path==='/health') return send(res,200,'ok','text/plain');
  if(path==='/login' && req.method==='POST') {
    const p=await body(req), supplied=Buffer.from(p.get('key')||''), expected=Buffer.from(key);
    if(supplied.length===expected.length && crypto.timingSafeEqual(supplied,expected)) {
      res.writeHead(303,{'Location':'/','Set-Cookie':'e7='+session+'; HttpOnly; Path=/; SameSite=Lax'+(process.env.NODE_ENV==='production'?'; Secure':'')}); return res.end();
    }
    return send(res,403,'Sai ma truy cap. <a href="/">Thu lai</a>');
  }
  if(!(req.headers.cookie||'').split(';').some(c=>c.trim()==='e7='+session)) return send(res,200,'<!DOCTYPE html><meta charset="utf-8"><h3>E7 Web</h3><form action="/login" method="post"><input type="password" name="key"><button>Dang nhap</button></form>');
  if(path==='/screen' && shot) return send(res,200,shot,'image/jpeg');
  if(path==='/action' && req.method==='POST') {
    const p=await body(req);
    const work = queue.then(async()=>{
      await ready();
      switch(p.get('op')) {
        case 'go': {
          let value=(p.get('url')||'').trim(); if(!/^https?:\/\//i.test(value)) value='https://'+value;
          const u=new URL(value); if(!['http:','https:'].includes(u.protocol)||u.username||u.password) throw new Error('Dia chi khong hop le');
          await page.goto(u.href,{waitUntil:'domcontentloaded',timeout:30000}); break;
        }
        case 'back': await page.goBack({waitUntil:'domcontentloaded'}); break;
        case 'up': await page.evaluate(()=>window.scrollBy(0,-360)); break;
        case 'down': await page.evaluate(()=>window.scrollBy(0,360)); break;
        case 'refresh': break;
        case 'click': {
          if(!p.has('point.x') || !p.has('point.y')) throw new Error('Vi tri khong hop le');
          const x=Number(p.get('point.x')),y=Number(p.get('point.y'));
          if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||x>=360||y<0||y>=480) throw new Error('Vi tri khong hop le');
          await page.mouse.click(x,y); break;
        }
        case 'type': await page.keyboard.insertText((p.get('text')||'').slice(0,2000)); break;
        case 'enter': await page.keyboard.press('Enter'); break;
        case 'reset': await browser.close(); return;
        default: throw new Error('Thao tac khong hop le');
      }
      await page.waitForTimeout(800);
      shot=await page.screenshot({type:'jpeg',quality:60,timeout:15000});
    });
    queue=work.catch(()=>{});
    try {await work; return send(res,200,html());} catch(e) {return send(res,200,html('Khong mo duoc trang. Thu lai hoac xoa phien. '+e.message.slice(0,180)));}
  }
  return send(res,200,html());
}
const server=http.createServer((req,res)=>handle(req,res).catch(()=>send(res,500,'Server error')));
if(require.main===module) server.listen(Number(process.env.PORT||3000),'0.0.0.0');
module.exports={server};
