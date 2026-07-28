from src.barangay_flood_risk_modeling import (
    calculate_indices,
    export_results,
    generate_pdf_report,
    load_data,
    run_ml_pipeline,
    run_sensitivity_analysis,
    run_validation_checks,
)
from src.utils.paths import INTERIM_DATA_FILE


def main() -> None:
    dataframe = load_data(str(INTERIM_DATA_FILE))
    dataframe = calculate_indices(dataframe)
    dataframe, pipeline_results = run_ml_pipeline(dataframe)
    run_sensitivity_analysis(dataframe)
    run_validation_checks(dataframe)
    export_results(dataframe)
    generate_pdf_report(dataframe, pipeline_results)


if __name__ == '__main__':
    main()
