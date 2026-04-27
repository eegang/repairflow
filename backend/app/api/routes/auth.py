from fastapi import APIRouter, Depends, HTTPException, status
from app.db.database import get_db_facade
from app.db.facade import DatabaseFacade
from app.domain.models import User
from app.domain.schemas import UserCreate, UserOut, LoginRequest, AuthResponse
from app.core.auth_utils import verify_password, hash_password, create_access_token
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse)
async def register(user_data: UserCreate, db: DatabaseFacade = Depends(get_db_facade)):
    existing_user = await db.get_user_by_email(user_data.email)
    
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    
    hashed_password = hash_password(user_data.password)
    new_user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        company_name=user_data.company_name,
        phone=user_data.phone,
        password=hashed_password,
        role=user_data.role,
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    access_token = create_access_token(data={"sub": new_user.id})
    
    return AuthResponse(
        user=UserOut.model_validate(new_user),
        token=access_token,
    )


@router.post("/login", response_model=AuthResponse)
async def login(login_data: LoginRequest, db: DatabaseFacade = Depends(get_db_facade)):
    user = await db.get_user_by_email(login_data.email)
    
    if not user or not verify_password(login_data.password, user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is disabled")
    
    access_token = create_access_token(data={"sub": user.id})
    
    return AuthResponse(
        user=UserOut.model_validate(user),
        token=access_token,
    )


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

