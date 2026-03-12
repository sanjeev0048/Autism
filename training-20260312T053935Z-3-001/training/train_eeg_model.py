import os
import numpy as np
import mne
from scipy.signal import butter, lfilter
from scipy.stats import entropy
from sklearn.model_selection import train_test_split
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score
import joblib


# -------------------------------------------------
# BANDPASS FILTER
# -------------------------------------------------

def bandpass_filter(data, lowcut, highcut, fs):

    nyq = 0.5 * fs
    low = lowcut / nyq
    high = highcut / nyq

    b, a = butter(4, [low, high], btype="band")

    return lfilter(b, a, data)


# -------------------------------------------------
# FEATURE EXTRACTION
# -------------------------------------------------

def extract_features(file_path):

    try:
        raw = mne.io.read_raw_gdf(file_path, preload=True, verbose=False)
    except:
        print("Skipping (cannot read):", file_path)
        return None

    try:
        data = raw.get_data()
    except:
        return None

    if data.shape[0] < 19:
        print("Skipping (not enough channels):", file_path)
        return None

    # force same channel count
    data = data[:19]

    fs = int(raw.info["sfreq"])

    features = []

    for channel in data:

        if len(channel) == 0:
            return None

        filtered = bandpass_filter(channel, 0.5, 40, fs)

        mean = np.mean(filtered)
        var = np.var(filtered)
        std = np.std(filtered)

        hist, _ = np.histogram(filtered, bins=50)
        ent = entropy(hist)

        features.extend([mean, var, std, ent])

    return features


# -------------------------------------------------
# DATASET LOADING
# -------------------------------------------------

X = []
y = []

dataset_path = "dataset/eeg_dataset"

print("\nScanning dataset...\n")

for root, dirs, files in os.walk(dataset_path):

    for file in files:

        if file.endswith(".gdf"):

            file_path = os.path.join(root, file)

            print("Processing:", file_path)

            features = extract_features(file_path)

            if features is None:
                continue

            X.append(features)

            if "asd" in root.lower():
                y.append(1)
            else:
                y.append(0)


print("\nSamples collected:", len(X))

if len(X) == 0:
    print("No valid EEG samples found")
    exit()


print("Feature size:", len(X[0]))


# -------------------------------------------------
# CONVERT TO NUMPY
# -------------------------------------------------

X = np.array(X)
y = np.array(y)


# -------------------------------------------------
# TRAIN TEST SPLIT
# -------------------------------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)


# -------------------------------------------------
# MODEL TRAINING
# -------------------------------------------------

print("\nTraining EEG model...\n")

model = SVC(probability=True)

model.fit(X_train, y_train)


# -------------------------------------------------
# MODEL EVALUATION
# -------------------------------------------------

y_pred = model.predict(X_test)

accuracy = accuracy_score(y_test, y_pred)

print("\nEEG Model Accuracy:", accuracy)


# -------------------------------------------------
# SAVE MODEL
# -------------------------------------------------

os.makedirs("backend/models", exist_ok=True)

joblib.dump(model, "backend/models/eeg_model.pkl")

print("\nModel saved to backend/models/eeg_model.pkl")