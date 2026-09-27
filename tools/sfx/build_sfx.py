#!/usr/bin/env python3
# ============================================================
# BRUITAGES DE COMBAT — fabrication en couches.
#
# Un son de jeu d'action n'est jamais un seul échantillon : c'est une
# pile de couches, chacune pour une sensation.
#   • l'attaque (transitoire) : le « clac » qui dit « ça touche » ;
#   • le corps (grave) : le poids du coup, dans la poitrine ;
#   • la matière : métal qui sonne, tissu, poussière ;
#   • l'air : le souffle de l'élan avant ou après ;
#   • la queue : une réverbération courte qui place le son dans l'espace.
# Ce script part des échantillons libres (dossier sources, voir
# assets/audio/CREDITS.md), ajoute les couches synthétiques (graves,
# souffles, résonances métalliques, réverbération stéréo) et écrit les
# fichiers de assets/audio/sfx/.
#
# Usage : python3 tools/sfx/build_sfx.py <dossier_sources> <ffmpeg>
# ============================================================
import os, sys, subprocess, tempfile, glob
import numpy as np
from scipy import signal

SR = 44100
SRC, FF = sys.argv[1], sys.argv[2]
OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'assets', 'audio', 'sfx')
ORIG = os.path.join(SRC, 'orig')        # anciens bruitages du jeu (couche d'attaque)
rng = np.random.default_rng(7)

