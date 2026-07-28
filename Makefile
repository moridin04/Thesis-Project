.PHONY: test run-pipeline train-all generate-figures export-results

test:
	pytest

run-pipeline:
	python3 scripts/run_pipeline.py

train-all:
	python3 scripts/train_all_models.py

generate-figures:
	python3 scripts/generate_figures.py

export-results:
	python3 scripts/export_results.py
