from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import UserCreate, UserLogin, UserResponse, UserRoleUpdate, Token
from app.services.auth_service import register_user, authenticate_user, get_current_user
from app.core.security import create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED, summary="Register a new user")
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Create a new account with email and hashed password."""
    user = register_user(db, user_in)
    access_token = create_access_token(user.id)
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.post("/login", response_model=Token, summary="User login")
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Authenticate with email and password to receive session token."""
    user = authenticate_user(db, credentials.email, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(user.id)
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse, summary="Get current authenticated user")
def get_me(current_user: User = Depends(get_current_user)):
    """Return profile of currently logged-in user."""
    return UserResponse.model_validate(current_user)


@router.put("/role", response_model=UserResponse, summary="Update active user role")
def update_role(
    role_in: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Switch or assign role between student, recruiter, and college_tp."""
    valid_roles = {"student", "recruiter", "college_tp"}
    target_role = role_in.role.lower().strip()
    if target_role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role '{role_in.role}'. Allowed roles are: {', '.join(sorted(valid_roles))}."
        )
    current_user.role = target_role
    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)