# ── Entrées / sorties ───────────────────────────────────────
def load(path):
    raw = subprocess.run([FF, '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)

def rms(x, d=0.3):
    """Intensité du passage le plus fort (fenêtre de d secondes)."""
    n = int(d * SR)
    if len(x) <= n: return np.sqrt(np.mean(x ** 2)) or 1e-9
    c = np.cumsum(np.concatenate([[0], x ** 2]))
    return np.sqrt(np.max(c[n:] - c[:-n]) / n) or 1e-9

def save(name, st, maxd=None):
    st = np.asarray(st)
    if st.ndim == 1: st = np.stack([st, st], 1)
    # Fin : on coupe la queue quand elle passe sous −55 dB.
    env = np.max(np.abs(st), 1); keep = np.where(env > 10 ** (-48 / 20) * env.max())[0]
    st = st[:keep[-1] + int(0.03 * SR)] if len(keep) else st
    if maxd and len(st) > maxd * SR:                        # durée plafonnée, fondu de sortie
        st = st[:int(maxd * SR)].copy(); f = int(min(0.4, maxd / 3) * SR)
        st[-f:] *= np.linspace(1, 0, f)[:, None] ** 2
    # Volume : même intensité que l'ancien son de même nom (le mixage du
    # jeu reste juste), crêtes arrondies par un limiteur doux.
    ref = os.path.join(ORIG, name + '.mp3')
    target = rms(trim(load(ref))) if os.path.exists(ref) else 0.2
    st = st * (target * 1.12 / rms(st.mean(1)))
    st = np.tanh(st / 0.95) * 0.95 if np.max(np.abs(st)) > 0.95 else st
    st *= min(1, 0.89 / (np.max(np.abs(st)) or 1))          # crête à −1 dBFS au plus
    n = int(0.004 * SR); st[-n:] *= np.linspace(1, 0, n)[:, None]
    with tempfile.NamedTemporaryFile(suffix='.f32') as f:
        f.write(st.astype(np.float32).tobytes()); f.flush()
        subprocess.run([FF, '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', f.name,
                        '-c:a', 'libmp3lame', '-b:a', '128k', os.path.join(OUT, name + '.mp3')], check=True)

# ── Briques ─────────────────────────────────────────────────
def t_(d): return np.arange(int(d * SR)) / SR
def pad(x, n): return np.pad(x, (0, max(0, n - len(x))))[:n] if len(x) < n else x
def mix(*parts):
    """parts : (signal, départ en s, gain)."""
    n = max(int(s * SR) + len(x) for x, s, g in parts)
    out = np.zeros(n)
    for x, s, g in parts:
        i = int(s * SR); out[i:i + len(x)] += x * g
    return out
def norm(x): return x / (np.max(np.abs(x)) or 1)
def bp(x, lo, hi, o=2): return signal.sosfilt(signal.butter(o, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def lp(x, f, o=2): return signal.sosfilt(signal.butter(o, f, 'lowpass', fs=SR, output='sos'), x)
def hp(x, f, o=2): return signal.sosfilt(signal.butter(o, f, 'highpass', fs=SR, output='sos'), x)
def sat(x, k=2.0): return np.tanh(x * k) / np.tanh(k)
def noise(d): return rng.standard_normal(int(d * SR))
def expenv(d, tau, att=0.002):
    t = t_(d); e = np.exp(-t / tau)
    a = int(att * SR); e[:a] *= np.linspace(0, 1, a) if a else 1
    return e
def trim(x, thr=0.002):
    idx = np.where(np.abs(x) > thr * np.max(np.abs(x)))[0]
    return x[idx[0]:idx[-1] + 1] if len(idx) else x
def repitch(x, k):
    """Change hauteur et durée ensemble (k > 1 : plus aigu, plus court)."""
    n = int(len(x) / k)
    return signal.resample(x, n) if n > 8 else x

def thump(f0, f1, d, tau, drive=2.5):
    """Le corps d'un impact : une sinusoïde qui plonge, saturée."""
    t = t_(d); f = f1 + (f0 - f1) * np.exp(-t / (d / 4))
    ph = 2 * np.pi * np.cumsum(f) / SR
    return sat(np.sin(ph) * expenv(d, tau, 0.001), drive)

def crack(d=0.025, f=2500):
    """Claquement : bruit très court, filtré aigu."""
    return hp(noise(d), f) * expenv(d, d / 4, 0.0005)

def whoosh(d, f0, f1, peak=0.45, q=0.6):
    """Souffle : bruit passé dans un filtre qui glisse de f0 à f1."""
    # Filtre à variables d'état (passe-bande), fréquence mise à jour à
    # chaque échantillon : glissement continu, sans clic.
    x = noise(d); out = np.zeros_like(x); low = band = 0.0
    fc = f0 * (f1 / f0) ** np.linspace(0, 1, len(x))
    F = 2 * np.sin(np.pi * np.minimum(fc, SR / 6) / SR); Q = 1 / max(q, 0.1) * 0.5
    for i in range(len(x)):
        high = x[i] - low - band / Q
        band += F[i] * high; low += F[i] * band
        out[i] = band
    t = np.linspace(0, 1, len(x))
    env = np.where(t < peak, (t / peak) ** 2, ((1 - t) / (1 - peak)) ** 1.5)
    return out * env

def ring(freqs, d, tau, amp=None):
    """Résonance métallique : partiels inharmoniques qui s'éteignent."""
    t = t_(d); x = np.zeros_like(t)
    for i, f in enumerate(freqs):
        a = amp[i] if amp else 1 / (i + 1)
        x += a * np.sin(2 * np.pi * f * t + rng.uniform(0, 6)) * np.exp(-t / (tau * (1 - i * 0.12)))
    return x * expenv(d, 10, 0.0008)

def reverb(x, size=0.6, wet=0.2, damp=4000, pre=0.012):
    """Réverbération stéréo : deux réponses décorrélées (bruit qui décroît)."""
    outs = []
    for ch in range(2):
        ir = lp(noise(size), damp) * np.exp(-t_(size) / (size / 5))
        ir = np.concatenate([np.zeros(int(pre * SR) + ch * 37), ir]); ir /= np.sqrt(np.sum(ir ** 2))
        w = signal.fftconvolve(x, ir)[:len(x) + len(ir)]
        outs.append(w)
    n = max(len(o) for o in outs); dry = pad(x, n)
    L = dry + wet * pad(outs[0], n) * 1.6; R = dry + wet * pad(outs[1], n) * 1.6
    return np.stack([L, R], 1)

def orig(name): return trim(norm(load(os.path.join(ORIG, name + '.mp3'))))

# ── Sources libres ──────────────────────────────────────────
RPG = os.path.join(SRC, 'rpg', 'RPG Sound Pack')
FAN = os.path.join(SRC, 'fantasy', 'Fantasy Sound Library', 'Wav')
swings = [trim(norm(load(os.path.join(RPG, 'battle', f)))) for f in ('swing.wav', 'swing2.wav', 'swing3.wav')]
spells = [trim(norm(load(os.path.join(FAN, f'Spell_0{i}.wav')))) for i in range(5)]
dirt = [trim(norm(load(p))) for p in sorted(glob.glob(os.path.join(FAN, 'Footsteps', 'Footstep_Dirt_0*.wav')))]
cloth = trim(norm(load(os.path.join(RPG, 'inventory', 'cloth-heavy.wav'))))

# ═══ Élan (le souffle d'un coup porté) ═══
for i in range(8):
    d = 0.16 + 0.03 * (i % 4)
    w = whoosh(d, 350 + 60 * i, 2400 - 120 * i, peak=0.55, q=0.7)
    s = repitch(swings[i % 3], 1.0 + 0.06 * (i - 3.5))
    save(f'elan_{i+1}', reverb(norm(mix((w, 0, 0.8), (s, 0.0, 0.7))), 0.25, 0.08))

# ═══ Coup léger : claque + corps + petite pièce ═══
for i in range(5):
    a = orig(f'coup_leger_{i+1}')
    body = thump(140 + 12 * i, 55, 0.14, 0.045, 3)
    x = mix((crack(0.02, 2800), 0, 0.35), (a, 0.0, 0.8), (body, 0.002, 0.9),
            (lp(noise(0.12), 900) * expenv(0.12, 0.03), 0.004, 0.18))
    save(f'coup_leger_{i+1}', reverb(norm(x), 0.35, 0.11, 5000))

# ═══ Coup lourd : claque, gros corps, débris, grande queue ═══
for i in range(5):
    a = orig(f'coup_lourd_{i+1}')
    body = thump(110 - 6 * i, 34, 0.42, 0.13, 3.5)
    debris = lp(noise(0.45), 1600) * expenv(0.45, 0.11)
    x = mix((crack(0.03, 2000), 0, 0.5), (a, 0.0, 0.75), (body, 0.0, 1.0), (debris, 0.01, 0.22))
    save(f'coup_lourd_{i+1}', reverb(norm(sat(norm(x), 1.4)), 0.9, 0.2, 3500))

# ═══ Lame : tranchant + métal qui chante + corps ═══
for i in range(6):
    a = orig(f'lame_{i+1}')
    slice_ = hp(whoosh(0.09, 3000, 7000, 0.3, 0.5), 2500)
    metal = ring([1870 + 90 * i, 3120 + 70 * i, 4410, 6230 - 60 * i], 0.5, 0.16)
    x = mix((slice_, 0, 0.5), (a, 0.02, 0.8), (metal, 0.025, 0.16), (thump(120, 60, 0.1, 0.03, 2), 0.022, 0.5))
    save(f'lame_{i+1}', reverb(norm(x), 0.5, 0.13, 7000))

# ═══ Garde : choc sur le bouclier, métal plus grave, sourd ═══
for i in range(5):
    a = orig(f'garde_{i+1}')
    metal = ring([980 + 40 * i, 1610, 2540 + 50 * i, 3900], 0.7, 0.2)
    x = mix((a, 0, 0.8), (metal, 0.0, 0.22), (thump(100, 48, 0.2, 0.06, 3), 0.0, 0.8), (crack(0.015, 3500), 0, 0.3))
    save(f'garde_{i+1}', reverb(norm(x), 0.6, 0.15, 5000))

# ═══ Esquive : souffle rapide + tissu ═══
for i in range(4):
    w = whoosh(0.26 + 0.03 * i, 1600 - 150 * i, 280, peak=0.35, q=0.8)
    c = repitch(cloth, 1.1 + 0.08 * i)
    save(f'esquive_{i+1}', reverb(norm(mix((w, 0, 0.9), (c, 0.02, 0.35))), 0.3, 0.07))

# ═══ Chute : corps qui tombe, poussière ═══
for i in range(4):
    a = orig(f'chute_{i+1}')
    dust = lp(noise(0.5), 700) * expenv(0.5, 0.14, 0.01)
    x = mix((thump(85, 38, 0.3, 0.09, 3), 0, 1.0), (a, 0.0, 0.6), (dirt[(2 * i) % len(dirt)], 0.01, 0.5), (dust, 0.02, 0.25),
            (thump(70, 40, 0.18, 0.05, 2), 0.13, 0.35))              # le rebond du corps
    save(f'chute_{i+1}', reverb(norm(x), 0.5, 0.12, 3000))

# ═══ Impact au sol : grondement, souffle, débris ═══
for i in range(3):
    a = orig(f'impact_sol_{i+1}')
    boom = thump(75 - 5 * i, 24, 1.1, 0.35, 4)
    rumble = lp(noise(1.4), 180) * expenv(1.4, 0.4, 0.01)
    debris = mix(*[(dirt[(i + k) % len(dirt)], 0.05 + 0.09 * k, 0.4 / (k + 1)) for k in range(4)])
    x = mix((crack(0.04, 1500), 0, 0.5), (boom, 0, 1.0), (rumble, 0, 0.6), (a, 0, 0.5), (debris, 0.02, 0.5))
    save(f'impact_sol_{i+1}', reverb(norm(sat(norm(x), 1.5)), 1.4, 0.22, 2500), 1.8)

# ═══ Sort : les sorts de la bibliothèque fantasy + souffle ═══
for i in range(4):
    sp = spells[i]
    w = whoosh(0.35, 500, 3000, 0.7, 0.8)
    save(f'sort_{i+1}', reverb(norm(mix((w, 0, 0.35), (sp, 0.05, 1.0))), 0.9, 0.18, 6000), 1.3)

# ═══ Ultime : montée, silence d'un souffle, déflagration, éclat ═══
for i in range(2):
    rise = whoosh(0.9, 250, 5000, 0.92, 0.9)
    tone = np.sin(2 * np.pi * np.cumsum(np.linspace(180, 720, int(0.9 * SR))) / SR) * np.linspace(0, 1, int(0.9 * SR)) ** 2
    boom = thump(70, 22, 1.8, 0.55, 4.5)
    rumble = lp(noise(2.2), 160) * expenv(2.2, 0.7, 0.01)
    shine = spells[4 - i]
    x = mix((rise, 0, 0.55), (tone, 0, 0.12), (crack(0.05, 1200), 0.92, 0.7), (boom, 0.92, 1.0),
            (rumble, 0.92, 0.55), (shine, 0.95, 0.45), (orig('ultime_1'), 0.92, 0.35))
    save(f'ultime_{i+1}', reverb(norm(sat(norm(x), 1.3)), 2.0, 0.25, 4000), 3.4)

# ═══ Élimination : souffle qui plonge, coup grave, dissipation ═══
for i in range(3):
    a = orig(f'elimination_{i+1}')
    fall = whoosh(0.45, 2200, 180, 0.2, 0.8)
    x = mix((a, 0, 0.7), (thump(90, 30, 0.6, 0.2, 3), 0, 0.9), (fall, 0.02, 0.5),
            (repitch(spells[i], 0.7), 0.05, 0.25))
    save(f'elimination_{i+1}', reverb(norm(x), 1.0, 0.2, 3000), 1.6)

print('ok')
