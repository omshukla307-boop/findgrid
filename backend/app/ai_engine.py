import re
import math
from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple

# Common stop words for text normalization
STOP_WORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are",
    "aren't", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both",
    "but", "by", "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't",
    "doing", "don't", "down", "during", "each", "few", "for", "from", "further", "had", "hadn't",
    "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here",
    "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm",
    "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more",
    "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or",
    "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shan't", "she",
    "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such", "than", "that", "that's",
    "the", "their", "theirs", "them", "themselves", "then", "there", "there's", "these", "they",
    "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too", "under",
    "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were",
    "weren't", "what", "what's", "when", "when's", "where", "where's", "which", "while", "who",
    "who's", "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd",
    "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves", "wearing", "last", "seen"
}

def tokenize(text: str) -> List[str]:
    """Tokenize and normalize text into meaningful keywords."""
    if not text:
        return []
    words = re.findall(r'\b[a-zA-Z0-9_-]+\b', text.lower())
    return [w for w in words if len(w) > 2 and w not in STOP_WORDS]

def compute_cosine_similarity(tokens1: List[str], tokens2: List[str]) -> float:
    """Compute cosine similarity between two token collections using term frequency."""
    if not tokens1 or not tokens2:
        return 0.0

    tf1: Dict[str, int] = {}
    for t in tokens1:
        tf1[t] = tf1.get(t, 0) + 1

    tf2: Dict[str, int] = {}
    for t in tokens2:
        tf2[t] = tf2.get(t, 0) + 1

    all_vocab = set(tf1.keys()).union(set(tf2.keys()))
    if not all_vocab:
        return 0.0

    dot_product = sum(tf1.get(w, 0) * tf2.get(w, 0) for w in all_vocab)
    magnitude1 = math.sqrt(sum(v ** 2 for v in tf1.values()))
    magnitude2 = math.sqrt(sum(v ** 2 for v in tf2.values()))

    if magnitude1 == 0 or magnitude2 == 0:
        return 0.0
    return dot_product / (magnitude1 * magnitude2)

