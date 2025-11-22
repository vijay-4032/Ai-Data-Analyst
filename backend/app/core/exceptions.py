"""
Custom Exception Classes
"""

from typing import Any, Dict, Optional


class APIException(Exception):
    """
    Base API Exception
    All custom exceptions should inherit from this
    """
    
    def __init__(
        self,
        status_code: int = 500,
        code: str = "INTERNAL_ERROR",
        detail: str = "An error occurred",
        details: Optional[Dict[str, Any]] = None,
    ):
        self.status_code = status_code
        self.code = code
        self.detail = detail
        self.details = details or {}
        super().__init__(self.detail)


# ===========================================
# Authentication Exceptions
# ===========================================

class AuthenticationError(APIException):
    """Authentication failed"""
    
    def __init__(self, detail: str = "Authentication failed"):
        super().__init__(
            status_code=401,
            code="AUTHENTICATION_ERROR",
            detail=detail,
        )


class InvalidTokenError(APIException):
    """Invalid or expired token"""
    
    def __init__(self, detail: str = "Invalid or expired token"):
        super().__init__(
            status_code=401,
            code="INVALID_TOKEN",
            detail=detail,
        )


class PermissionDeniedError(APIException):
    """User doesn't have permission"""
    
    def __init__(self, detail: str = "Permission denied"):
        super().__init__(
            status_code=403,
            code="PERMISSION_DENIED",
            detail=detail,
        )


# ===========================================
# Resource Exceptions
# ===========================================

class NotFoundError(APIException):
    """Resource not found"""
    
    def __init__(
        self,
        resource: str = "Resource",
        resource_id: Optional[str] = None,
    ):
        detail = f"{resource} not found"
        if resource_id:
            detail = f"{resource} with ID '{resource_id}' not found"
        
        super().__init__(
            status_code=404,
            code="NOT_FOUND",
            detail=detail,
            details={"resource": resource, "id": resource_id},
        )


class AlreadyExistsError(APIException):
    """Resource already exists"""
    
    def __init__(
        self,
        resource: str = "Resource",
        field: Optional[str] = None,
        value: Optional[str] = None,
    ):
        detail = f"{resource} already exists"
        if field and value:
            detail = f"{resource} with {field} '{value}' already exists"
        
        super().__init__(
            status_code=409,
            code="ALREADY_EXISTS",
            detail=detail,
            details={"resource": resource, "field": field, "value": value},
        )


# ===========================================
# Validation Exceptions
# ===========================================

class ValidationError(APIException):
    """Validation failed"""
    
    def __init__(
        self,
        detail: str = "Validation failed",
        errors: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            status_code=422,
            code="VALIDATION_ERROR",
            detail=detail,
            details={"errors": errors or {}},
        )


class InvalidFileError(APIException):
    """Invalid file uploaded"""
    
    def __init__(
        self,
        detail: str = "Invalid file",
        filename: Optional[str] = None,
        reason: Optional[str] = None,
    ):
        super().__init__(
            status_code=400,
            code="INVALID_FILE",
            detail=detail,
            details={"filename": filename, "reason": reason},
        )


class FileTooLargeError(APIException):
    """File exceeds size limit"""
    
    def __init__(
        self,
        max_size: int,
        actual_size: int,
        filename: Optional[str] = None,
    ):
        super().__init__(
            status_code=413,
            code="FILE_TOO_LARGE",
            detail=f"File exceeds maximum size of {max_size / (1024*1024):.1f} MB",
            details={
                "max_size": max_size,
                "actual_size": actual_size,
                "filename": filename,
            },
        )


# ===========================================
# Processing Exceptions
# ===========================================

class ProcessingError(APIException):
    """Error during data processing"""
    
    def __init__(
        self,
        detail: str = "Processing failed",
        step: Optional[str] = None,
    ):
        super().__init__(
            status_code=500,
            code="PROCESSING_ERROR",
            detail=detail,
            details={"step": step},
        )


class AnalysisError(APIException):
    """Error during data analysis"""
    
    def __init__(
        self,
        detail: str = "Analysis failed",
        dataset_id: Optional[str] = None,
    ):
        super().__init__(
            status_code=500,
            code="ANALYSIS_ERROR",
            detail=detail,
            details={"dataset_id": dataset_id},
        )


# ===========================================
# AI Service Exceptions
# ===========================================

class AIServiceError(APIException):
    """AI service error"""
    
    def __init__(
        self,
        detail: str = "AI service error",
        provider: Optional[str] = None,
    ):
        super().__init__(
            status_code=503,
            code="AI_SERVICE_ERROR",
            detail=detail,
            details={"provider": provider},
        )


class AIRateLimitError(APIException):
    """AI service rate limit exceeded"""
    
    def __init__(
        self,
        detail: str = "AI service rate limit exceeded",
        retry_after: Optional[int] = None,
    ):
        super().__init__(
            status_code=429,
            code="AI_RATE_LIMIT",
            detail=detail,
            details={"retry_after": retry_after},
        )


# ===========================================
# Rate Limiting Exceptions
# ===========================================

class RateLimitExceededError(APIException):
    """Rate limit exceeded"""
    
    def __init__(
        self,
        limit: int,
        window: int,
        retry_after: Optional[int] = None,
    ):
        super().__init__(
            status_code=429,
            code="RATE_LIMIT_EXCEEDED",
            detail=f"Rate limit of {limit} requests per {window} seconds exceeded",
            details={
                "limit": limit,
                "window": window,
                "retry_after": retry_after,
            },
        )