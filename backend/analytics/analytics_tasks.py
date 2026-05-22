import logging
import os
import pickle

import pandas as pd
from celery import shared_task
from django.conf import settings
from django_tenants.utils import tenant_context
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

from attendance.models import DailyAttendance
from exams.models import Mark
from schools.models import School
from students.models import Student

logger = logging.getLogger(__name__)


@shared_task
def train_predictive_retention_model():
    """
    Trains an offline predictive retention model (Random Forest)
    to flag high-risk dropout students based on cumulative attendance and score trends.
    """
    logger.info("Starting predictive retention model training task...")

    data = []

    # Extract data across all active school tenants
    schools = School.objects.filter(status="ACTIVE").exclude(schema_name="public")

    for school in schools:
        with tenant_context(school):
            # Fetch all students including dropped
            students = Student.objects.all()
            for student in students:
                # Calculate avg score
                marks = Mark.objects.filter(student=student)
                if marks.exists():
                    avg_score = sum(m.score for m in marks) / marks.count()
                else:
                    avg_score = 50.0  # baseline if no exams

                # Calculate attendance rate
                total_att = DailyAttendance.objects.filter(student=student).count()
                if total_att > 0:
                    present_att = DailyAttendance.objects.filter(
                        student=student, status__in=["PRESENT", "LATE", "EXCUSED"]
                    ).count()
                    att_rate = present_att / total_att
                else:
                    att_rate = 1.0  # default 100%

                # Target variable: dropped out (1) or active (0)
                # We map DROPPED to 1, and others to 0
                is_dropped = 1 if student.status == "DROPPED" else 0

                data.append(
                    {
                        "attendance_rate": att_rate,
                        "avg_score": float(avg_score),
                        "is_dropped": is_dropped,
                    }
                )

    if not data:
        logger.warning("No student data available for model training.")
        return "NO_DATA"

    df = pd.DataFrame(data)

    # We need at least both classes (active and dropped) to train classification model
    if len(df["is_dropped"].unique()) < 2:
        logger.warning(
            "Not enough variance in target variable (need both active and dropped students) to train the model."
        )
        return "INSUFFICIENT_VARIANCE"

    X = df[["attendance_rate", "avg_score"]]
    y = df["is_dropped"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    clf = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)
    clf.fit(X_train, y_train)

    score = clf.score(X_test, y_test)
    logger.info(f"Model trained successfully. Validation accuracy: {score:.2f}")

    # Save the model artifact locally
    models_dir = os.path.join(str(settings.BASE_DIR), "analytics", "models_storage")
    os.makedirs(models_dir, exist_ok=True)
    model_path = os.path.join(models_dir, "retention_rf_model.pkl")

    with open(model_path, "wb") as f:
        pickle.dump(clf, f)

    logger.info(f"Model saved to {model_path}")
    return {"status": "SUCCESS", "accuracy": score, "model_path": model_path}
