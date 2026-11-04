import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_api():
    print("Testing /api/health...")
    r = client.get("/api/health")
    assert r.status_code == 200, f"Health check failed: {r.text}"
    print("✓ Health check:", r.json())

    print("Testing /api/dak/...")
    r = client.get("/api/dak/")
    assert r.status_code == 200
    dak_list = r.json()
    print(f"✓ Dak records retrieved: {len(dak_list)} items")

    print("Testing /api/training/roster-summary...")
    r = client.get("/api/training/roster-summary")
    assert r.status_code == 200
    print("✓ Training roster summary:", r.json())

    print("Testing /api/translation/glossary...")
    r = client.get("/api/translation/glossary")
    assert r.status_code == 200
    glossary = r.json()
    print(f"✓ Glossary terms retrieved: {len(glossary)} items")

    print("Testing /api/meetings/...")
    r = client.get("/api/meetings/")
    assert r.status_code == 200
    meetings = r.json()
    print(f"✓ Meetings retrieved: {len(meetings)} items")

    print("Testing /api/compliance/knowledge-base...")
    r = client.get("/api/compliance/knowledge-base")
    assert r.status_code == 200
    kb = r.json()
    print(f"✓ Knowledge base items: {len(kb)} items")

    print("ALL FASTAPI ROUTE TESTS PASSED!")

if __name__ == "__main__":
    test_api()
