import sys, wave, numpy as np
def f0(path):
    w = wave.open(path); sr = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(float)
    fr = int(sr*0.04); out = []
    for i in range(0, len(x)-fr, fr//2):
        s = x[i:i+fr]; s = s - s.mean()
        if np.sqrt((s**2).mean()) < 800: continue
        ac = np.correlate(s, s, 'full')[fr-1:]
        lo, hi = int(sr/400), int(sr/70)
        k = lo + np.argmax(ac[lo:hi])
        if ac[k] > 0.4*ac[0]: out.append(sr/k)
    return np.median(out) if out else 0
for p in sys.argv[1:]: print(p, round(f0(p)))
