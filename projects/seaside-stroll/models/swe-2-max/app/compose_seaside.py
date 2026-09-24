"""Seaside Stroll - an anime-style piece composed in code.

Writes an original MIDI file (Format 1, pure-Python encoder, no MIDI
libraries) and renders it to MP3 with a NumPy-based synthesizer: each
General MIDI part gets a simple additive/percussive instrument, a
synthetic hall (FFT convolution with a decaying-noise impulse response)
glues the mix, and a quiet surf ambience sits underneath. ffmpeg encodes
the final WAV to MP3.

Run:  python compose_seaside.py   (needs numpy and ffmpeg on PATH)
Outputs: seaside_stroll.mid, seaside_stroll.mp3 (next to this file)
"""

import math
import os
import struct
import subprocess
import tempfile

import numpy as np

# --------------------------------------------------------------------------
# Composition
# --------------------------------------------------------------------------

TPQ = 480            # MIDI ticks per quarter note
BPM = 96             # base tempo
SR = 44100           # audio sample rate
BEATS_PER_BAR = 4

# Chord chart, one chord per bar, 40 bars.
#   intro | A | A' | B bridge | A'' | outro
#   A sections lean on the IV-V-iii-vi "royal road" flavour.
CHORDS = (
    ["G", "C", "G", "D"] +
    ["C", "D", "Bm", "Em", "C", "D", "G", "G"] +
    ["C", "D", "Bm", "Em", "C", "D", "Em", "D"] +
    ["Am", "D", "Bm", "Em", "Am", "D", "C", "D"] +
    ["C", "D", "Bm", "Em", "C", "D", "G", "G"] +
    ["C", "D", "G", "G"]
)
assert len(CHORDS) == 40

CHORD_TONES = {
    "G":  [55, 59, 62],   # G3 B3 D4
    "C":  [60, 64, 67],   # C4 E4 G4
    "D":  [62, 66, 69],   # D4 F#4 A4
    "Bm": [59, 62, 66],   # B3 D4 F#4
    "Em": [59, 64, 67],   # B3 E4 G4
    "Am": [60, 64, 69],   # C4 E4 A4
}
CHORD_ROOT = {"G": 43, "C": 48, "D": 50, "Bm": 47, "Em": 52, "Am": 45}
G_MAJOR = {0, 2, 4, 5, 7, 9, 11}  # pitch classes


def n(name):
    """Note name like 'F#5' or 'Bb3' -> MIDI number."""
    pc = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}[name[0]]
    i = 1
    if name[i] == "#":
        pc += 1
        i += 1
    elif name[i] == "b":
        pc -= 1
        i += 1
    return pc + 12 * (int(name[i:]) + 1)


def diatonic_third_below(pitch):
    """Note a third below `pitch`, staying inside G major."""
    for cand in range(pitch - 3, pitch - 5, -1):
        if (cand - 7) % 12 in G_MAJOR:
            return cand
    return pitch - 4


# Flute melody, one list per bar: (note name or None for rest, beats).
A_THEME = [
    [("B4", 1), ("D5", 1), ("G5", 2)],
    [("A5", 1), ("G5", 1), ("F#5", 2)],
    [("F#5", 1), ("G5", .5), ("F#5", .5), ("E5", 1), ("D5", 1)],
    [("E5", 3), (None, 1)],
    [("E5", 1), ("G5", 1), ("C6", 2)],
    [("B5", 1), ("A5", 1), ("G5", 2)],
    [("F#5", .5), ("G5", .5), ("A5", 1), ("B5", 1), ("A5", 1)],
    [("G5", 4)],
]
A_PRIME = [
    [("B4", 1), ("D5", 1), ("G5", 2)],
    [("A5", 1), ("B5", 1), ("A5", 2)],
    [("B4", 1), ("D5", 1), ("F#5", 2)],
    [("G5", 2), ("E5", 2)],
    [("E5", 1), ("G5", 1), ("C6", 2)],
    [("D6", 1), ("B5", 1), ("G5", 2)],
    [("A5", 1), ("G5", 1), ("F#5", 1), ("E5", 1)],
    [("F#5", 2), ("D5", 2)],
]
B_THEME = [
    [("A5", .5), ("C6", .5), ("B5", .5), ("A5", .5), ("G5", 1), ("A5", 1)],
    [("F#5", .5), ("A5", .5), ("G5", .5), ("F#5", .5), ("E5", 1), ("D5", 1)],
    [("B4", 1), ("D5", 1), ("F#5", 2)],
    [("G5", 1), ("E5", 1), ("B4", 2)],
    [("C5", .5), ("E5", .5), ("A5", 1), ("C6", 1), ("B5", 1)],
    [("A5", .5), ("B5", .5), ("A5", .5), ("G5", .5), ("F#5", 1), ("E5", 1)],
    [("E5", 1), ("G5", 1), ("C6", 2)],
    [("D6", 1), ("C6", .5), ("B5", .5), ("A5", 1), ("G5", 1)],
]
OUTRO_MELODY = [
    [("G5", 1), ("E5", 1), ("D5", 2)],
    [("C5", 1), ("D5", 1), ("B4", 2)],
    [("G5", 4)],
    [(None, 4)],
]
MELODY_BARS = [[]] * 4 + A_THEME + A_PRIME + B_THEME + A_THEME + OUTRO_MELODY


