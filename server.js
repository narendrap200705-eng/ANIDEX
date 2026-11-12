const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const app = express();
const PORT = process.env.PORT || 3000;
const DB = path.join(__dirname,'data','db.json');
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
app.disable('x-powered-by');
app.use(express.json({limit:'1mb'}));
app.use(express.static(path.join(__dirname,'public')));
const initial = {users:[],sessions:[],anime:[
{id:'shadow-requiem',title:'Shadow Requiem',genre:['Dark Fantasy','Action'],year:2026,rating:'9.1',description:'A powerless wanderer discovers an ancient force beneath a city that never sees daylight.',poster:'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=85',banner:'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&q=85',featured:true,premium:false,episodes:[{id:'sr-1',number:1,title:'The Awakening',duration:'24 min',videoUrl:'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',premium:false},{id:'sr-2',number:2,title:'The Hollow Gate',duration:'24 min',videoUrl:'',premium:true}]},
{id:'neon-drift',title:'Neon Drift',genre:['Sci-Fi','Action'],year:2026,rating:'8.8',description:'In a future megacity, a courier carries a secret that could change everything.',poster:'https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=800&q=85',banner:'https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=1600&q=85',featured:false,premium:false,episodes:[{id:'nd-1',number:1,title:'Midnight Delivery',duration:'22 min',videoUrl:'',premium:false}]},
{id:'crimson-moon',title:'Crimson Moon',genre:['Mystery','Fantasy'],year:2025,rating:'9.0',description:'A forgotten legend rises as a red moon appears over the kingdom.',poster:'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=800&q=85',banner:'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=1600&q=85',featured:false,premium:true,episodes:[{id:'cm-1',number:1,title:'The Omen',duration:'25 min',videoUrl:'',premium:true}]},
{id:'last-horizon',title:'Last Horizon',genre:['Adventure','Drama'],year:2026,rating:'8.7',description:'A crew crosses impossible distances to find a place they can call home.',poster:'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&q=85',banner:'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1600&q=85',featured:false,premium:false,episodes:[{id:'lh-1',number:1,title:'Departure',duration:'23 min',videoUrl:'',premium:false}]},
{id:'silent-blade',title:'Silent Blade',genre:['Action','Drama'],year:2025,rating:'8.9',description:'A lone swordsman confronts a past that refuses to stay buried.',poster:'https://images.unsplash.com/photo-1511497584788-876760111969?w=800&q=85',banner:'https://images.unsplash.com/photo-1511497584788-876760111969?w=1600&q=85',featured:false,premium:false,episodes:[{id:'sb-1',number:1,title:'A Debt of Steel',duration:'24 min',videoUrl:'',premium:false}]},
{id:'azure-dream',title:'Azure Dream',genre:['Romance','Fantasy'],year:2026,rating:'8.6',description:'Two strangers share the same impossible dream across different worlds.',poster:'https://images.unsplash.com/photo-1500534623283-312aade485b7?w=800&q=85',banner:'https://images.unsplash.com/photo-1500534623283-312aade485b7?w=1600&q=85',featured:false,premium:false,episodes:[{id:'ad-1',number:1,title:'When Stars Meet',duration:'24 min',videoUrl:'',premium:false}]}
],watchlists:{},progress:{}};
function load(){if(!fs.existsSync(DB)){fs.mkdirSync(path.dirname(DB),{recursive:true});fs.writeFileSync(DB,JSON.stringify(initial,null,2));}return JSON.parse(fs.readFileSync(DB,'utf8'));}
let db=load();
function save(){const tmp=DB+'.tmp';fs.writeFileSync(tmp,JSON.stringify(db,null,2));fs.renameSync(tmp,DB);}
function hash(password,salt=crypto.randomBytes(16).toString('hex')){return salt+':'+crypto.scryptSync(password,salt,64).toString('hex');}
function verify(password,stored){try{const [salt,digest]=stored.split(':');return crypto.timingSafeEqual(Buffer.from(digest,'hex'),crypto.scryptSync(password,salt,64));}catch{return false;}}
if(ADMIN_EMAIL && ADMIN_PASSWORD && !db.users.some(u=>u.email===ADMIN_EMAIL)){db.users.push({id:crypto.randomUUID(),name:'Administrator',email:ADMIN_EMAIL,password:hash(ADMIN_PASSWORD),role:'admin',premium:true});save();}
function safeUser(u){return {id:u.id,name:u.name,email:u.email,role:u.role,premium:u.premium};}
function auth(req,res,next){const token=(req.headers.authorization||'').replace(/^Bearer /,'');const session=db.sessions.find(s=>s.token===token && s.expires>Date.now());req.user=session && db.users.find(u=>u.id===session.userId);if(!req.user)return res.status(401).json({error:'Please sign in'});next();}
function admin(req,res,next){if(req.user.role!=='admin')return res.status(403).json({error:'Admin access required'});next();}
function sessionFor(u){const token=crypto.randomBytes(32).toString('hex');db.sessions.push({token,userId:u.id,expires:Date.now()+1000*60*60*24*14});save();return {token,user:safeUser(u)};}
function err(res,msg,code=400){return res.status(code).json({error:msg});}
app.post('/api/register',(req,res)=>{const {name,email,password}=req.body||{};if(typeof name!=='string'||name.trim().length<2||typeof email!=='string'||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||typeof password!=='string'||password.length<8)return err(res,'Enter a name, valid email and password of at least 8 characters');if(db.users.some(u=>u.email===email.toLowerCase()))return err(res,'Email already registered',409);const u={id:crypto.randomUUID(),name:name.trim().slice(0,60),email:email.toLowerCase(),password:hash(password),role:'user',premium:false};db.users.push(u);res.status(201).json(sessionFor(u));});
app.post('/api/login',(req,res)=>{const {email,password}=req.body||{};const u=db.users.find(u=>u.email===String(email||'').toLowerCase());if(!u||!verify(String(password||''),u.password))return err(res,'Invalid email or password',401);res.json(sessionFor(u));});
app.get('/api/me',auth,(req,res)=>res.json(safeUser(req.user)));
app.post('/api/logout',auth,(req,res)=>{const token=req.headers.authorization.replace(/^Bearer /,'');db.sessions=db.sessions.filter(s=>s.token!==token);save();res.json({ok:true});});
app.get('/api/anime',(req,res)=>res.json(db.anime.map(({episodes,...a})=>({...a,episodeCount:episodes.length}))));
app.get('/api/anime/:id',(req,res)=>{const a=db.anime.find(a=>a.id===req.params.id);if(!a)return err(res,'Not found',404);res.json({...a,episodes:a.episodes.map(({videoUrl,...e})=>e)});});
app.get('/api/anime/:id/episodes/:episodeId/play',auth,(req,res)=>{const a=db.anime.find(a=>a.id===req.params.id);const e=a?.episodes.find(e=>e.id===req.params.episodeId);if(!e)return err(res,'Episode not found',404);if((a.premium||e.premium)&&!req.user.premium)return err(res,'Premium membership required',403);if(!e.videoUrl)return err(res,'Video has not been uploaded yet',404);res.json({videoUrl:e.videoUrl,episode:e});});
app.get('/api/watchlist',auth,(req,res)=>res.json(db.watchlists[req.user.id]||[]));
app.post('/api/watchlist/:id',auth,(req,res)=>{if(!db.anime.some(a=>a.id===req.params.id))return err(res,'Anime not found',404);const list=db.watchlists[req.user.id]||[];db.watchlists[req.user.id]=list.includes(req.params.id)?list.filter(id=>id!==req.params.id):[...list,req.params.id];save();res.json(db.watchlists[req.user.id]);});
app.get('/api/progress',auth,(req,res)=>res.json(db.progress[req.user.id]||{}));
app.put('/api/progress/:episodeId',auth,(req,res)=>{const seconds=Number(req.body?.seconds);if(!Number.isFinite(seconds)||seconds<0)return err(res,'Invalid position');db.progress[req.user.id]??={};db.progress[req.user.id][req.params.episodeId]=Math.round(seconds);save();res.json({ok:true});});
function validAnime(body){return body&&typeof body.title==='string'&&body.title.trim()&&Array.isArray(body.genre)&&body.genre.every(g=>typeof g==='string')&&typeof body.description==='string';}
app.post('/api/admin/anime',auth,admin,(req,res)=>{if(!validAnime(req.body))return err(res,'Title, genres and description required');const b=req.body;const a={id:crypto.randomUUID(),title:b.title.trim().slice(0,120),genre:b.genre.slice(0,8).map(g=>g.slice(0,40)),year:Number(b.year)||2026,rating:String(b.rating||'N/A').slice(0,8),description:b.description.slice(0,1000),poster:String(b.poster||'').slice(0,2000),banner:String(b.banner||b.poster||'').slice(0,2000),featured:!!b.featured,premium:!!b.premium,episodes:[]};db.anime.push(a);save();res.status(201).json(a);});
app.delete('/api/admin/anime/:id',auth,admin,(req,res)=>{const old=db.anime.length;db.anime=db.anime.filter(a=>a.id!==req.params.id);if(db.anime.length===old)return err(res,'Not found',404);save();res.json({ok:true});});
app.post('/api/admin/anime/:id/episodes',auth,admin,(req,res)=>{const a=db.anime.find(a=>a.id===req.params.id);if(!a)return err(res,'Anime not found',404);const b=req.body||{};if(typeof b.title!=='string'||!b.title.trim()||typeof b.videoUrl!=='string')return err(res,'Episode title and video URL required');if(b.videoUrl&&!/^https:\/\//i.test(b.videoUrl))return err(res,'Use an HTTPS video URL');const e={id:crypto.randomUUID(),number:a.episodes.length+1,title:b.title.trim().slice(0,120),duration:String(b.duration||'24 min').slice(0,30),videoUrl:b.videoUrl.slice(0,2000),premium:!!b.premium};a.episodes.push(e);save();res.status(201).json(e);});
app.delete('/api/admin/anime/:id/episodes/:eid',auth,admin,(req,res)=>{const a=db.anime.find(a=>a.id===req.params.id);if(!a)return err(res,'Anime not found',404);a.episodes=a.episodes.filter(e=>e.id!==req.params.eid);save();res.json({ok:true});});
app.get('/api/health',(_req,res)=>res.json({ok:true}));
app.get('*',(_req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
app.use((error,req,res,next)=>{console.error(error);res.status(500).json({error:'Internal server error'});});
app.listen(PORT,()=>console.log(`ANIDEX running at http://localhost:${PORT}`));
