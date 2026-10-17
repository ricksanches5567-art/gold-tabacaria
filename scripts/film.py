import sys,subprocess,numpy as np
from PIL import Image
S='/workspace/gold-cat/crops/prod-{}.jpg'
def sm(x): x=min(max(x,0),1); return x*x*(3-2*x)
C={}
def L(k):
  if k not in C: C[k]=Image.open(S.format(k)).convert('RGB')
  return C[k]
def crop(im,z,dx,dy,W,H):
  sw,sh=im.size; ch=sh/z; cw=ch*W/H
  if cw>sw/z*1.0 and cw>sw: cw=sw; ch=cw*H/W
  x0=(sw-cw)/2+dx*(sw-cw)/2; y0=(sh-ch)/2+dy*(sh-ch)/2
  return np.asarray(im.transform((W,H),Image.AFFINE,(cw/W,0,x0,0,ch/H,y0),resample=Image.BICUBIC),dtype=np.float32)
def panel(seq,t,W,H,d=3.6,ov=1.0,phase=0.0):
  step=d-ov; T=len(seq)*step; t=(t+phase)%T; acc=0; ws=0
  for i,k in enumerate(seq):
    for off in (0,T,-T):
      u=t-i*step+off
      if -0.0<=u<=d:
        w=sm(u/ov) if u<ov else (sm((d-u)/ov) if u>d-ov else 1)
        p=u/d; z=1.0+0.12*p if i%2==0 else 1.12-0.12*p
        dx=(-0.3+0.6*p)*(1 if i%3 else -1)
        acc=acc+w*crop(L(k),z,dx,0.1-0.2*p,W,H); ws+=w
  return acc/max(ws,1e-6)
def run(out,W,H,cols,seqs,dur,fps=24):
  cmd=['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(fps),'-i','-','-vf','eq=contrast=1.08:saturation=0.92:brightness=-0.03,colorbalance=rs=.06:gs=.03:bs=-.1:rm=.07:gm=.03:bm=-.12:rh=.05:gh=.02:bh=-.08,vignette=PI/5,format=yuv420p','-c:v','libx264','-preset','medium','-crf','24','-movflags','+faststart','-an',out+'.mp4']
  p=subprocess.Popen(cmd,stdin=subprocess.PIPE)
  pw=W//cols; gap=6
  for f in range(int(dur*fps)):
    t=f/fps; fr=np.zeros((H,W,3),np.float32)+12
    for c in range(cols):
      x0=c*pw+(gap//2 if cols>1 else 0); w=pw-(gap if cols>1 else 0)
      fr[:,x0:x0+w]=panel(seqs[c],t,w,H,phase=c*0.9)
    p.stdin.write(np.clip(fr,0,255).astype(np.uint8).tobytes())
  p.stdin.close(); p.wait()
  subprocess.run(['ffmpeg','-v','error','-y','-i',out+'.mp4','-c:v','libvpx-vp9','-b:v','0','-crf','38','-row-mt','1','-an',out+'.webm'])
  subprocess.run(['ffmpeg','-v','error','-y','-ss','0.5','-i',out+'.mp4','-frames:v','1',out+'-poster.webp'])
m=['P4-05','P2-02','P8-04','P6-06','P2-07','P5-03','P2-01','P9-08']
if sys.argv[1]=='m': run('video/hero-m',720,1280,1,[m],len(m)*2.6)
else: run('video/hero-d',1280,720,3,[['P4-05','P2-01','P6-06','P8-04'],['P2-02','P5-06','P3-09','P6-01'],['P7-09','P9-08','P2-07','P4-03']],4*2.6)