def section_boost(bar):
    """Velocity lift per section: quiet intro/outro, bridge climax."""
    if bar < 4:
        return -8
    if 20 <= bar < 28:
        return +8      # bridge
    if 28 <= bar < 36:
        return +4      # final chorus
    if bar >= 36:
        return -10     # outro
    return 0


# Tempo map: (beat, bpm). Rallentando across the last two bars.
TEMPO_MAP = [(0.0, BPM)]
for i, bpm in enumerate([94, 90, 86, 81, 76, 70, 64, 58]):
    TEMPO_MAP.append((4 * 38 + i, bpm))   # bars 39-40
SONG_BEATS = 4 * 40


def beat_to_seconds(beat):
    """Piecewise-constant tempo map -> absolute seconds."""
    t = 0.0
    bounds = TEMPO_MAP[1:] + [(float("inf"), 0)]
    for (b0, bpm), (b1, _) in zip(TEMPO_MAP, bounds):
        if beat <= b0:
            break
        t += (min(beat, b1) - b0) * 60.0 / bpm
        if beat <= b1:
            break
    return t


# --------------------------------------------------------------------------
# MIDI writer (Format 1, no dependencies)
# --------------------------------------------------------------------------

def vlq(value):
    out = [value & 0x7F]
    value >>= 7
    while value:
        out.append(0x80 | (value & 0x7F))
        value >>= 7
    return bytes(reversed(out))


def build_track(events):
    """events: (tick, sort_order, payload_bytes) -> MTrk chunk."""
    events.sort(key=lambda e: (e[0], e[1]))
    data = bytearray()
    last = 0
    for tick, _, payload in events:
        data += vlq(tick - last)
        data += payload
        last = tick
    data += vlq(0) + b"\xFF\x2F\x00"
    return b"MTrk" + struct.pack(">I", len(data)) + bytes(data)


def write_midi(path, tracks):
    out = bytearray(b"MThd" + struct.pack(">IHHH", 6, 1, len(tracks), TPQ))
    for ev in tracks:
        out += build_track(ev)
    with open(path, "wb") as f:
        f.write(out)


def midi_tempo(bpm):
    us = round(60_000_000 / bpm)
    return b"\xFF\x51\x03" + us.to_bytes(3, "big")


# --------------------------------------------------------------------------
# Score -> note list: (start_beats, dur_beats, pitch, velocity)
# --------------------------------------------------------------------------

