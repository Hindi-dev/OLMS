"""
Kruti Dev 010 / DevLys 010 to Unicode Devanagari bidirectional conversion engine.
Essential for Indian Government offices where legacy legacy documents or clerks type in Kruti Dev.
"""
import re

# Mapping rules for Kruti Dev to Unicode
KRUTI_TO_UNICODE_MAP = [
    # Complex conjuncts and modifier vowels
    ("ñ", "र्"), ("ò", "ऽ"), ("à", "ा"), ("á", "ा"), ("â", "ा"),
    ("å", "ी"), ("æ", "ी"), ("ç", "ी"), ("è", "ी"), ("é", "ी"),
    
    # Numbers
    ("0", "०"), ("1", "१"), ("2", "२"), ("3", "३"), ("4", "४"),
    ("5", "५"), ("6", "६"), ("7", "७"), ("8", "८"), ("9", "९"),

    # Vowels
    ("vks", "ओ"), ("vkS", "औ"), ("vk", "आ"), ("v", "अ"),
    ("bZ", "ई"), ("b", "इ"), ("m", "उ"), ("Å", "ऊ"),
    (",s", "ऐ"), (",", "ए"), ("_ष", "ऋ"),

    # Consonants with nukta / special
    ("क़", "क़"), ("ख़", "ख़"), ("ग़", "ग़"), ("ज़", "ज़"), ("फ़", "फ़"),

    # Half consonants (हलंत वर्ण)
    ("D", "क्"), ("[k", "ख्"), ("X", "ग्"), ("?", "घ्"),
    ("P", "च्"), ("N", "छ"), ("T", "ज्"), ("÷", "झ्"),
    ("V", "ट्"), ("B", "ठ्"), ("M", "ड्"), ("<", "ढ्"), (".", "ण्"),
    ("R", "त्"), ("F", "थ्"), ("n", "द्"), ("/", "ध्"), ("U", "न्"),
    ("I", "प्"), ("Q", "फ्"), ("C", "ब्"), ("H", "भ्"), ("E", "म्"),
    (";", "य्"), ("j", "र्"), ("y", "ल्"), ("o", "व्"),
    ("S", "श्"), ("ष", "ष्"), ("L", "स्"), ("g", "ह्"),

    # Full consonants
    ("d", "क"), ("[k", "ख"), ("x", "ग"), ("?", "घ"),
    ("p", "च"), ("N", "छ"), ("t", "ज"), ("÷", "झ"),
    ("V", "ट"), ("B", "ठ"), ("M", "ड"), ("<", "ढ"), (".", "ण"),
    ("r", "त"), ("F", "थ"), ("n", "द"), ("/", "ध"), ("u", "न"),
    ("i", "प"), ("Q", "फ"), ("c", "ब"), ("H", "भ"), ("e", "म"),
    (";", "य"), ("j", "र"), ("y", "ल"), ("o", "व"),
    ("k", "ा"), ("h", "ी"), ("q", "ु"), ("w", "ू"), ("s", "े"), ("S", "ै"),
    ("a", "ं"), ("¡", "ँ"), ("%", "ः"),
    ("z", "्र"), ("Z", "र्"), ("~", "्")
]

def krutidev_to_unicode(text: str) -> str:
    """
    Converts legacy Kruti Dev / DevLys 010 encoded text into standard Devanagari Unicode.
    """
    if not text:
        return ""
    
    # Pre-handling for matra 'i' (f in Krutidev precedes the consonant)
    text = re.sub(r'f([a-zA-Z])', r'\1ि', text)
    
    for kd, uni in KRUTI_TO_UNICODE_MAP:
        text = text.replace(kd, uni)
        
    return text

def is_devanagari(text: str) -> bool:
    """
    Checks if a given string contains Devanagari Unicode characters (U+0900 to U+097F).
    """
    for ch in text:
        if '\u0900' <= ch <= '\u097f':
            return True
    return False
