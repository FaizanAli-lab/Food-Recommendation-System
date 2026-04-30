"""
Authentication Pydantic Models — Name + Password
"""

from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    password: str = Field(..., min_length=4, max_length=128)


class LoginRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    password: str = Field(..., min_length=4, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserProfile(BaseModel):
    name: str
