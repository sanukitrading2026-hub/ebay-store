import json,numpy as np,wave,sys
m=json.load(open('music.json'));SR=44100;beat=60/m['bpm'];T=float(sys.argv[2]) if len(sys.argv)>2 else 28.8
N=int(SR*T);L=np.zeros(N);R=np.zeros(N)
def note(start,midi,dur,vol,pan):
    f=440*2**((midi-69)/12);n=int(SR*min(dur+1.2,T-start));
    if n<=0:return
    t=np.arange(n)/SR
    w=(np.sin(2*np.pi*f*t)+0.35*np.sin(4*np.pi*f*t)+0.12*np.sin(6*np.pi*f*t))
    env=np.minimum(1,t/0.01)*np.exp(-t/(0.9 if midi>=67 else 1.6))
    s=int(SR*start);e=min(N,s+n);seg=(w*env*vol)[:e-s]
    L[s:e]+=seg*(1-pan);R[s:e]+=seg*pan
for i,b in enumerate(m['bars']):
    t0=i*4*beat
    if t0>=T:break
    for k,c in enumerate(b['chord']):note(t0+k*0.06,c,4*beat,0.10,0.4)
    note(t0+2*beat,b['chord'][0]-12,2*beat,0.08,0.5)
    for bt,mi,d in b['mel']:note(t0+bt*beat,mi,d*beat,0.16,0.6)
fade=np.ones(N);fl=int(SR*2.5);fade[-fl:]=np.linspace(1,0,fl);fade[:int(SR*0.3)]=np.linspace(0,1,int(SR*0.3))
x=np.stack([L,R],1)*fade[:,None];x/=np.abs(x).max()*1.25
with wave.open(sys.argv[1],'wb') as w:
    w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((x*32767).astype('<i2').tobytes())
print('bars',len(m['bars']),'needed sec',len(m['bars'])*4*beat)