def collect_notes():
    parts = {k: [] for k in
             ("flute", "violin", "ep", "celesta", "strings", "bass", "drums")}
    bar_start = lambda bar: 4 * bar

    # Flute melody; violin joins a diatonic third below in the last chorus.
    for bar, melody in enumerate(MELODY_BARS):
        beat = bar_start(bar)
        boost = section_boost(bar)
        for name, dur in melody:
            if name is None:
                beat += dur
                continue
            pitch = n(name)
            vel = min(112, max(60, 86 + boost + (6 if dur >= 2 else 0)
                               + (4 if pitch >= 84 else 0)))
            parts["flute"].append((beat, dur * 0.92, pitch, vel))
            if 28 <= bar < 36:
                parts["violin"].append(
                    (beat, dur * 0.9, diatonic_third_below(pitch), vel - 18))
            beat += dur

    # Electric piano comping.
    for bar, chname in enumerate(CHORDS):
        beat = bar_start(bar)
        tones = CHORD_TONES[chname]
        boost = section_boost(bar)
        if bar < 4 or bar >= 36:
            hits = [(0, 2.0), (2, 1.6)]
        elif 20 <= bar < 28:
            hits = [(0, 0.9), (1.5, 0.45), (2.5, 0.45), (3.0, 0.45)]
        else:
            hits = [(0, 1.4), (1.5, 0.45), (3, 0.9)]
        for off, d in hits:
            for p in tones:
                parts["ep"].append((beat + off, d, p, 58 + boost))

    # String pad: whole-bar voicing plus the root an octave below it.
    for bar, chname in enumerate(CHORDS):
        beat = bar_start(bar)
        boost = section_boost(bar)
        for p in CHORD_TONES[chname] + [CHORD_ROOT[chname] + 12]:
            parts["strings"].append((beat, 4.0, p, 46 + boost))

    # Bass: root/fifth bounce with a stepwise lead-in to the next chord.
    for bar, chname in enumerate(CHORDS):
        if bar < 2 or bar >= 38:
            continue
        beat = bar_start(bar)
        root = CHORD_ROOT[chname]
        fifth = root + 7
        nxt = CHORD_ROOT[CHORDS[bar + 1]]
        approach = nxt - 2 if (nxt - 2 - 7) % 12 in G_MAJOR else nxt - 1
        while approach > root + 12:
            approach -= 12
        boost = section_boost(bar)
        for off, p, d in [(0, root, 1.0), (1, fifth, 0.5), (1.5, root, 0.5),
                          (2, fifth, 1.0), (3, approach, 1.0)]:
            parts["bass"].append((beat + off, d * 0.95, p, 78 + boost))

    # Celesta: intro/outro arpeggios and fills under long melody notes.
    fill_bars = {11: (0, 4), 15: (2, 4), 19: (2, 4), 23: (2, 4), 27: (0, 4)}
    for bar, chname in enumerate(CHORDS):
        beat = bar_start(bar)
        tones = CHORD_TONES[chname]
        arp_tones = [tones[0] + 12, tones[1] + 12, tones[2] + 12,
                     tones[0] + 24]
        seq = [0, 1, 2, 3, 2, 3, 1, 2]
        if bar < 4 or bar >= 36:
            lo, hi = 0, 4
        elif bar in fill_bars:
            lo, hi = fill_bars[bar]
        else:
            continue
        for i in range(int((hi - lo) * 2)):
            p = arp_tones[seq[i % len(seq)]]
            parts["celesta"].append((beat + lo + i * 0.5, 0.45, p, 62))

    # Drums (channel 9): 36 kick, 37 sidestick, 38 snare, 42 closed hat,
    # 49 crash, 54 tambourine, 70 shaker.
    for bar in range(40):
        beat = bar_start(bar)
        if bar < 4:
            if bar >= 2:  # shaker fades in during the intro
                for i in range(8):
                    parts["drums"].append((beat + i * 0.5, 0.12, 70, 40))
            continue
        if bar >= 38:
            continue
        boost = section_boost(bar)
        bridge = 20 <= bar < 28
        final = 28 <= bar < 36
        snare_note = 38 if bridge else 37
        for b in (0, 2):
            parts["drums"].append((beat + b, 0.15, 36, 92 + boost))
        for b in (1, 3):
            parts["drums"].append((beat + b, 0.15, snare_note, 68 + boost))
        if bridge:
            parts["drums"].append((beat + 3.5, 0.15, 36, 78))
        for i in range(8):
            accent = 14 if i % 2 == 0 else 0
            parts["drums"].append(
                (beat + i * 0.5, 0.1, 42, 52 + accent + boost))
            if bridge or final:
                parts["drums"].append(
                    (beat + i * 0.5 + 0.25, 0.06, 70, 34 + boost))
        if final:
            for i in (1, 3, 5, 7):
                parts["drums"].append((beat + i * 0.5, 0.15, 54, 64))
        if bar in (20, 28):
            parts["drums"].append((beat, 0.4, 49, 78))

    return parts


# --------------------------------------------------------------------------
# MIDI assembly
# --------------------------------------------------------------------------

