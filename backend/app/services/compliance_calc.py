from typing import Dict, Any

ANNUAL_PROGRAMME_TARGETS = {
    "A": {
        "region_name": "क क्षेत्र (Region A)",
        "correspondence_target_percent": 100.0,
        "reply_to_hindi_letters": 100.0,
        "section_3_3_bilingual": 100.0,
        "computers_hindi_enabled": 100.0,
    },
    "B": {
        "region_name": "ख क्षेत्र (Region B)",
        "correspondence_target_percent": 90.0,
        "reply_to_hindi_letters": 100.0,
        "section_3_3_bilingual": 100.0,
        "computers_hindi_enabled": 100.0,
    },
    "C": {
        "region_name": "ग क्षेत्र (Region C)",
        "correspondence_target_percent": 55.0,
        "reply_to_hindi_letters": 100.0,
        "section_3_3_bilingual": 100.0,
        "computers_hindi_enabled": 100.0,
    }
}

SECTION_3_3_STANDARD_CATEGORIES = [
    {"code": "GEN_ORDERS", "name_hi": "सामान्य आदेश", "name_en": "General Orders"},
    {"code": "CIRCULARS", "name_hi": "कार्यालय ज्ञापन / परिपत्र", "name_en": "Office Memos / Circulars"},
    {"code": "NOTIFICATIONS", "name_hi": "अधिसूचनाएं", "name_en": "Notifications"},
    {"code": "RESOLUTIONS", "name_hi": "संकल्प", "name_en": "Resolutions"},
    {"code": "RULES", "name_hi": "नियम एवं प्रशासनिक निर्देश", "name_en": "Rules & Administrative Instructions"},
    {"code": "ADMIN_REPORTS", "name_hi": "प्रशासनिक तथा अन्य रिपोर्टें", "name_en": "Administrative & Other Reports"},
    {"code": "PRESS_COMMUNIQUES", "name_hi": "प्रेस विज्ञप्तियां", "name_en": "Press Communiques"},
    {"code": "CONTRACTS_AGREEMENTS", "name_hi": "संविदाएं एवं करार", "name_en": "Contracts & Agreements"},
    {"code": "LICENSES_PERMITS", "name_hi": "लाइसेंस एवं परमिट", "name_en": "Licenses & Permits"},
    {"code": "TENDER_NOTICES", "name_hi": "निविदा सूचनाएं एवं प्रारूप", "name_en": "Tender Notices & Forms"},
    {"code": "PARLIAMENT_PAPERS", "name_hi": "संसद के समक्ष प्रस्तुत किए जाने वाले कागजात", "name_en": "Papers Laid Before Parliament"}
]

def calculate_qpr_metrics(qpr_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes percentages, compares with Annual Programme targets, and flags compliance gaps.
    """
    region = qpr_data.get("office_region", "A").upper()
    targets = ANNUAL_PROGRAMME_TARGETS.get(region, ANNUAL_PROGRAMME_TARGETS["A"])

    # Region A Correspondence
    tot_a = qpr_data.get("letters_to_region_a_total", 0) or 0
    hi_a = qpr_data.get("letters_to_region_a_hi", 0) or 0
    pct_a = (hi_a / tot_a * 100.0) if tot_a > 0 else 0.0

    # Region B Correspondence
    tot_b = qpr_data.get("letters_to_region_b_total", 0) or 0
    hi_b = qpr_data.get("letters_to_region_b_hi", 0) or 0
    pct_b = (hi_b / tot_b * 100.0) if tot_b > 0 else 0.0

    # Region C Correspondence
    tot_c = qpr_data.get("letters_to_region_c_total", 0) or 0
    hi_c = qpr_data.get("letters_to_region_c_hi", 0) or 0
    pct_c = (hi_c / tot_c * 100.0) if tot_c > 0 else 0.0

    # Rule 5 Compliance (Reply to Hindi letters in Hindi)
    rec_hi = qpr_data.get("letters_received_hindi", 0) or 0
    rep_hi = qpr_data.get("letters_replied_hindi", 0) or 0
    rule5_pct = (rep_hi / rec_hi * 100.0) if rec_hi > 0 else 100.0

    # Section 3(3) Compliance Calculation
    sec33_items = qpr_data.get("section3_3_items", [])
    total_docs = sum(item.get("total_issued", 0) for item in sec33_items)
    bilingual_docs = sum(item.get("bilingual_issued", 0) for item in sec33_items)
    violations = sum(item.get("only_english_issued", 0) for item in sec33_items)
    
    sec33_compliance = (bilingual_docs / total_docs * 100.0) if total_docs > 0 else 100.0

    # Status & Flagging
    flags = []
    if region == "A" and pct_a < 100.0:
        flags.append(f"क क्षेत्र को पत्राचार {pct_a:.1f}% है (लक्ष्य: 100%)")
    if region in ["A", "B"] and pct_b < 90.0:
        flags.append(f"ख क्षेत्र को पत्राचार {pct_b:.1f}% है (लक्ष्य: 90%)")
    if rule5_pct < 100.0:
        flags.append(f"नियम 5 उल्लंघन: हिंदी में प्राप्त पत्रों के उत्तर केवल {rule5_pct:.1f}% हिंदी में दिए गए (अनिवार्य: 100%)")
    if violations > 0:
        flags.append(f"धारा 3(3) का गंभीर उल्लंघन: {violations} दस्तावेज केवल अंग्रेजी में जारी किए गए!")

    return {
        "region": region,
        "region_name": targets["region_name"],
        "correspondence": {
            "region_a": {"total": tot_a, "hindi": hi_a, "percent": round(pct_a, 2), "target": targets["correspondence_target_percent"]},
            "region_b": {"total": tot_b, "hindi": hi_b, "percent": round(pct_b, 2), "target": 90.0},
            "region_c": {"total": tot_c, "hindi": hi_c, "percent": round(pct_c, 2), "target": 55.0},
        },
        "rule_5": {
            "received": rec_hi,
            "replied_in_hindi": rep_hi,
            "percent": round(rule5_pct, 2),
            "target": 100.0,
            "is_compliant": rule5_pct >= 100.0 or rec_hi == 0
        },
        "section_3_3": {
            "total_documents": total_docs,
            "bilingual_documents": bilingual_docs,
            "violations_english_only": violations,
            "compliance_percent": round(sec33_compliance, 2),
            "is_strictly_compliant": violations == 0
        },
        "flags": flags
    }
