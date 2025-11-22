"""
Data Analysis Endpoints
"""

from typing import Optional, List
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from loguru import logger
import uuid
from datetime import datetime

from app.config import settings
from app.services.file_parser import FileParser
from app.services.data_profiler import DataProfiler
from app.services.chart_recommender import ChartRecommender
from app.services.insight_generator import InsightGenerator

# Import uploads database (shared state)
from app.api.v1.upload import uploads_db

router = APIRouter()

# ===========================================
# In-memory storage (replace with database)
# ===========================================
analyses_db: dict = {}


# ===========================================
# Pydantic Models
# ===========================================

class ChartConfig(BaseModel):
    id: str
    type: str
    title: str
    description: Optional[str] = None
    x_axis: Optional[dict] = None
    y_axis: Optional[dict] = None
    data: list
    colors: Optional[list] = None


class Insight(BaseModel):
    id: str
    type: str
    title: str
    description: str
    importance: str
    related_columns: list
    value: Optional[str] = None
    change: Optional[float] = None


class AnalysisResponse(BaseModel):
    id: str
    dataset_id: str
    status: str
    charts: List[ChartConfig]
    insights: List[Insight]
    summary: Optional[str] = None
    created_at: str


class KPIMetric(BaseModel):
    id: str
    label: str
    value: float
    format: str
    change: Optional[float] = None
    trend: Optional[str] = None


# ===========================================
# Background Analysis Task
# ===========================================

async def run_analysis(analysis_id: str, dataset_id: str):
    """
    Run analysis in background
    """
    try:
        # Get dataset
        dataset = uploads_db.get(dataset_id)
        if not dataset:
            analyses_db[analysis_id]["status"] = "failed"
            analyses_db[analysis_id]["error"] = "Dataset not found"
            return
        
        # Update status
        analyses_db[analysis_id]["status"] = "processing"
        
        # Parse file
        parser = FileParser()
        df = parser.parse(dataset["file_path"])
        
        # Profile data
        profiler = DataProfiler()
        profile = profiler.profile(df)
        
        # Generate chart recommendations
        recommender = ChartRecommender()
        charts = recommender.recommend(df, profile)
        
        # Generate insights
        generator = InsightGenerator()
        insights = await generator.generate(df, profile)
        
        # Generate KPIs
        kpis = profiler.generate_kpis(df)
        
        # Update analysis
        analyses_db[analysis_id].update({
            "status": "completed",
            "charts": charts,
            "insights": insights,
            "kpis": kpis,
            "summary": f"Analysis complete. Found {len(insights)} insights and generated {len(charts)} visualizations.",
            "completed_at": datetime.utcnow().isoformat(),
        })
        
        logger.info(f"Analysis completed: {analysis_id}")
        
    except Exception as e:
        logger.exception(f"Analysis failed: {e}")
        analyses_db[analysis_id]["status"] = "failed"
        analyses_db[analysis_id]["error"] = str(e)


# ===========================================
# Endpoints
# ===========================================

@router.post("/{dataset_id}")
async def start_analysis(
    dataset_id: str,
    background_tasks: BackgroundTasks,
):
    """
    Start analysis on a dataset
    
    - Profiles data structure
    - Recommends visualizations
    - Generates AI insights
    """
    
    # Check dataset exists
    if dataset_id not in uploads_db:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Create analysis record
    analysis_id = str(uuid.uuid4())
    analysis = {
        "id": analysis_id,
        "dataset_id": dataset_id,
        "status": "pending",
        "charts": [],
        "insights": [],
        "kpis": [],
        "summary": None,
        "created_at": datetime.utcnow().isoformat(),
    }
    
    analyses_db[analysis_id] = analysis
    
    # Start background analysis
    background_tasks.add_task(run_analysis, analysis_id, dataset_id)
    
    return {
        "success": True,
        "data": {
            "id": analysis_id,
            "dataset_id": dataset_id,
            "status": "pending",
            "message": "Analysis started",
        },
    }


@router.get("/{analysis_id}")
async def get_analysis(analysis_id: str):
    """
    Get analysis results
    """
    
    if analysis_id not in analyses_db:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    analysis = analyses_db[analysis_id]
    
    return {
        "success": True,
        "data": analysis,
    }


@router.get("/{analysis_id}/charts")
async def get_charts(analysis_id: str):
    """
    Get chart configurations for an analysis
    """
    
    if analysis_id not in analyses_db:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    analysis = analyses_db[analysis_id]
    
    if analysis["status"] != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"Analysis not complete. Status: {analysis['status']}",
        )
    
    return {
        "success": True,
        "data": analysis["charts"],
    }


@router.get("/{analysis_id}/insights")
async def get_insights(analysis_id: str):
    """
    Get AI-generated insights for an analysis
    """
    
    if analysis_id not in analyses_db:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    analysis = analyses_db[analysis_id]
    
    if analysis["status"] != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"Analysis not complete. Status: {analysis['status']}",
        )
    
    return {
        "success": True,
        "data": analysis["insights"],
    }


@router.get("/{analysis_id}/kpis")
async def get_kpis(analysis_id: str):
    """
    Get KPI metrics for an analysis
    """
    
    if analysis_id not in analyses_db:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    analysis = analyses_db[analysis_id]
    
    if analysis["status"] != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"Analysis not complete. Status: {analysis['status']}",
        )
    
    return {
        "success": True,
        "data": analysis.get("kpis", []),
    }


@router.delete("/{analysis_id}")
async def delete_analysis(analysis_id: str):
    """
    Delete an analysis
    """
    
    if analysis_id not in analyses_db:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    del analyses_db[analysis_id]
    
    return {
        "success": True,
        "message": "Analysis deleted successfully",
    }