# part: (channel, GM program, track name, CC10 pan, CC7 volume)
PART_SPEC = {
    "flute":   (0, 73, "Flute melody",    74, 104),
    "violin":  (1, 41, "Viola harmony",   78,  76),
    "ep":      (2,  5, "Electric piano",  52,  88),
    "celesta": (3,  8, "Celesta",         92,  78),
    "strings": (4, 49, "String pad",      64,  72),
    "bass":    (5, 33, "Electric bass",   64,  96),
    "drums":   (9,  0, "Drums",           64, 100),
}


def write_score(path, parts):
    tracks = []
    meta_track = [(0, 0, b"\xFF\x03" + vlq(len(b"Seaside Stroll"))
                   + b"Seaside Stroll")]
    for beat, bpm in TEMPO_MAP:
        meta_track.append((round(beat * TPQ), 0, midi_tempo(bpm)))
    meta_track.append((0, 0, b"\xFF\x58\x04\x04\x02\x18\x08"))  # 4/4
    meta_track.append((0, 0, b"\xFF\x59\x02\x01\x00"))          # G major
    tracks.append(meta_track)

    for part, notes in parts.items():
        ch, program, name, pan, vol = PART_SPEC[part]
        ev = [(0, 0, b"\xFF\x03" + vlq(len(name)) + name.encode()),
              (0, 0, bytes([0xC0 | ch, program])),
              (0, 0, bytes([0xB0 | ch, 7, vol])),
              (0, 0, bytes([0xB0 | ch, 10, pan]))]
        for beat, dur, pitch, vel in notes:
            t0 = round(beat * TPQ)
            t1 = round((beat + dur) * TPQ)
            ev.append((t0, 2, bytes([0x90 | ch, pitch, max(1, min(127, vel))])))
            ev.append((t1, 1, bytes([0x80 | ch, pitch, 0])))
        tracks.append(ev)

    write_midi(path, tracks)


# --------------------------------------------------------------------------
# Synthesis
# --------------------------------------------------------------------------

rng = np.random.default_rng(20260924)


def freq(pitch):
    return 440.0 * 2 ** ((pitch - 69) / 12)


def envelope(n_samp, attack, decay_tau, sustain, release):
    env = np.ones(n_samp) * sustain
    a = min(n_samp, max(1, int(attack * SR)))
    r = min(n_samp, max(1, int(release * SR)))
    env[:a] = np.linspace(0, 1, a)
    body = n_samp - a - r
    if body > 0:
        env[a:a + body] = sustain + (1 - sustain) * np.exp(
            -np.arange(body) / (decay_tau * SR))
    env[n_samp - r:] *= np.linspace(1, 0, r)
    return env


def tone(f0, seconds, partials, attack, decay_tau, sustain, release,
         vibrato=None):
    """Additive tone; partials = [(ratio, amp, decay_scale), ...]."""
    n_samp = max(2, int(seconds * SR))
    t = np.arange(n_samp) / SR
    phase = np.zeros(n_samp)
    if vibrato:
        rate, depth_cents, onset = vibrato
        vib = depth_cents / 1200.0 * np.sin(2 * np.pi * rate * t)
        vib *= np.clip((t - onset) / 0.25, 0, 1)
        phase = 2 * np.pi * f0 * (np.cumsum(2 ** vib) - 1) / SR
    env = envelope(n_samp, attack, decay_tau, sustain, release)
    sig = np.zeros(n_samp)
    for ratio, amp, dscale in partials:
        penv = np.exp(-t / (decay_tau * dscale)) if dscale else 1.0
        sig += amp * penv * np.sin(2 * np.pi * f0 * ratio * t + phase * ratio)
    return sig * env


def noise_burst(seconds, low, high, attack, decay_tau, tone_part=None):
    """Band-filtered noise burst, optionally with a pitched component."""
    n_samp = max(2, int(seconds * SR))
    x = rng.standard_normal(n_samp)
    spec = np.fft.rfft(x)
    freqs = np.fft.rfftfreq(n_samp, 1 / SR)
    spec[(freqs < low) | (freqs > high)] = 0
    x = np.fft.irfft(spec, n_samp)
    x /= max(1e-9, np.max(np.abs(x)))
    env = envelope(n_samp, attack, decay_tau, 0.0, min(0.05, seconds * 0.3))
    out = x * env
    if tone_part:
        f0, amp, ttau = tone_part
        t = np.arange(n_samp) / SR
        out += amp * np.sin(2 * np.pi * f0 * t) * np.exp(-t / ttau)
    return out


