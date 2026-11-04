import re
from pathlib import Path
from typing import List, Dict, Any
import fitz # PyMuPDF
from docx import Document

def extract_policy_document_text(file_path: str | Path) -> Dict[str, Any]:
    """
    Extracts text from PDF, DOCX, or TXT with page-level division.
    """
    file_path = Path(file_path)
    ext = file_path.suffix.lower()
    
    pages = []
    
    if ext == ".pdf":
        doc = fitz.open(str(file_path))
        for page_idx in range(len(doc)):
            page_text = doc[page_idx].get_text("text") or ""
            pages.append({
                "page_number": page_idx + 1,
                "text": page_text.strip()
            })
        doc.close()
    elif ext in (".docx", ".doc"):
        doc = Document(str(file_path))
        full_text = []
        for p in doc.paragraphs:
            if p.text.strip():
                full_text.append(p.text.strip())
        for table in doc.tables:
            for row in table.rows:
                row_text = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
                if row_text:
                    full_text.append(row_text)
                    
        # Virtual pagination (approx 400 words per page)
        combined = "\n\n".join(full_text)
        pages.append({
            "page_number": 1,
            "text": combined
        })
    elif ext == ".txt":
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            text = f.read()
        pages.append({
            "page_number": 1,
            "text": text.strip()
        })
    else:
        raise ValueError(f"Unsupported file format: {ext}")

    # Build tagged string: [पृष्ठ 1] ... [पृष्ठ 2] ...
    tagged_text_parts = []
    for p in pages:
        tagged_text_parts.append(f"=== [पृष्ठ {p['page_number']}] ===\n{p['text']}")
        
    return {
        "page_count": len(pages),
        "pages": pages,
        "combined_tagged_text": "\n\n".join(tagged_text_parts)
    }

def search_policy_references(query: str, documents: List[Any]) -> List[Dict[str, Any]]:
    """
    Searches across policy documents' extracted text and returns exact matched
    passages with page citations and surrounding context.
    """
    if not query or not query.strip():
        return []

    query_terms = [t.strip().lower() for t in query.split() if len(t.strip()) > 1]
    if not query_terms:
        query_terms = [query.strip().lower()]

    matches = []

    for doc in documents:
        text = doc.extracted_text or ""
        # Split by page blocks
        page_blocks = re.split(r'=== \[पृष्ठ (\d+)\] ===', text)
        
        # page_blocks alternates: ['', '1', 'page 1 text', '2', 'page 2 text', ...]
        if len(page_blocks) > 1:
            for i in range(1, len(page_blocks), 2):
                page_num = int(page_blocks[i])
                page_content = page_blocks[i+1] if i+1 < len(page_blocks) else ""
                
                content_lower = page_content.lower()
                # Score matching
                match_count = sum(1 for term in query_terms if term in content_lower)
                if match_count > 0:
                    # Find first matching term location to build a snippet
                    first_pos = -1
                    for term in query_terms:
                        pos = content_lower.find(term)
                        if pos != -1 and (first_pos == -1 or pos < first_pos):
                            first_pos = pos

                    start_idx = max(0, first_pos - 120)
                    end_idx = min(len(page_content), first_pos + 250)
                    snippet = page_content[start_idx:end_idx].strip()
                    if start_idx > 0:
                        snippet = "..." + snippet
                    if end_idx < len(page_content):
                        snippet = snippet + "..."

                    matches.append({
                        "document_id": doc.id,
                        "document_title": doc.title,
                        "circular_no": doc.circular_no,
                        "issuing_authority": doc.issuing_authority,
                        "issue_date": str(doc.issue_date) if doc.issue_date else None,
                        "policy_category": doc.policy_category,
                        "page_number": page_num,
                        "matched_snippet": snippet,
                        "relevance_score": match_count
                    })
        else:
            # Fallback if unpaginated
            content_lower = text.lower()
            match_count = sum(1 for term in query_terms if term in content_lower)
            if match_count > 0:
                first_pos = -1
                for term in query_terms:
                    pos = content_lower.find(term)
                    if pos != -1 and (first_pos == -1 or pos < first_pos):
                        first_pos = pos
                start_idx = max(0, first_pos - 120)
                end_idx = min(len(text), first_pos + 250)
                matches.append({
                    "document_id": doc.id,
                    "document_title": doc.title,
                    "circular_no": doc.circular_no,
                    "issuing_authority": doc.issuing_authority,
                    "issue_date": str(doc.issue_date) if doc.issue_date else None,
                    "policy_category": doc.policy_category,
                    "page_number": 1,
                    "matched_snippet": text[start_idx:end_idx].strip(),
                    "relevance_score": match_count
                })

    # Sort by relevance score descending
    matches.sort(key=lambda m: m["relevance_score"], reverse=True)
    return matches[:20]
