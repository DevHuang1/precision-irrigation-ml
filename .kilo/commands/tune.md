---
description: Run hyperparameter tuning with TimeSeriesSplit
agent: ml-engineer
---
Run `python -m src.tune` which uses `RandomizedSearchCV` with `TimeSeriesSplit`
(no k-fold, avoids future leakage). Saved best params are picked up by `train.py`.
