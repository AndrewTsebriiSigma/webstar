"""Rate limiting utilities for API endpoints."""
import time
from typing import Dict, Tuple
from fastapi import Request, HTTPException, status
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)


class InMemoryRateLimiter:
    """
    Simple in-memory rate limiter.
    
    For production with multiple servers, use Redis-based rate limiting.
    This is sufficient for single-server deployments.
    """
    
    def __init__(self):
        # Structure: {ip_address: {endpoint: [(timestamp, count)]}}
        self.requests: Dict[str, Dict[str, list]] = defaultdict(lambda: defaultdict(list))
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP from request."""
        # Check X-Forwarded-For header (if behind proxy)
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        
        # Check X-Real-IP header
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # Fallback to direct client
        if request.client:
            return request.client.host
        
        return "unknown"
    
    def _clean_old_requests(self, requests_list: list, window_seconds: int) -> list:
        """Remove requests outside the time window."""
        current_time = time.time()
        return [req for req in requests_list if current_time - req < window_seconds]
    
    def check_rate_limit(
        self,
        request: Request,
        max_requests: int,
        window_seconds: int,
        endpoint_key: str = None
    ) -> Tuple[bool, int]:
        """
        Check if request should be rate limited.
        
        Args:
            request: FastAPI Request object
            max_requests: Maximum number of requests allowed
            window_seconds: Time window in seconds
            endpoint_key: Optional custom key (defaults to request path)
        
        Returns:
            Tuple of (is_allowed, remaining_requests)
        """
        client_ip = self._get_client_ip(request)
        endpoint = endpoint_key or request.url.path
        
        # Clean old requests
        self.requests[client_ip][endpoint] = self._clean_old_requests(
            self.requests[client_ip][endpoint],
            window_seconds
        )
        
        # Check current count
        current_requests = len(self.requests[client_ip][endpoint])
        
        if current_requests >= max_requests:
            logger.warning(
                f"Rate limit exceeded for IP {client_ip} on endpoint {endpoint}. "
                f"Count: {current_requests}/{max_requests}"
            )
            return False, 0
        
        # Add current request
        self.requests[client_ip][endpoint].append(time.time())
        
        remaining = max_requests - current_requests - 1
        return True, remaining
    
    def require_rate_limit(
        self,
        request: Request,
        max_requests: int,
        window_seconds: int,
        endpoint_key: str = None
    ):
        """
        Check rate limit and raise HTTPException if exceeded.
        
        Usage in endpoints:
            rate_limiter.require_rate_limit(request, max_requests=5, window_seconds=60)
        """
        is_allowed, remaining = self.check_rate_limit(
            request, max_requests, window_seconds, endpoint_key
        )
        
        if not is_allowed:
            retry_after = window_seconds
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many requests. Please try again in {retry_after} seconds.",
                headers={"Retry-After": str(retry_after)}
            )


# Global rate limiter instance
rate_limiter = InMemoryRateLimiter()


# Decorator for easy use
def rate_limit(max_requests: int, window_seconds: int):
    """
    Decorator for rate limiting endpoints.
    
    Usage:
        @router.post("/login")
        @rate_limit(max_requests=5, window_seconds=60)
        async def login(request: Request, ...):
            ...
    """
    def decorator(func):
        async def wrapper(request: Request, *args, **kwargs):
            rate_limiter.require_rate_limit(request, max_requests, window_seconds)
            return await func(request, *args, **kwargs)
        return wrapper
    return decorator
