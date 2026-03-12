import pandas as pd
import numpy as np
from scipy.signal import butter, lfilter
from scipy.stats import entropy


def bandpass_filter(data, lowcut, highcut, fs):

    nyq = 0.5 * fs
    low = lowcut / nyq
    high = highcut / nyq

    b, a = butter(4, [low, high], btype='band')

    filtered = lfilter(b, a, data)

    return filtered


def extract_features(csv_file):

    df = pd.read_csv(csv_file)

    signal = df.iloc[:,1].values

    filtered = bandpass_filter(signal, 0.5, 40, 128)

    mean = np.mean(filtered)
    variance = np.var(filtered)
    std = np.std(filtered)

    hist, _ = np.histogram(filtered, bins=50)
    ent = entropy(hist)

    features = np.array([mean, variance, std, ent])

    features = features.reshape(1, -1)

    return features