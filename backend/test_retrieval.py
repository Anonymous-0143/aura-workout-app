from rag_engine import rag_engine

def test_rag(query):
    print(f"\n--- Testing Query: '{query}' ---")
    
    # Test Keyword Extraction
    print("Extracting keywords...")
    keywords = rag_engine._extract_keywords(query)
    print(f"Keywords: {keywords}")
    
    # Test Retrieval
    print("Retrieving context...")
    context = rag_engine._retrieve_context(query)
    print(f"Context Length: {len(context)}")
    print(f"Context Preview: {context[:200]}...")

test_rag("Okay, let's get those legs burning!")
test_rag("I want to build big arms")
