import numpy as np

def fuse_predictions(face_prob, eeg_prob):

    # Weighted fusion
    final_score = (0.6 * face_prob) + (0.4 * eeg_prob)

    # Risk classification
    if final_score < 0.40:
        risk = "Low ASD Risk"
    elif final_score < 0.70:
        risk = "Medium ASD Risk"
    else:
        risk = "High ASD Risk"

    return {
        "face_probability": float(face_prob),
        "eeg_probability": float(eeg_prob),
        "final_score": float(final_score),
        "risk_level": risk
    }