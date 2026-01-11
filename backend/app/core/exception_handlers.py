"""Custom exception handlers for FastAPI.

Provides secure error handling that doesn't leak internal details to users.
"""
from fastapi import Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from pydantic import ValidationError
import logging

logger = logging.getLogger(__name__)


async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    """
    Handle SQLAlchemy exceptions.
    
    Log the full error internally but return a generic message to the user.
    """
    logger.error(
        f"Database error on {request.method} {request.url.path}: {str(exc)}",
        exc_info=True
    )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "A database error occurred. Please try again later.",
            "error_type": "database_error"
        }
    )


async def validation_exception_handler(request: Request, exc: ValidationError):
    """
    Handle Pydantic validation exceptions.
    
    Return user-friendly validation messages without internal details.
    """
    logger.warning(
        f"Validation error on {request.method} {request.url.path}: {str(exc)}"
    )
    
    # Extract field errors
    errors = []
    for error in exc.errors():
        field = " -> ".join(str(loc) for loc in error["loc"])
        message = error["msg"]
        errors.append({"field": field, "message": message})
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Validation failed",
            "errors": errors
        }
    )


async def generic_exception_handler(request: Request, exc: Exception):
    """
    Handle all unhandled exceptions.
    
    Log the full error but return a generic message to the user.
    """
    logger.error(
        f"Unhandled exception on {request.method} {request.url.path}: {str(exc)}",
        exc_info=True
    )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An unexpected error occurred. Please try again later.",
            "error_type": "internal_error"
        }
    )
