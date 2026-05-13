from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId

from app.database import get_collection
from app.models.user import UserCreate, UserLogin, UserUpdate, UserResponse, TokenResponse
from app.services.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """Registrar un nuevo usuario."""
    users = get_collection("users")

    # Check if email already exists
    existing = await users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un usuario con este correo electrónico",
        )

    # Check if username already exists
    existing_username = await users.find_one({"username": user_data.username})
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un usuario con este nombre de usuario",
        )

    # Create user document
    user_doc = {
        "email": user_data.email,
        "username": user_data.username,
        "hashed_password": hash_password(user_data.password),
        "university_id": user_data.university_id,
        "career_id": user_data.career_id,
        "approved_subjects": [],
        "total_approved_credits": 0,
        "is_active": True,
    }

    result = await users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    # Generate token
    access_token = create_access_token(data={"sub": user_id})

    return TokenResponse(
        access_token=access_token,
        user=UserResponse(
            _id=user_id,
            email=user_data.email,
            username=user_data.username,
            university_id=user_data.university_id,
            career_id=user_data.career_id,
        ),
    )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Iniciar sesión."""
    users = get_collection("users")
    user = await users.find_one({"email": credentials.email})

    if not user or not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas",
        )

    user_id = str(user["_id"])
    access_token = create_access_token(data={"sub": user_id})

    return TokenResponse(
        access_token=access_token,
        user=UserResponse(
            _id=user_id,
            email=user["email"],
            username=user["username"],
            university_id=user.get("university_id"),
            career_id=user.get("career_id"),
            approved_subjects=user.get("approved_subjects", []),
            total_approved_credits=user.get("total_approved_credits", 0),
        ),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Obtener perfil del usuario autenticado."""
    return UserResponse(
        _id=current_user["_id"],
        email=current_user["email"],
        username=current_user["username"],
        university_id=current_user.get("university_id"),
        career_id=current_user.get("career_id"),
        approved_subjects=current_user.get("approved_subjects", []),
        total_approved_credits=current_user.get("total_approved_credits", 0),
    )


@router.put("/me", response_model=UserResponse)
async def update_me(
    update_data: UserUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Actualizar perfil del usuario autenticado."""
    users = get_collection("users")
    update_fields = {k: v for k, v in update_data.model_dump().items() if v is not None}

    if update_fields:
        await users.update_one(
            {"_id": ObjectId(current_user["_id"])},
            {"$set": update_fields},
        )

    # Return updated user
    updated = await users.find_one({"_id": ObjectId(current_user["_id"])})
    updated["_id"] = str(updated["_id"])
    return UserResponse(
        _id=updated["_id"],
        email=updated["email"],
        username=updated["username"],
        university_id=updated.get("university_id"),
        career_id=updated.get("career_id"),
        approved_subjects=updated.get("approved_subjects", []),
        total_approved_credits=updated.get("total_approved_credits", 0),
    )