def compute_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points on the Earth in kilometers."""
    R = 6371.0 # Earth's radius in km

    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

class AIMatchingEngine:
    """
    Explainable AI Matching Engine for missing person cases and reported sightings.
    Evaluates:
    - Textual description & physical features
    - Clothing & personal accessories
    - Geographic proximity & dispersion feasibility
    - Temporal delta & realistic travel velocity
    """

    @classmethod
    def evaluate_match(
        cls,
        case_data: Dict[str, Any],
        sighting_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        contributing_factors = []
        conflicts_or_missing = []

        # 1. Textual Description Similarity (Weight: 30%)
        case_text = f"{case_data.get('description', '')} {case_data.get('identifying_features', '')} {case_data.get('gender', '')}"
        sighting_text = sighting_data.get('description', '')

        case_tokens = tokenize(case_text)
        sighting_tokens = tokenize(sighting_text)
        text_sim = compute_cosine_similarity(case_tokens, sighting_tokens)
        text_score = round(text_sim * 100, 1)

        # Identify shared physical keywords
        shared_keywords = list(set(case_tokens).intersection(set(sighting_tokens)))
        detail_text = f"Analyzed {len(case_tokens)} case tokens vs {len(sighting_tokens)} sighting tokens."
        if shared_keywords:
            detail_text += f" Strong overlap on terms: {', '.join(shared_keywords[:5])}."
        else:
            conflicts_or_missing.append("No prominent physical keyword matches in description.")

        contributing_factors.append({
            "factor_name": "Physical & Contextual Description",
            "score": text_score,
            "weight": 30,
            "detail": detail_text
        })

        # 2. Clothing & Appearance Similarity (Weight: 25%)
        case_clothing = case_data.get('clothing_description', '')
        sighting_clothing = sighting_data.get('clothing_observed', '')

        if not case_clothing or not sighting_clothing:
            clothing_score = 40.0 # Neutral baseline if one is unrecorded
            contributing_factors.append({
                "factor_name": "Clothing & Apparel Match",
                "score": clothing_score,
                "weight": 25,
                "detail": "Partial information: one or both reports lack detailed clothing descriptions."
            })
            conflicts_or_missing.append("Complete clothing records were not available on both reports.")
        else:
            cloth_c_tokens = tokenize(case_clothing)
            cloth_s_tokens = tokenize(sighting_clothing)
            clothing_sim = compute_cosine_similarity(cloth_c_tokens, cloth_s_tokens)
            clothing_score = round(clothing_sim * 100, 1)

            shared_cloth = list(set(cloth_c_tokens).intersection(set(cloth_s_tokens)))
            c_detail = f"Clothing similarity scored {clothing_score}%."
            if shared_cloth:
                c_detail += f" Identified matching apparel elements: {', '.join(shared_cloth)}."
            else:
                conflicts_or_missing.append("Observed clothing may differ from last known clothing.")

            contributing_factors.append({
                "factor_name": "Clothing & Apparel Match",
                "score": clothing_score,
                "weight": 25,
                "detail": c_detail
            })

        # 3. Geographic Proximity Analysis (Weight: 25%)
        case_lat = case_data.get('last_seen_lat', 0.0)
        case_lng = case_data.get('last_seen_lng', 0.0)
        sight_lat = sighting_data.get('latitude', 0.0)
        sight_lng = sighting_data.get('longitude', 0.0)

        dist_km = compute_haversine_distance(case_lat, case_lng, sight_lat, sight_lng)
        dist_km = round(dist_km, 2)

        # Decay function: within 1 km = 100, within 5 km = 85, within 15 km = 65, within 50 km = 35, >100 km decays
        if dist_km <= 1.0:
            geo_score = 100.0
        elif dist_km <= 5.0:
            geo_score = 90.0 - (dist_km - 1.0) * 2.5
        elif dist_km <= 20.0:
            geo_score = 80.0 - (dist_km - 5.0) * 2.0
        elif dist_km <= 60.0:
            geo_score = 50.0 - (dist_km - 20.0) * 0.7
        else:
            geo_score = max(5.0, 22.0 - (dist_km - 60.0) * 0.1)
        geo_score = round(geo_score, 1)

        contributing_factors.append({
            "factor_name": "Geographic Proximity & Search Radius",
            "score": geo_score,
            "weight": 25,
            "detail": f"Distance between last seen position and sighting is {dist_km} km."
        })

        # 4. Temporal Feasibility & Velocity (Weight: 20%)
        t_case = case_data.get('last_seen_time')
        t_sight = sighting_data.get('sighting_time')

        if isinstance(t_case, str):
            try:
                t_case = datetime.fromisoformat(t_case.replace("Z", "+00:00"))
            except Exception:
                t_case = None
        if isinstance(t_sight, str):
            try:
                t_sight = datetime.fromisoformat(t_sight.replace("Z", "+00:00"))
            except Exception:
                t_sight = None

        if t_case and t_sight:
            time_diff_seconds = (t_sight - t_case).total_seconds()
            time_diff_hours = round(time_diff_seconds / 3600.0, 2)
            
            if time_diff_seconds < 0:
                # Sighting reported before last seen! Anomaly!
                temp_score = 10.0
                conflicts_or_missing.append(f"Temporal Anomaly: Sighting occurred {abs(time_diff_hours)} hours BEFORE the reported disappearance.")
                temp_detail = f"Inconsistent timestamp order ({abs(time_diff_hours)} hours prior)."
            else:
                effective_hours = max(0.1, time_diff_hours)
                required_speed_kmh = dist_km / effective_hours
                
                if required_speed_kmh <= 6.0: # Walking pace
                    temp_score = 100.0
                    temp_detail = f"Elapsed time: {time_diff_hours} hrs. Required transit velocity: {round(required_speed_kmh, 1)} km/h (walking pace)."
                elif required_speed_kmh <= 80.0: # Driving / transit pace
                    temp_score = 90.0
                    temp_detail = f"Elapsed time: {time_diff_hours} hrs. Required transit velocity: {round(required_speed_kmh, 1)} km/h (vehicular pace)."
                elif required_speed_kmh <= 200.0: # High speed transit
                    temp_score = 65.0
                    temp_detail = f"Elapsed time: {time_diff_hours} hrs. Requires rapid highway transit ({round(required_speed_kmh, 1)} km/h)."
                else: # Unlikely teleportation
                    temp_score = 20.0
                    conflicts_or_missing.append(f"Feasibility conflict: Requires transit velocity of {round(required_speed_kmh, 1)} km/h.")
                    temp_detail = f"Physically improbable velocity required ({round(required_speed_kmh, 1)} km/h)."
        else:
            time_diff_hours = 0.0
            temp_score = 50.0
            temp_detail = "Indeterminate temporal delta: missing precise timestamp data."
            conflicts_or_missing.append("Incomplete timestamp records on one or both submissions.")

        contributing_factors.append({
            "factor_name": "Temporal Feasibility & Transit Speed",
            "score": round(temp_score, 1),
            "weight": 20,
            "detail": temp_detail
        })

        # Calculate Final Composite Similarity Score (0 - 100)
        final_score = (
            text_score * 0.30 +
            clothing_score * 0.25 +
            geo_score * 0.25 +
            temp_score * 0.20
        )
        final_score = round(min(100.0, max(0.0, final_score)), 1)

        # Generate Human-Explainable Review Recommendation
        if final_score >= 80.0:
            recommendation = (
                f"HIGH PRIORITY MATCH ({final_score}%): Strong physical, apparel, and spatiotemporal alignment. "
                f"Recommended Action: Authorize lead investigator verification and coordinate search sector '{case_data.get('last_seen_location_name')}' immediately."
            )
        elif final_score >= 60.0:
            recommendation = (
                f"MODERATE CANDIDATE MATCH ({final_score}%): Plausible geographic radius ({dist_km} km) with correlated features. "
                f"Recommended Action: Conduct follow-up witness interview and cross-reference nearby surveillance footage."
            )
        elif final_score >= 40.0:
            recommendation = (
                f"LOW PROBABILITY ({final_score}%): Moderate divergence in clothing or physical keywords. "
                f"Recommended Action: Retain in secondary candidate pool pending further corroborating sightings."
            )
        else:
            recommendation = (
                f"UNLIKELY CORRELATION ({final_score}%): Significant divergence across geographic distance ({dist_km} km) or physical characteristics. "
                f"Recommended Action: Archive or reject unless corroborated by biometric verification."
            )

        return {
            "similarity_score": final_score,
            "textual_similarity": text_score,
            "clothing_similarity": clothing_score,
            "geo_distance_km": dist_km,
            "time_diff_hours": time_diff_hours,
            "contributing_factors": contributing_factors,
            "missing_or_conflicting": conflicts_or_missing,
            "review_recommendation": recommendation,
        }
