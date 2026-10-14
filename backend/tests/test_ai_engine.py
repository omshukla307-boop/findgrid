from datetime import datetime, timedelta, timezone
from app.ai_engine import AIMatchingEngine, compute_haversine_distance, compute_cosine_similarity, tokenize

def test_tokenization_and_cosine_similarity():
    tokens1 = tokenize("Student wearing olive green waterproof windbreaker jacket and black leggings")
    tokens2 = tokenize("Young woman observed in green windbreaker jacket with dark leggings")
    
    sim = compute_cosine_similarity(tokens1, tokens2)
    assert sim > 0.4, f"Expected strong similarity, got {sim}"

def test_haversine_distance():
    # Distance between San Francisco Botanical Garden and Ferry Pier (~2-3 km)
    dist = compute_haversine_distance(37.7749, -122.4194, 37.7812, -122.4101)
    assert 0.5 < dist < 5.0, f"Unexpected distance: {dist} km"

def test_explainable_ai_engine_evaluation():
    now = datetime.now(timezone.utc)
    case_data = {
        "description": "Maya Lin, college student with dark shoulder length hair and spectacles.",
        "clothing_description": "Olive green windbreaker jacket, black leggings, white sneakers.",
        "identifying_features": "Black spectacles, silver ring.",
        "gender": "Female",
        "last_seen_lat": 37.7749,
        "last_seen_lng": -122.4194,
        "last_seen_time": now - timedelta(hours=2),
        "last_seen_location_name": "Riverside Botanical Gardens"
    }

    sighting_data = {
        "description": "Young woman matching description with dark hair and glasses looking tired.",
        "clothing_observed": "Green windbreaker jacket, black leggings, white sneakers.",
        "latitude": 37.7812,
        "longitude": -122.4101,
        "sighting_time": now - timedelta(hours=1)
    }

    result = AIMatchingEngine.evaluate_match(case_data, sighting_data)
    assert result["similarity_score"] > 60.0
    assert len(result["contributing_factors"]) == 4
    assert "review_recommendation" in result
    assert "PRIORITY" in result["review_recommendation"] or "MATCH" in result["review_recommendation"]
