"""Data quality inspection and CSV upload validation endpoint."""

from fastapi import APIRouter, File, UploadFile, HTTPException
from ..schemas import ApiResponse, DataQualitySummary, CsvUploadData
from ..core.data_loader import get_data_quality_summary, parse_and_validate_csv_bytes

router = APIRouter(tags=["Data Quality"])


@router.get("/data-quality", response_model=ApiResponse[DataQualitySummary])
def get_data_quality():
    """Retrieve data quality summary metrics and integrity checks for the active dataset."""
    try:
        summary = get_data_quality_summary()
        return ApiResponse(data=summary)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Data quality error: {str(e)}")


@router.post("/upload-csv", response_model=ApiResponse[CsvUploadData])
async def upload_csv(file: UploadFile = File(...)):
    """In-memory validation of user-uploaded airfare CSV against Fare Radar schema."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files (.csv) are accepted.")

    try:
        content = await file.read()
        valid, msg, quality_summary, errors = parse_and_validate_csv_bytes(content)

        res_data = CsvUploadData(
            valid=valid,
            message=msg,
            summary=quality_summary,
            errors=errors,
        )

        return ApiResponse(data=res_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File validation failed: {str(e)}")