def flute(f0, dur, vel):
    vib = (5.2, 7.0, 0.18)
    body = tone(f0, dur, [(1, 1.0, None), (2, 0.16, None), (3, 0.05, None)],
                0.06, 0.4, 0.85, 0.16, vibrato=vib)
    n_samp = len(body)
    breath = rng.standard_normal(n_samp)
    spec = np.fft.rfft(breath)
    fr = np.fft.rfftfreq(n_samp, 1 / SR)
    spec[(fr < f0 * 0.8) | (fr > f0 * 2.2)] = 0
    breath = np.fft.irfft(spec, n_samp)
    breath /= max(1e-9, np.max(np.abs(breath)))
    return body + 0.018 * breath * envelope(n_samp, 0.05, 0.4, 0.7, 0.15)


def violin(f0, dur, vel):
    partials = [(k, 0.9 / k, None) for k in range(1, 9)]
    return tone(f0, dur, partials, 0.09, 0.5, 0.9, 0.2,
                vibrato=(5.6, 11.0, 0.12))


def ep_tine(f0, dur, vel):
    partials = [(1, 1.0, 1.0), (2.0, 0.16, 0.6), (5.41, 0.09, 0.25),
                (13.9, 0.03, 0.12)]
    return tone(f0, dur, partials, 0.004, 0.85, 0.12, 0.1)


def celesta(f0, dur, vel):
    partials = [(1, 1.0, 1.0), (4.02, 0.45, 0.5), (9.96, 0.16, 0.2)]
    return tone(f0, dur, partials, 0.003, 0.5, 0.08, 0.08)


def strings(f0, dur, vel):
    out = np.zeros(max(2, int(dur * SR)))
    for det in (-0.006, 0.0, 0.006):
        partials = [(k, 0.55 / k, None) for k in range(1, 9)]
        out += tone(f0 * (1 + det), dur, partials, 0.32, 0.9, 0.95, 0.45,
                    vibrato=(4.8, 4.0, 0.3)) / 3
    return out


def bass(f0, dur, vel):
    partials = [(1, 1.0, 1.0), (2, 0.32, 0.7), (3, 0.1, 0.4)]
    sig = tone(f0, dur, partials, 0.008, 0.55, 0.55, 0.12)
    n_samp = len(sig)
    click = rng.standard_normal(min(n_samp, int(0.02 * SR)))
    sig[:len(click)] += 0.06 * click * np.exp(
        -np.arange(len(click)) / (0.004 * SR))
    return sig


def drum(note, dur, vel):
    if note == 36:    # kick: sine pitch drop + click
        n_samp = int(0.28 * SR)
        t = np.arange(n_samp) / SR
        f = 42 + 80 * np.exp(-t / 0.03)
        sig = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.09)
        sig[: int(0.005 * SR)] += 0.5 * np.linspace(1, 0, int(0.005 * SR))
        return sig
    if note == 37:    # sidestick
        return noise_burst(0.05, 1500, 5000, 0.001, 0.018,
                           tone_part=(830, 0.5, 0.015))
    if note == 38:    # snare
        return noise_burst(0.16, 900, 6500, 0.001, 0.05,
                           tone_part=(185, 0.6, 0.03))
    if note == 42:    # closed hat
        return noise_burst(0.05, 6500, 14000, 0.001, 0.016)
    if note == 49:    # crash
        return noise_burst(1.4, 3500, 15000, 0.002, 0.5)
    if note == 54:    # tambourine
        nb = noise_burst(0.12, 5000, 13000, 0.001, 0.05)
        t = np.arange(len(nb)) / SR
        nb += 0.3 * np.sin(2 * np.pi * 7600 * t) * np.exp(-t / 0.03)
        return nb
    if note == 70:    # shaker
        return noise_burst(0.06, 4500, 12000, 0.004, 0.02)
    return np.zeros(int(0.1 * SR))


SYNTH = {
    "flute": flute, "violin": violin, "ep": ep_tine, "celesta": celesta,
    "strings": strings, "bass": bass,
}


def pan_stereo(sig, pan):
    """Constant-power pan; pan in [0,1], 0.5 = center."""
    ang = pan * math.pi / 2
    return np.stack([sig * math.cos(ang), sig * math.sin(ang)], axis=1)


