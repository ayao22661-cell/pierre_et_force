import json, os, sys, subprocess, difflib, re, unicodedata, torch, torchaudio as ta
S = sys.argv[1]; OUT = 'assets/audio/voix'
jobs = json.load(open(S + '/jobs.json')); cfg = json.load(open(S + '/voicecfg.json'))['voices']
from chatterbox.mtl_tts import ChatterboxMultilingualTTS
from faster_whisper import WhisperModel
torch.set_num_threads(4)
tts = ChatterboxMultilingualTTS.from_pretrained(device='cpu')
asr = WhisperModel('small', device='cpu', compute_type='int8')
FF = S + '/ff/ffmpeg'
BASEFX = "highpass=f=70,equalizer=f=160:t=q:w=1:g=4,equalizer=f=3000:t=q:w=1.5:g=3,acompressor=threshold=-20dB:ratio=4:attack=5:release=80:makeup=4"
def norm(s):
    s = unicodedata.normalize('NFD', s.lower()); s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return [NUM.get(t, t) for t in re.sub(r'[^a-z0-9 ]+', ' ', s).split()]
NUM = dict(zip('0 1 2 3 4 5 6 7 8 9 10 12 15 20 100'.split(), 'zero un deux trois quatre cinq six sept huit neuf dix douze quinze vingt cent'.split()))
log = open(S + '/voices_log.jsonl', 'a')
for n, j in enumerate(jobs):
    dst = f"{OUT}/{j['dir']}/{j['id']}.mp3"
    if os.path.exists(dst): continue
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    v = cfg[j['spk']]; ref = f"{S}/tts/spk_{v['ref']}.wav"
    best = None
    ref_toks = norm(j['text'])
    for take in range(3):
        torch.manual_seed(1000 * n + take)
        w = tts.generate(j['text'], language_id='fr', audio_prompt_path=ref, exaggeration=v['ex'], cfg_weight=v['cfg'], temperature=0.8)
        tmp = f"{S}/take_{take}.wav"; ta.save(tmp, w, tts.sr)
        segs, _ = asr.transcribe(tmp, language='fr', word_timestamps=True)
        toks = []   # (jeton normalisé, fin en s)
        for sg in segs:
            for wd in (sg.words or []):
                for t in norm(wd.word): toks.append((t, wd.end))
        hyp = [t for t, _ in toks]
        sm = difflib.SequenceMatcher(None, ref_toks, hyp)
        r = sm.ratio()
        # Fin de la phrase : dernier mot du texte reconnu. Tout ce qui suit
        # (mot répété, souffle, bredouillement) est coupé.
        blocks = [b for b in sm.get_matching_blocks() if b.size]
        cut = None
        if blocks:
            # Les mots de la fin mal reconnus comptent quand même : on en
            # garde autant après le dernier mot reconnu.
            missing = len(ref_toks) - (blocks[-1].a + blocks[-1].size)
            last = blocks[-1].b + blocks[-1].size - 1 + missing
            if missing <= 2 and last < len(hyp) - 1: cut = toks[last][1] + 0.3
        extra = max(0, len(hyp) - len(ref_toks)) if cut is None else 0
        score = r - 0.1 * extra
        if not best or score > best[0]: best = (score, tmp, ' '.join(hyp), cut)
        if score >= 0.85: break
    p = v['pitch']
    af = f"asetrate={tts.sr}*{p},aresample=24000,atempo={1/p:.4f}," + BASEFX + (',' + v['fx'] if v['fx'] else '') + ",alimiter=limit=0.95,silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse"
    trim = ['-t', f"{best[3]:.2f}"] if best[3] else []
    subprocess.run([FF, '-loglevel', 'error', '-y', *trim, '-i', best[1], '-af', af, '-ar', '24000', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '32k', dst], check=True)
    log.write(json.dumps({'id': j['id'], 'spk': j['spk'], 'score': round(best[0], 3), 'text': j['text'], 'asr': best[2], 'cut': best[3]}, ensure_ascii=False) + '\n'); log.flush()
    print(n, j['id'], round(best[0], 2), flush=True)
