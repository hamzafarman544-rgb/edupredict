"""
AI Student Performance Prediction System
Flask ML Microservice — /predict endpoint
Loads saved Random Forest model and serves predictions via REST API.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
import os

app = Flask(__name__)
CORS(app)

# ─── Load Model ───────────────────────────────────────────────────────────────

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model", "model.pkl")

try:
    with open(MODEL_PATH, "rb") as f:
        model_data = pickle.load(f)
    model         = model_data["model"]
    scaler        = model_data["scaler"]
    feature_names = model_data["feature_names"]
    classes       = model_data["classes"]
    importances   = model_data["importances"]
    print(f"[ML] Model loaded. Accuracy: {model_data['accuracy']:.4f}")
    print(f"[ML] Classes: {classes}")
except FileNotFoundError:
    print("[ML] ERROR: model/model.pkl not found. Run train_model.py first.")
    model = None

# ─── Health Check ─────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "model_loaded": model is not None,
        "model_type": "RandomForestClassifier",
        "features": feature_names if model else [],
        "accuracy": model_data.get("accuracy", 0) if model else 0
    })

# ─── Prediction Endpoint ──────────────────────────────────────────────────────

@app.route("/predict", methods=["POST"])
def predict():
    if model is None:
        return jsonify({"error": "Model not loaded. Run train_model.py first."}), 503

    data = request.get_json()
    if not data:
        return jsonify({"error": "No JSON body provided"}), 400

    # Validate required fields
    required = feature_names
    missing = [f for f in required if f not in data]
    if missing:
        return jsonify({"error": f"Missing fields: {missing}"}), 400

    # Build feature vector in correct order
    try:
        features = np.array([[float(data[f]) for f in feature_names]])
    except (ValueError, TypeError) as e:
        return jsonify({"error": f"Invalid feature values: {str(e)}"}), 400

    # Predict
    prediction   = model.predict(features)[0]
    probabilities = model.predict_proba(features)[0]
    prob_dict     = {cls: round(float(p), 4) for cls, p in zip(classes, probabilities)}

    # Map prediction to risk level
    risk_map = {
        "High":    "low",
        "Average": "medium",
        "At Risk": "high"
    }

    return jsonify({
        "prediction":         prediction,
        "risk_level":         risk_map.get(prediction, "unknown"),
        "probabilities":      prob_dict,
        "confidence":         round(float(max(probabilities)), 4),
        "feature_importance": importances,
        "model":              "RandomForestClassifier",
        "features_used":      {f: data[f] for f in feature_names}
    })

# ─── Batch Prediction ─────────────────────────────────────────────────────────

@app.route("/predict/batch", methods=["POST"])
def predict_batch():
    if model is None:
        return jsonify({"error": "Model not loaded"}), 503

    data = request.get_json()
    if not data or "students" not in data:
        return jsonify({"error": "Provide 'students' array in body"}), 400

    results = []
    for i, student in enumerate(data["students"]):
        try:
            features = np.array([[float(student[f]) for f in feature_names]])
            pred     = model.predict(features)[0]
            probs    = model.predict_proba(features)[0]
            prob_dict = {cls: round(float(p), 4) for cls, p in zip(classes, probs)}
            results.append({
                "index":      i,
                "student_id": student.get("student_id", f"student_{i}"),
                "prediction": pred,
                "confidence": round(float(max(probs)), 4),
                "probabilities": prob_dict
            })
        except Exception as e:
            results.append({"index": i, "error": str(e)})

    return jsonify({"results": results, "total": len(results)})

# ─── Model Info ───────────────────────────────────────────────────────────────

@app.route("/model/info", methods=["GET"])
def model_info():
    if model is None:
        return jsonify({"error": "Model not loaded"}), 503
    return jsonify({
        "type":              "RandomForestClassifier",
        "n_estimators":      model.n_estimators,
        "max_depth":         model.max_depth,
        "classes":           classes,
        "features":          feature_names,
        "feature_importance": importances,
        "accuracy":          model_data.get("accuracy", 0)
    })

# ─── Run ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=False)
