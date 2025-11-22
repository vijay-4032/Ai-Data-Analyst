"""
File Upload Endpoints
"""

from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from loguru import logger
import os
import uuid
from datetime import datetime

from app.config import settings
from app.core.exceptions import InvalidFileError, FileTooLargeError
from app.services.file_parser import FileParser
from app.services.data_profiler import DataProfiler

router = APIRouter()

# ===========================================
# In-memory storage (replace with database)
# ===========================================
uploads_db: dict = {}


# ===========================================
# Pydantic Models
# ===========================================

class ColumnInfo(BaseModel):
    name: str
    type: str
    nullable: bool
    unique: int
    missing: int
    sample: list


class DatasetResponse(BaseModel):
    id: str
    name: str
    filename: str
    size: int
    row_count: int
    column_count: int
    columns: list[ColumnInfo]
    status: str
    created_at: str
    

class UploadResponse(BaseModel):
    success: bool
    data: Optional[DatasetResponse] = None
    message: str


# ===========================================
# Helper Functions
# ===========================================

def validate_file(file: UploadFile) -> None:
    """Validate uploaded file"""
    
    # Check filename
    if not file.filename:
        raise InvalidFileError(detail="No filename provided")
    
    # Check extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise InvalidFileError(
            detail=f"File type not allowed. Allowed types: {', '.join(settings.ALLOWED_EXTENSIONS)}",
            filename=file.filename,
            reason="invalid_extension",
        )
    
    # Check content type
    allowed_content_types = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/octet-stream",  # Some systems send this
    ]
    if file.content_type and file.content_type not in allowed_content_types:
        logger.warning(f"Unexpected content type: {file.content_type}")


async def save_upload_file(file: UploadFile, file_id: str) -> str:
    """Save uploaded file to disk"""
    
    # Create uploads directory if not exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    # Generate file path
    ext = os.path.splitext(file.filename)[1]
    file_path = os.path.join(settings.UPLOAD_DIR, f"{file_id}{ext}")
    
    # Read and save file
    contents = await file.read()
    
    # Check file size
    if len(contents) > settings.MAX_FILE_SIZE:
        raise FileTooLargeError(
            max_size=settings.MAX_FILE_SIZE,
            actual_size=len(contents),
            filename=file.filename,
        )
    
    # Write to disk
    with open(file_path, "wb") as f:
        f.write(contents)
    
    return file_path


# ===========================================
# Endpoints
# ===========================================

@router.post("", response_model=UploadResponse)
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="CSV or Excel file to upload"),
):
    """
    Upload a CSV or Excel file for analysis
    
    - Validates file type and size
    - Parses file contents
    - Profiles data structure
    - Returns dataset metadata
    """
    
    try:
        # Validate file
        validate_file(file)
        
        # Generate unique ID
        file_id = str(uuid.uuid4())
        
        # Save file
        file_path = await save_upload_file(file, file_id)
        
        # Get file size
        file_size = os.path.getsize(file_path)
        
        # Parse file
        parser = FileParser()
        df = parser.parse(file_path)
        
        # Profile data
        profiler = DataProfiler()
        profile = profiler.profile(df)
        
        # Create dataset record
        dataset = {
            "id": file_id,
            "name": os.path.splitext(file.filename)[0],
            "filename": file.filename,
            "size": file_size,
            "row_count": len(df),
            "column_count": len(df.columns),
            "columns": profile["columns"],
            "status": "ready",
            "file_path": file_path,
            "created_at": datetime.utcnow().isoformat(),
        }
        
        # Store in memory (replace with database)
        uploads_db[file_id] = dataset
        
        logger.info(f"File uploaded successfully: {file.filename} ({file_id})")
        
        return UploadResponse(
            success=True,
            data=DatasetResponse(**{k: v for k, v in dataset.items() if k != "file_path"}),
            message=f"Successfully uploaded {file.filename}",
        )
        
    except (InvalidFileError, FileTooLargeError):
        raise
    except Exception as e:
        logger.exception(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/{upload_id}")
async def get_upload(upload_id: str):
    """
    Get upload status and metadata
    """
    
    if upload_id not in uploads_db:
        raise HTTPException(status_code=404, detail="Upload not found")
    
    dataset = uploads_db[upload_id]
    
    return {
        "success": True,
        "data": DatasetResponse(**{k: v for k, v in dataset.items() if k != "file_path"}),
    }


@router.delete("/{upload_id}")
async def delete_upload(upload_id: str):
    """
    Delete an uploaded file
    """
    
    if upload_id not in uploads_db:
        raise HTTPException(status_code=404, detail="Upload not found")
    
    dataset = uploads_db[upload_id]
    
    # Delete file from disk
    try:
        if os.path.exists(dataset["file_path"]):
            os.remove(dataset["file_path"])
    except Exception as e:
        logger.warning(f"Failed to delete file: {e}")
    
    # Remove from database
    del uploads_db[upload_id]
    
    return {
        "success": True,
        "message": "Upload deleted successfully",
    }


@router.get("/{upload_id}/preview")
async def preview_upload(upload_id: str, rows: int = 10):
    """
    Get a preview of the uploaded data
    """
    
    if upload_id not in uploads_db:
        raise HTTPException(status_code=404, detail="Upload not found")
    
    dataset = uploads_db[upload_id]
    
    # Parse file and get preview
    parser = FileParser()
    df = parser.parse(dataset["file_path"])
    
    # Limit rows
    preview_df = df.head(min(rows, settings.MAX_ROWS_PREVIEW))
    
    return {
        "success": True,
        "data": {
            "columns": list(preview_df.columns),
            "rows": preview_df.to_dict(orient="records"),
            "total_rows": len(df),
            "preview_rows": len(preview_df),
        },
    }