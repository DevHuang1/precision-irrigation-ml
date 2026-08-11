---
description: Run the full ML pipeline end-to-end
agent: ml-engineer
---
Run the full pipeline in chronological order: generate synthetic data, clean and
feature-engineer, (optional tuning), train, evaluate, export farmer feed, and
export the edge model.

```bash
python -m data.synthetic_generator && \
python -m src.data_pipeline && \
python -m src.train && \
python -m src.evaluate && \
python -m src.export_farmer_feed && \
python -m src.export_edge_model
```
