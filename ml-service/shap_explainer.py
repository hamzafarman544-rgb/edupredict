"""
SHAP Explainability Extension (Bonus)
======================================
Adds SHAP (SHapley Additive exPlanations) values to predictions.
This provides per-instance feature contribution explanations, not just
global feature importances.

Usage: import and call get_shap_explanation(model, feature_array, feature_names)
       Returns a dict of feature → SHAP contribution value for that prediction.

To enable in app.py:
    from shap_explainer import get_shap_explanation, build_shap_explainer
    shap_explainer = build_shap_explainer(model, X_background)
    ...
    shap_values = get_shap_explanation(shap_explainer, features, feature_names)
"""

import numpy as np

try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False
    print("[SHAP] shap package not installed. Run: pip install shap")


def build_shap_explainer(model, background_data=None):
    """
    Build a TreeExplainer for the Random Forest model.

    Args:
        model:           Trained RandomForestClassifier
        background_data: Optional numpy array used as background for masking.
                         If None, uses a zero-baseline.

    Returns:
        shap.TreeExplainer instance, or None if SHAP unavailable.
    """
    if not SHAP_AVAILABLE:
        return None
    try:
        explainer = shap.TreeExplainer(model, data=background_data)
        print("[SHAP] TreeExplainer built successfully.")
        return explainer
    except Exception as e:
        print(f"[SHAP] Failed to build explainer: {e}")
        return None


def get_shap_explanation(explainer, feature_array, feature_names, predicted_class_index=0):
    """
    Compute SHAP values for a single prediction instance.

    Args:
        explainer:             shap.TreeExplainer
        feature_array:         numpy array of shape (1, n_features)
        feature_names:         list of feature name strings
        predicted_class_index: index of the predicted class in model.classes_

    Returns:
        dict mapping feature_name → SHAP contribution (float),
        sorted by absolute contribution descending.
        Returns empty dict if SHAP is unavailable.
    """
    if explainer is None or not SHAP_AVAILABLE:
        return {}

    try:
        # shap_values shape: (n_classes, n_samples, n_features) for TreeExplainer
        shap_values = explainer.shap_values(feature_array)

        # Extract values for the predicted class
        if isinstance(shap_values, list):
            # Multi-class: list of arrays, one per class
            class_shap = shap_values[predicted_class_index][0]
        else:
            class_shap = shap_values[0]

        contributions = {
            name: round(float(val), 6)
            for name, val in zip(feature_names, class_shap)
        }

        # Sort by absolute contribution (most impactful first)
        contributions = dict(
            sorted(contributions.items(), key=lambda x: abs(x[1]), reverse=True)
        )
        return contributions

    except Exception as e:
        print(f"[SHAP] Explanation failed: {e}")
        return {}


def get_shap_summary(explainer, X, feature_names, class_index=0):
    """
    Compute mean absolute SHAP values over a dataset (global explanation).
    Useful for generating summary plots.

    Returns:
        dict mapping feature_name → mean |SHAP value|
    """
    if explainer is None or not SHAP_AVAILABLE:
        return {}

    try:
        shap_values = explainer.shap_values(X)
        if isinstance(shap_values, list):
            arr = np.array(shap_values[class_index])
        else:
            arr = shap_values

        mean_abs = np.mean(np.abs(arr), axis=0)
        return dict(zip(feature_names, mean_abs.tolist()))
    except Exception as e:
        print(f"[SHAP] Summary failed: {e}")
        return {}


# ─── Standalone demo ──────────────────────────────────────────────────────────

if __name__ == "__main__":
    import pickle, os

    model_path = os.path.join(os.path.dirname(__file__), "model", "model.pkl")
    with open(model_path, "rb") as f:
        model_data = pickle.load(f)

    model         = model_data["model"]
    feature_names = model_data["feature_names"]

    # Sample student input
    sample = np.array([[85.0, 78.5, 82.0, 70.0, 3.2, 5.0, 7.0, 1.0]])

    print("Building SHAP explainer…")
    explainer = build_shap_explainer(model, background_data=sample)

    pred  = model.predict(sample)[0]
    probs = model.predict_proba(sample)[0]
    cidx  = list(model.classes_).index(pred)

    print(f"\nPrediction: {pred}  (confidence {probs[cidx]:.2%})")

    shap_contrib = get_shap_explanation(explainer, sample, feature_names, cidx)
    print("\nSHAP feature contributions (for predicted class):")
    for feat, val in shap_contrib.items():
        direction = "+" if val > 0 else ""
        print(f"  {feat:<20} {direction}{val:.4f}")
