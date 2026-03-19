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
    
    features = []
    fs = 128
    
    # Process the first 19 columns consistently with the training logic
    for i in range(19):
        # df may have > 19 columns, ensuring we match the 19 channels from gdf model
        if i < df.shape[1]:
            signal = df.iloc[:, i].values
        else:
            signal = np.zeros(len(df))
            
        filtered = bandpass_filter(signal, 0.5, 40, fs)

        mean = np.mean(filtered)
        variance = np.var(filtered)
        std = np.std(filtered)

        hist, _ = np.histogram(filtered, bins=50)
        ent = entropy(hist)

        features.extend([mean, variance, std, ent])

    features = np.array(features).reshape(1, -1)

    return features