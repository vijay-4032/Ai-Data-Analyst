"""
Pydantic Schemas
Request and response models for API validation
"""

from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field, EmailStr, field_validator
from datetime import datetime
from enum import Enum


# ===========================================
# Enums
# ===========================================

class ColumnType(str, Enum):
    STRING = "string"
    INTEGER = "integer"
    FLOAT = "float"
    BOOLEAN = "boolean"
    DATETIME = "datetime"
    CATEGORY = "category"


class ChartType(str, Enum):
    LINE = "line"
    AREA = "area"
    BAR = "bar"
    PIE = "pie"
    SCATTER = "scatter"
    HEATMAP = "heatmap"


class InsightType(str, Enum):
    TREND = "trend"
    ANOMALY = "anomaly"
    CORRELATION = "correlation"
    DISTRIBUTION = "distribution"
    SUMMARY = "summary"
    RECOMMENDATION = "recommendation"


class Importance(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class AnalysisStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


# ===========================================
# Column Schemas
# ===========================================

class ColumnStats(BaseModel):
    """Statistics for a column"""
    min: Optional[Union[float, str]] = None
    max: Optional[Union[float, str]] = None
    mean: Optional[float] = None
    median: Optional[float] = None
    std: Optional[float] = None
    mode: Optional[Union[str, float]] = None
    sum: Optional[float] = None
    zeros: Optional[int] = None
    negative: Optional[int] = None
    top_values: Optional[List[Dict[str, Any]]] = None


class ColumnInfo(BaseModel):
    """Information about a dataset column"""
    name: str
    type: ColumnType
    dtype: Optional[str] = None
    nullable: bool = True
    unique: int = 0
    missing: int = 0
    missing_pct: float = 0.0
    sample: List[Any] = []
    stats: Optional[ColumnStats] = None


# ===========================================
# Dataset Schemas
# ===========================================

class DatasetBase(BaseModel):
    """Base dataset schema"""
    name: str
    filename: str


class DatasetCreate(DatasetBase):
    """Schema for creating a dataset"""
    pass


class DatasetResponse(DatasetBase):
    """Schema for dataset response"""
    id: str
    size: int
    row_count: int
    column_count: int
    columns: List[ColumnInfo]
    status: str = "ready"
    created_at: str
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True


class DatasetPreview(BaseModel):
    """Schema for dataset preview"""
    columns: List[str]
    rows: List[Dict[str, Any]]
    total_rows: int
    preview_rows: int


# ===========================================
# Chart Schemas
# ===========================================

class AxisConfig(BaseModel):
    """Configuration for chart axis"""
    field: str
    label: str
    type: str = "value"  # "value", "category", "time"
    format: Optional[str] = None


class ChartConfig(BaseModel):
    """Configuration for a chart"""
    id: str
    type: ChartType
    title: str
    description: Optional[str] = None
    x_axis: Optional[AxisConfig] = None
    y_axis: Optional[AxisConfig] = None
    data: List[Dict[str, Any]]
    colors: Optional[List[str]] = None
    options: Optional[Dict[str, Any]] = None


# ===========================================
# Insight Schemas
# ===========================================

class Insight(BaseModel):
    """AI-generated insight"""
    id: str
    type: InsightType
    title: str
    description: str
    importance: Importance = Importance.MEDIUM
    related_columns: List[str] = []
    value: Optional[str] = None
    change: Optional[float] = None


# ===========================================
# KPI Schemas
# ===========================================

class KPIFormat(str, Enum):
    NUMBER = "number"
    CURRENCY = "currency"
    PERCENT = "percent"
    COMPACT = "compact"


class KPITrend(str, Enum):
    UP = "up"
    DOWN = "down"
    STABLE = "stable"


class KPIMetric(BaseModel):
    """KPI metric card data"""
    id: str
    label: str
    value: Union[float, str]
    format: KPIFormat = KPIFormat.NUMBER
    change: Optional[float] = None
    change_label: Optional[str] = None
    trend: Optional[KPITrend] = None
    icon: Optional[str] = None


# ===========================================
# Analysis Schemas
# ===========================================

class AnalysisCreate(BaseModel):
    """Schema for creating an analysis"""
    dataset_id: str
    options: Optional[Dict[str, Any]] = None


class AnalysisResponse(BaseModel):
    """Schema for analysis response"""
    id: str
    dataset_id: str
    status: AnalysisStatus
    charts: List[ChartConfig] = []
    insights: List[Insight] = []
    kpis: List[KPIMetric] = []
    summary: Optional[str] = None
    error: Optional[str] = None
    created_at: str
    completed_at: Optional[str] = None


# ===========================================
# Chat Schemas
# ===========================================

class ChatRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class ChatMessage(BaseModel):
    """Chat message"""
    id: Optional[str] = None
    role: ChatRole
    content: str
    timestamp: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class ChatRequest(BaseModel):
    """Chat request"""
    message: str = Field(..., min_length=1, max_length=4000)
    session_id: Optional[str] = None
    dataset_id: Optional[str] = None
    stream: bool = False


class ChatResponse(BaseModel):
    """Chat response"""
    session_id: str
    message: ChatMessage


class ChatSession(BaseModel):
    """Chat session"""
    id: str
    dataset_id: Optional[str] = None
    messages: List[ChatMessage] = []
    created_at: str
    updated_at: str


# ===========================================
# User Schemas
# ===========================================

class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    name: str


class UserCreate(UserBase):
    """Schema for creating a user"""
    password: str = Field(..., min_length=8)
    
    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain digit")
        return v


class UserResponse(UserBase):
    """Schema for user response"""
    id: str
    avatar: Optional[str] = None
    created_at: str
    
    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    """Schema for login"""
    email: EmailStr
    password: str


# ===========================================
# Auth Schemas
# ===========================================

class Token(BaseModel):
    """JWT token response"""
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: int


class TokenPayload(BaseModel):
    """JWT token payload"""
    sub: str
    exp: datetime
    type: str = "access"


# ===========================================
# API Response Schemas
# ===========================================

class APIResponse(BaseModel):
    """Standard API response wrapper"""
    success: bool = True
    data: Optional[Any] = None
    message: Optional[str] = None


class APIError(BaseModel):
    """API error response"""
    success: bool = False
    error: Dict[str, Any]


class PaginatedResponse(BaseModel):
    """Paginated response wrapper"""
    success: bool = True
    data: List[Any]
    meta: Dict[str, Any] = Field(
        default_factory=lambda: {
            "page": 1,
            "limit": 10,
            "total": 0,
            "has_more": False,
        }
    )