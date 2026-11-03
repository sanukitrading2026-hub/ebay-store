// もしもナビ 共感ストーリー動画 v2（1080x1920）。window.STORY.draw(ctx, t) で t秒の絵を描く。
(function(){
const W=1080,H=1920,F="'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP','Noto Sans CJK JP',sans-serif";
const C={bg:'#f6f1e7',ink:'#2b2b2b',sub:'#6b6b6b',red:'#b3261e',skin:'#f2c9a5',hair:'#3b2e2a',shirt:'#5b7fa6',paper:'#ffffff',line:'#d9d2c3',tbl:'#c8a27a'};
// 場面（秒）
const SC=[
 {d:3.6, k:'phone', t:'突然の知らせ。', s:'悲しむ間もなく…'},
 {d:3.8, k:'papers', t:'「何を、いつまでに？」', s:'役所・年金・税金・登記…'},
 {d:3.2, k:'deadline', due:'7日以内', n:'死亡届', law:'戸籍法 第86条'},
 {d:3.2, k:'deadline', due:'3か月以内', n:'相続放棄・限定承認', law:'民法 第915条'},
 {d:3.2, k:'deadline', due:'10か月以内', n:'相続税の申告・納付', law:'相続税法 第27条'},
 {d:3.2, k:'deadline', due:'3年以内', n:'相続登記', law:'不動産登記法 第76条の2'},
 {d:4.0, k:'relief', t:'質問に答えるだけで', s:'あなたに必要な手続きを\n期限の近い順に'},
 {d:4.6, k:'cta'}
];
const TOTAL=SC.reduce((a,s)=>a+s.d,0);
function ease(x){return x<0?0:x>1?1:(1-Math.cos(Math.PI*x))/2}
function wrap(x,t,mw){const L=[];for(const p of t.split('\n')){let c='';for(const ch of p){if(x.measureText(c+ch).width>mw&&c){L.push(c);c=ch}else c+=ch}L.push(c)}return L}
function text(x,t,size,y,col,wt=900,mw=W-160,lh=1.35){x.font=`${wt} ${size}px ${F}`;x.fillStyle=col;x.textAlign='center';x.textBaseline='top';const L=wrap(x,t,mw);for(const l of L){x.fillText(l,W/2,y);y+=size*lh}return y}
function rr(x,a,b,w,h,r,fill,stroke){x.beginPath();x.roundRect(a,b,w,h,r);if(fill){x.fillStyle=fill;x.fill()}if(stroke){x.strokeStyle=stroke;x.lineWidth=4;x.stroke()}}
// 人物（オリジナル）。mood: sad / worried / relief
function person(x,cx,cy,mood,tt,opt={}){
 const bob=Math.sin(tt*2)*4;cy+=bob;
 // 体
 x.fillStyle=C.shirt;x.beginPath();x.roundRect(cx-150,cy+120,300,330,[120,120,30,30]);x.fill();
 // 首
 x.fillStyle=C.skin;x.fillRect(cx-28,cy+90,56,50);
 // 頭
 x.beginPath();x.arc(cx,cy,120,0,Math.PI*2);x.fill();
 // 髪
 x.fillStyle=C.hair;x.beginPath();x.arc(cx,cy-20,124,Math.PI*1.05,Math.PI*1.95);x.lineTo(cx+118,cy-10);x.quadraticCurveTo(cx,cy-70,cx-118,cy-10);x.closePath();x.fill();
 // 目・眉・口
 x.strokeStyle=C.ink;x.fillStyle=C.ink;x.lineWidth=7;x.lineCap='round';
 const ey=cy+10;
 if(mood==='relief'){ // にっこり
  for(const s of[-1,1]){x.beginPath();x.arc(cx+s*45,ey+6,16,Math.PI*1.1,Math.PI*1.9);x.stroke()}
  x.beginPath();x.arc(cx,cy+50,34,Math.PI*0.15,Math.PI*0.85);x.stroke();
  x.fillStyle='rgba(230,120,110,.35)';for(const s of[-1,1]){x.beginPath();x.ellipse(cx+s*75,cy+45,22,12,0,0,Math.PI*2);x.fill()}
 }else{
  for(const s of[-1,1]){x.beginPath();x.arc(cx+s*45,ey,9,0,Math.PI*2);x.fill();
   x.beginPath();x.moveTo(cx+s*25,ey-38+(mood==='sad'?-6:0));x.lineTo(cx+s*68,ey-30-(mood==='sad'?10:16));x.stroke()}
  x.beginPath();if(mood==='sad'){x.arc(cx,cy+78,26,Math.PI*1.15,Math.PI*1.85)}else{x.moveTo(cx-24,cy+62);x.quadraticCurveTo(cx-8,cy+52,cx+4,cy+62);x.quadraticCurveTo(cx+14,cy+70,cx+26,cy+60)}x.stroke();
  if(mood==='sad'){const ty=(tt*60)%80;x.fillStyle='rgba(120,170,220,.85)';x.beginPath();x.ellipse(cx-50,ey+30+ty,8,13,0,0,Math.PI*2);x.fill()}
  if(mood==='worried'){x.fillStyle='rgba(120,170,220,.9)';x.beginPath();x.ellipse(cx+110,cy-60+Math.sin(tt*3)*6,12,20,0.3,0,Math.PI*2);x.fill()}
 }
 // 腕
 x.strokeStyle=C.skin;x.lineWidth=46;x.lineCap='round';
 if(opt.phone){x.beginPath();x.moveTo(cx+120,cy+190);x.lineTo(cx+60,cy+90);x.stroke();rr(x,cx+20,cy+20,70,120,14,'#222');rr(x,cx+28,cy+30,54,96,8,'#9fd3ff')}
 else if(opt.head){for(const s of[-1,1]){x.beginPath();x.moveTo(cx+s*130,cy+190);x.lineTo(cx+s*120,cy-40);x.stroke()}}
 else if(opt.hold){x.beginPath();x.moveTo(cx-130,cy+200);x.lineTo(cx-40,cy+260);x.stroke();x.beginPath();x.moveTo(cx+130,cy+200);x.lineTo(cx+40,cy+260);x.stroke();rr(x,cx-90,cy+180,180,260,14,C.paper,C.line);x.fillStyle=C.red;for(let i=0;i<5;i++){x.fillRect(cx-70,cy+210+i*45,22,22);x.fillStyle=C.line;x.fillRect(cx-36,cy+216+i*45,100,10);x.fillStyle=C.red}}
}
function table(x){x.fillStyle=C.tbl;x.fillRect(0,1500,W,40);x.fillStyle='#b48d66';x.fillRect(0,1540,W,380)}
function header(x){x.font=`400 38px ${F}`;x.fillStyle=C.sub;x.textAlign='center';x.textBaseline='top';x.fillText('家族の「もしも」手続きナビ',W/2,110)}
function draw(x,t){
 if(t<0)t=0;if(t>=TOTAL)t=TOTAL-0.001;
 let a=0,i=0;while(i<SC.length-1&&t>=a+SC[i].d){a+=SC[i].d;i++}
 const s=SC[i],lt=t-a,fade=Math.min(1,lt/0.3,(s.d-lt)/0.3);
 x.globalAlpha=1;x.fillStyle=C.bg;x.fillRect(0,0,W,H);x.globalAlpha=Math.max(0,fade);
 header(x);
 if(s.k==='phone'){table(x);person(x,W/2,980,'sad',lt,{phone:true});text(x,s.t,96,300,C.ink);text(x,s.s,60,450,C.sub,700)}
 else if(s.k==='papers'){table(x);person(x,W/2,1020,'worried',lt,{head:true});
  const labels=['死亡届','年金','保険証','税金','登記','銀行','遺言書','携帯'];
  labels.forEach((L,j)=>{const p=ease((lt-j*0.18)/0.6);if(p<=0)return;const px=120+(j%4)*230,py=560+Math.floor(j/4)*170;x.save();x.translate(px+90,py-200*(1-p)+60);x.rotate((j%2?1:-1)*0.08);rr(x,-90,-60,180,120,10,C.paper,C.line);x.font=`700 34px ${F}`;x.fillStyle=C.ink;x.textAlign='center';x.textBaseline='middle';x.fillText(L,0,0);x.restore()});
  text(x,s.t,74,260,C.ink,900,W-80);text(x,s.s,52,390,C.sub,700)}
 else if(s.k==='deadline'){
  text(x,'期限のある手続き',56,260,C.sub,700);
  rr(x,90,420,W-180,760,40,'#fff',C.line);
  let sz=150;x.font=`900 ${sz}px ${F}`;while(x.measureText(s.due).width>W-240){sz-=6;x.font=`900 ${sz}px ${F}`}
  const pop=0.85+0.15*ease(lt/0.4);x.save();x.translate(W/2,560);x.scale(pop,pop);x.font=`900 ${sz}px ${F}`;x.fillStyle=C.red;x.textAlign='center';x.textBaseline='top';x.fillText(s.due,0,0);x.restore();
  text(x,s.n,76,800,C.ink);
  text(x,'根拠：'+s.law+'（2026年11月確認）',34,1060,C.sub,400);
  person(x,W/2,1480,'worried',lt,{});
 }
 else if(s.k==='relief'){table(x);person(x,W/2,1000,'relief',lt,{hold:true});text(x,s.t,84,250,C.red);text(x,s.s,60,380,C.ink,700)}
 else if(s.k==='cta'){
  text(x,'家族の「もしも」\n手続きナビ（無料）',92,420,C.red);
  text(x,'期限は法律の条文で確かめ、\n根拠を表示しています',52,760,C.ink,700);
  rr(x,120,1000,W-240,200,24,'#fff',C.line);
  text(x,'sanukitrading2026-hub.github.io\n/ebay-store/moshimo/',44,1040,C.ink,700);
  text(x,'※一般的な情報です。詳しくは各窓口・専門家へ',36,1320,C.sub,400);
 }
 x.globalAlpha=1;
}
window.STORY={W,H,TOTAL,draw};
})();