def render(parts, total_seconds):
    n_out = int((total_seconds + 3.0) * SR)
    mix = np.zeros((n_out, 2))
    for part, notes in parts.items():
        pan = PART_SPEC[part][3] / 127.0
        for beat, dur, pitch, vel in notes:
            t0 = beat_to_seconds(beat)
            t1 = beat_to_seconds(beat + dur)
            dur_s = max(0.05, t1 - t0)
            if part == "drums":
                sig = drum(pitch, dur_s, vel)
            else:
                sig = SYNTH[part](freq(pitch), dur_s + 0.6, vel)
            amp = (vel / 127.0) ** 1.5 * 0.32
            start = int(t0 * SR)
            end = min(n_out, start + len(sig))
            if start >= n_out:
                continue
            mix[start:end] += pan_stereo(sig[: end - start] * amp, pan)
    return mix


def convolve_ir(mix):
    """Synthetic small-hall impulse response via FFT convolution."""
    ir_len = int(1.6 * SR)
    t = np.arange(ir_len) / SR
    wet = np.zeros_like(mix)
    for ch in range(2):
        ir = rng.standard_normal(ir_len) * np.exp(-t / 0.32)
        ir[: int(0.02 * SR)] = 0                       # 20 ms pre-delay
        ir /= np.sqrt(np.sum(ir ** 2)) + 1e-9
        full = np.fft.irfft(np.fft.rfft(mix[:, ch], len(mix) + ir_len)
                            * np.fft.rfft(ir, len(mix) + ir_len),
                            len(mix) + ir_len)[: len(mix)]
        wet[:, ch] = full * 0.9
    return wet


def surf_ambience(n_samp):
    """Quiet, slowly swelling filtered noise - waves on a shore."""
    t = np.arange(n_samp) / SR
    out = np.zeros((n_samp, 2))
    for ch, phase in ((0, 0.0), (1, 0.35)):
        x = rng.standard_normal(n_samp)
        spec = np.fft.rfft(x)
        fr = np.fft.rfftfreq(n_samp, 1 / SR)
        spec[fr > 380] *= np.exp(-(fr[fr > 380] - 380) / 300)
        spec[fr < 40] = 0
        x = np.fft.irfft(spec, n_samp)
        x /= max(1e-9, np.std(x))
        swell = (0.5 + 0.5 * np.sin(2 * np.pi * t / 11.0 + phase * 2 * np.pi))
        swell = swell ** 2.2 * (0.6 + 0.4 * np.sin(2 * np.pi * t / 4.7 + ch))
        out[:, ch] = x * np.clip(swell, 0, 1)
    fade = int(8 * SR)
    out[:fade] *= np.linspace(0, 1, fade)[:, None]
    return out


def write_wav(path, mix):
    data = np.clip(mix, -1, 1)
    pcm = (data * 32767).astype("<i2").tobytes()
    byte_rate = SR * 2 * 2
    hdr = struct.pack("<4sI4s4sIHHIIHH4sI", b"RIFF", 36 + len(pcm), b"WAVE",
                      b"fmt ", 16, 1, 2, SR, byte_rate, 4, 16,
                      b"data", len(pcm))
    with open(path, "wb") as f:
        f.write(hdr + pcm)


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    midi_path = os.path.join(here, "seaside_stroll.mid")
    mp3_path = os.path.join(here, "seaside_stroll.mp3")

    parts = collect_notes()
    write_score(midi_path, parts)
    print(f"wrote {midi_path} "
          f"({sum(len(v) for v in parts.values())} notes, "
          f"{len(CHORDS)} bars, {BPM} BPM, {TPQ} tpq)")

    total_s = beat_to_seconds(SONG_BEATS)
    mix = render(parts, total_s)
    wet = convolve_ir(mix)
    mix = mix + 0.22 * wet
    mix += 0.035 * surf_ambience(len(mix))
    peak = np.max(np.abs(mix))
    mix *= 0.891 / peak  # -1 dBFS

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        wav_path = tmp.name
    try:
        write_wav(wav_path, mix)
        subprocess.run(
            ["ffmpeg", "-y", "-i", wav_path, "-codec:a", "libmp3lame",
             "-q:a", "2", mp3_path],
            check=True, capture_output=True)
    finally:
        os.unlink(wav_path)
    print(f"wrote {mp3_path} ({total_s:.1f} s of music, "
          f"{len(mix) / SR:.1f} s with tail)")


if __name__ == "__main__":
    main()
