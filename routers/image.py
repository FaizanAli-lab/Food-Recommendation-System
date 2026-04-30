from fastapi import APIRouter, File, UploadFile, HTTPException
import app_state

router = APIRouter(prefix="/image", tags=["image"])

ALLOWED_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"}


@router.post("/recognize")
async def recognize_food_image(file: UploadFile = File(...)):
    """
    Image recognition endpoint.
    Accepts an uploaded food image, runs OpenCV preprocessing +
    PyTorch MobileNetV2 inference, and returns:
      - detected food class + confidence
      - matched food from the database
      - up to 3 healthier alternatives
    """
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported image type: {file.content_type}. Use JPEG, PNG, or WebP.",
        )

    image_bytes = await file.read()
    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    recognizer = app_state.recognizer
    if recognizer is None:
        raise HTTPException(status_code=503, detail="Image recognizer not ready")

    foods_db = app_state.foods_cache
    result = recognizer.recognize(image_bytes, foods_db)
    return result
