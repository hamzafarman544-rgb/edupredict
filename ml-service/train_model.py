"""
AI Student Performance Prediction System
ML Training Script - Random Forest (Final Model)
Generates synthetic dataset, trains Logistic Regression, Decision Tree, and Random Forest,
evaluates all models, saves the best (Random Forest) as model.pkl
"""

import numpy as np
import pandas as pd
import pickle
import os
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, classification_report, confusion_matrix
)
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns

# ─── 1. Generate Synthetic Dataset ────────────────────────────────────────────

np.random.seed(42)
N = 1000

def generate_dataset(n=1000):
    """Generate realistic synthetic student performance data."""
    attendance      = np.random.normal(75, 15, n).clip(0, 100)
    grade_avg       = np.random.normal(70, 15, n).clip(0, 100)
    assignments     = np.random.normal(72, 14, n).clip(0, 100)
    engagement      = np.random.normal(65, 18, n).clip(0, 100)
    prev_gpa        = np.random.normal(2.8, 0.8, n).clip(0.0, 4.0)
    study_hours     = np.random.normal(4, 2, n).clip(0, 12)
    participation   = np.random.randint(0, 11, n).astype(float)
    missed_deadlines = np.random.randint(0, 8, n).astype(float)

    # Composite score to determine label
    score = (
        0.30 * grade_avg +
        0.20 * attendance +
        0.15 * assignments +
        0.10 * engagement +
        0.10 * (prev_gpa / 4.0 * 100) +
        0.08 * (study_hours / 12 * 100) +
        0.04 * (participation / 10 * 100) -
        0.03 * (missed_deadlines / 7 * 100)
    ) + np.random.normal(0, 5, n)

    labels = []
    for s in score:
        if s >= 72:
            labels.append("High")
        elif s >= 55:
            labels.append("Average")
        else:
            labels.append("At Risk")

    df = pd.DataFrame({
        "attendance":        attendance,
        "grade_avg":         grade_avg,
        "assignments":       assignments,
        "engagement":        engagement,
        "prev_gpa":          prev_gpa,
        "study_hours":       study_hours,
        "participation":     participation,
        "missed_deadlines":  missed_deadlines,
        "performance":       labels
    })
    return df

df = generate_dataset(N)
df.to_csv("dataset.csv", index=False)
print(f"Dataset generated: {len(df)} rows")
print(df["performance"].value_counts())
print(df.describe())

# ─── 2. Preprocessing ─────────────────────────────────────────────────────────

FEATURES = ["attendance", "grade_avg", "assignments", "engagement",
            "prev_gpa", "study_hours", "participation", "missed_deadlines"]
TARGET   = "performance"

X = df[FEATURES].values
y = df[TARGET].values

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

scaler = StandardScaler()
X_train_s = scaler.fit_transform(X_train)
X_test_s  = scaler.transform(X_test)

print(f"\nTrain size: {X_train.shape[0]}  Test size: {X_test.shape[0]}")

# ─── 3. Model Training & Evaluation ──────────────────────────────────────────

def evaluate_model(name, model, Xtr, ytr, Xte, yte):
    model.fit(Xtr, ytr)
    y_pred = model.predict(Xte)
    acc  = accuracy_score(yte, y_pred)
    prec = precision_score(yte, y_pred, average="weighted", zero_division=0)
    rec  = recall_score(yte, y_pred, average="weighted", zero_division=0)
    f1   = f1_score(yte, y_pred, average="weighted", zero_division=0)
    print(f"\n{'='*50}")
    print(f"  {name}")
    print(f"{'='*50}")
    print(f"  Accuracy : {acc:.4f}")
    print(f"  Precision: {prec:.4f}")
    print(f"  Recall   : {rec:.4f}")
    print(f"  F1 Score : {f1:.4f}")
    print(f"\n{classification_report(yte, y_pred, zero_division=0)}")
    return model, y_pred, acc

lr, lr_pred, lr_acc  = evaluate_model("Logistic Regression", LogisticRegression(max_iter=1000, random_state=42), X_train_s, y_train, X_test_s, y_test)
dt, dt_pred, dt_acc  = evaluate_model("Decision Tree",       DecisionTreeClassifier(max_depth=8, random_state=42),          X_train,   y_train, X_test,   y_test)
rf, rf_pred, rf_acc  = evaluate_model("Random Forest (FINAL)", RandomForestClassifier(n_estimators=200, max_depth=10, random_state=42), X_train, y_train, X_test, y_test)

# ─── 4. Confusion Matrix Plot ─────────────────────────────────────────────────

labels_order = ["High", "Average", "At Risk"]
cm = confusion_matrix(y_test, rf_pred, labels=labels_order)

fig, ax = plt.subplots(figsize=(6, 5))
sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
            xticklabels=labels_order, yticklabels=labels_order, ax=ax)
ax.set_title("Random Forest — Confusion Matrix", fontsize=13, pad=12)
ax.set_ylabel("Actual", fontsize=11)
ax.set_xlabel("Predicted", fontsize=11)
plt.tight_layout()
plt.savefig("confusion_matrix.png", dpi=150)
print("\nConfusion matrix saved → confusion_matrix.png")

# ─── 5. Feature Importance Plot ───────────────────────────────────────────────

importances = rf.feature_importances_
sorted_idx  = np.argsort(importances)[::-1]
feat_names  = [FEATURES[i] for i in sorted_idx]
feat_vals   = importances[sorted_idx]

fig2, ax2 = plt.subplots(figsize=(7, 4))
bars = ax2.barh(feat_names[::-1], feat_vals[::-1], color="#378ADD")
ax2.set_title("Random Forest — Feature Importances", fontsize=13, pad=12)
ax2.set_xlabel("Importance", fontsize=11)
plt.tight_layout()
plt.savefig("feature_importance.png", dpi=150)
print("Feature importance saved → feature_importance.png")

# ─── 6. Save Model + Scaler ──────────────────────────────────────────────────

os.makedirs("model", exist_ok=True)

model_data = {
    "model":        rf,
    "scaler":       scaler,          # used by logistic regression path too; RF uses raw features
    "feature_names": FEATURES,
    "classes":      list(rf.classes_),
    "accuracy":     rf_acc,
    "importances":  dict(zip(FEATURES, rf.feature_importances_.tolist()))
}

with open("model/model.pkl", "wb") as f:
    pickle.dump(model_data, f)

print("\nModel saved → model/model.pkl")
print(f"Random Forest accuracy: {rf_acc:.4f}")
print("Training complete.")
