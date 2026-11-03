// もしもナビ紹介動画を作る（GitHub Actions用）。story.js の絵を30fpsで描いて ffmpeg でMP4に。
const {chromium}=require('playwright');const {spawn}=require('child_process');const path=require('path');
const out=process.argv[2]||'video.mp4';
(async()=>{const b=await chromium.launch();const p=await b.newPage();
await p.setContent('<canvas id=c width=1080 height=1920></canvas>');await p.addScriptTag({path:path.join(__dirname,'story.js')});
await p.evaluate(()=>document.fonts.ready);
const T=await p.evaluate(()=>STORY.TOTAL);const n=Math.round(T*30);
const ff=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate','30','-c:v','mjpeg','-i','-','-c:v','libx264','-preset','veryfast','-crf','20','-pix_fmt','yuv420p','-an',out]);
for(let i=0;i<n;i++){const d=await p.evaluate(t=>{const c=document.getElementById('c');STORY.draw(c.getContext('2d'),t);return c.toDataURL('image/jpeg',0.92)},i/30);ff.stdin.write(Buffer.from(d.split(',')[1],'base64'))}
ff.stdin.end();const code=await new Promise(r=>ff.on('close',r));await b.close();if(code)process.exit(code);console.log('frames',n,'sec',T)})();
