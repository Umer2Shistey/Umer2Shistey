"""Shared timing (seconds). VO times are offset by VO_OFFSET in the final cut."""
VO_OFFSET = 2.5
VO_LEN = 74.3
TOTAL = VO_OFFSET + VO_LEN + 3.0

# (vo_start, vo_end, text) - timed from the voiceover's pause map
CAPTIONS = [
    (0.0, 1.7, "Behold. Curly."),
    (2.2, 6.6, "He owns ONE Italy hoodie... and has therefore decided he is Italian."),
    (7.5, 8.9, "He has never been to Italy."),
    (9.4, 12.2, "He has been to this pizza place 43 times."),
    (13.2, 16.7, "Watch now, as he orders in what he believes is Italian."),
    (22.7, 24.4, "The cashier is from Mississauga."),
    (24.7, 26.0, "She is not impressed."),
    (26.9, 31.3, "Here we observe Curly in his natural habitat: pretending to think deeply."),
    (32.0, 35.4, "He is, in fact, wondering whether the hair counts as a hat."),
    (36.4, 40.5, "And now, the flip phone! He claims it is for \"the aesthetic.\""),
    (41.2, 45.5, "It is not. His last phone was lost... inside the hair."),
    (46.4, 51.3, "But what's this? He shakes the Coca-Cola. Why? Nobody knows."),
    (52.1, 53.1, "DISASTER!"),
    (54.0, 56.4, "Fear not. The hair absorbs all of it."),
    (57.0, 59.4, "Scientists are still searching for the bottle cap."),
    (60.4, 64.6, "At last, the pizza arrives. Curly performs the chef's kiss..."),
    (65.4, 67.5, "...and the hair... eats the pizza."),
]

# scene boundaries in VO time
SCENES = [(0.0, 13.0, "entrance"), (13.0, 26.5, "order"), (26.5, 36.0, "think"),
          (36.0, 46.0, "phone"), (46.0, 60.0, "coke"), (60.0, VO_LEN + 3.0, "pizza")]

o = VO_OFFSET
# (global time, effect, volume)
SFX = [
    (0.0, "crowd", 0.8), (0.2, "airhorn", 0.7),
    (o + 0.0, "boing", 0.5),
    (o + 10.9, "ding", 0.8),
    (o + 13.0, "whoosh", 0.6),
    (o + 17.8, "boing", 0.35),
    (o + 22.4, "scratch", 0.9),
    (o + 24.8, "crickets", 0.8),
    (o + 26.5, "whoosh", 0.6),
    (o + 32.0, "boing", 0.5),
    (o + 36.0, "whoosh", 0.7), (o + 36.5, "click", 1.0),
    (o + 44.3, "boing", 0.6),
    (o + 46.0, "whoosh", 0.6),
    (o + 52.0, "boom", 1.0),
    (o + 57.2, "ding", 0.6),
    (o + 60.0, "whoosh", 0.6),
    (o + 60.6, "ding", 0.5),
    (o + 66.5, "chomp", 1.0),
    (o + 69.2, "airhorn", 0.5),
    (o + 71.2, "crowd", 0.9),
]
