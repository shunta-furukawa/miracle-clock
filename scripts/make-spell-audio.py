"""Original deterministic spell sound; no third-party samples. Needs numpy and ffmpeg."""
import numpy as np, wave, subprocess, tempfile
from pathlib import Path
rate=44100; length=1.35; t=np.arange(int(rate*length))/rate
stereo=np.zeros((len(t),2)); rng=np.random.default_rng(42)
def add(signal,pan=0):
 stereo[:,0][:]+=signal*np.sqrt((1-pan)/2)
 stereo[:,1][:]+=signal*np.sqrt((1+pan)/2)
# Soft resonant impact; no sharp click.
env=(1-np.exp(-t/0.006))*np.exp(-t/0.10)
add(.38*np.sin(2*np.pi*(110*t+12*(1-np.exp(-t*18))))*env)
# Breath of rising magic, band-limited noise with a gently rising tone.
noise=rng.normal(0,1,len(t)); noise=np.convolve(noise,np.ones(9)/9,mode='same')
swell=np.sin(np.pi*np.clip(t/.34,0,1))**2
add(.12*noise*swell+.12*np.sin(2*np.pi*(330*t+850*t*t))*swell)
# Bright major-pentatonic crystal arpeggio, rounded attacks and stereo spread.
for i,freq in enumerate([659.255,830.609,987.767,1318.51,1661.219,1975.533]):
 u=np.maximum(0,t-(.055+i*.065)); gate=t>=(.055+i*.065)
 e=(1-np.exp(-u/.004))*np.exp(-u/(.22+i*.025))*gate
 bell=np.sin(2*np.pi*freq*u)+.22*np.sin(2*np.pi*freq*2.01*u)*np.exp(-u*12)
 add(.17*bell*e,(-1 if i%2 else 1)*.45)
# A short, diffuse stereo echo tail, not a long blocking jingle.
dry=stereo.copy()
for delay,gain in [(.071,.16),(.113,.12),(.179,.08),(.257,.05)]:
 n=int(delay*rate);stereo[n:]+=dry[:-n,::-1]*gain
fade=np.clip((length-t)/.18,0,1);stereo*=fade[:,None]
stereo*=.78/np.max(np.abs(stereo))
with tempfile.TemporaryDirectory() as tmp:
 wav=Path(tmp)/'spell.wav'
 with wave.open(str(wav),'wb') as out:
  out.setnchannels(2);out.setsampwidth(2);out.setframerate(rate);out.writeframes((stereo*32767).astype('<i2').tobytes())
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(wav),'-codec:a','libmp3lame','-b:a','128k','src/assets/audio/spell.mp3'],check=True)
