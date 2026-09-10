"""
Image analysis service for uploaded images and image URLs.
Analyzes file size, dimensions, format, and provides optimization suggestions.
"""
from PIL import Image
import io
import requests


def analyze_uploaded_image(image_file):
    """
    Analyze an uploaded image file.
    
    Args:
        image_file: Django UploadedFile object
        
    Returns:
        dict with analysis results
    """
    try:
        # Read image
        img = Image.open(image_file)
        
        # Basic info
        file_size_bytes = image_file.size
        file_size_kb = round(file_size_bytes / 1024, 2)
        file_size_mb = round(file_size_bytes / (1024 * 1024), 2)
        
        width, height = img.size
        format_name = img.format or "Unknown"
        mode = img.mode  # RGB, RGBA, L, etc.
        
        # Calculate aspect ratio
        gcd_val = _gcd(width, height)
        aspect_ratio = f"{width // gcd_val}:{height // gcd_val}"
        
        # Determine if image has transparency
        has_transparency = mode in ("RGBA", "LA", "P") and (
            "transparency" in img.info or 
            (mode == "P" and "transparency" in img.info)
        )
        
        # Size analysis
        if file_size_kb > 1000:
            size_status = "poor"
            size_rating = "Very Large"
            size_suggestion = f"Image is {file_size_mb} MB. Compress to under 200 KB for web use."
        elif file_size_kb > 500:
            size_status = "poor"
            size_rating = "Large"
            size_suggestion = f"Image is {file_size_kb} KB. Compress to under 200 KB for optimal web performance."
        elif file_size_kb > 200:
            size_status = "warning"
            size_rating = "Moderate"
            size_suggestion = f"Image is {file_size_kb} KB. Consider compressing to under 200 KB."
        elif file_size_kb > 100:
            size_status = "good"
            size_rating = "Good"
            size_suggestion = f"Image size ({file_size_kb} KB) is acceptable for web use."
        else:
            size_status = "excellent"
            size_rating = "Excellent"
            size_suggestion = f"Image is well optimized at {file_size_kb} KB."
        
        # Dimension analysis
        total_pixels = width * height
        megapixels = round(total_pixels / 1_000_000, 2)
        
        if width > 3000 or height > 3000:
            dimension_status = "warning"
            dimension_suggestion = f"Dimensions ({width}×{height}) are very large. Consider resizing for web use."
        elif width > 2000 or height > 2000:
            dimension_status = "warning"
            dimension_suggestion = f"Dimensions ({width}×{height}) are large. May need resizing depending on use case."
        else:
            dimension_status = "good"
            dimension_suggestion = f"Dimensions ({width}×{height}) are suitable for web use."
        
        # Format recommendations
        format_recommendations = []
        if format_name == "PNG" and not has_transparency:
            format_recommendations.append("PNG without transparency — consider converting to JPEG for smaller file size.")
        elif format_name == "BMP":
            format_recommendations.append("BMP format is uncompressed — convert to JPEG or PNG for web use.")
        elif format_name == "TIFF":
            format_recommendations.append("TIFF format is not web-friendly — convert to JPEG or PNG.")
        elif format_name == "JPEG" and file_size_kb > 200:
            format_recommendations.append("JPEG is good for photos, but file size is large — increase compression.")
        elif format_name == "PNG" and file_size_kb > 200:
            format_recommendations.append("PNG is good for graphics, but file size is large — optimize or convert to WebP.")
        elif format_name == "GIF":
            format_recommendations.append("GIF format — consider using PNG for static images or WebP for animations.")
        
        if not format_recommendations:
            format_recommendations.append(f"{format_name} format is appropriate for this image.")
        
        # Compression estimate
        estimated_savings = 0
        if file_size_kb > 200:
            if format_name in ("PNG", "BMP", "TIFF"):
                estimated_savings = round(file_size_kb * 0.6, 2)  # 60% reduction possible
            elif format_name == "JPEG":
                estimated_savings = round(file_size_kb * 0.4, 2)  # 40% reduction possible
        
        # Overall score (0-100)
        score = 100
        if file_size_kb > 1000:
            score -= 40
        elif file_size_kb > 500:
            score -= 30
        elif file_size_kb > 200:
            score -= 15
        
        if width > 3000 or height > 3000:
            score -= 20
        elif width > 2000 or height > 2000:
            score -= 10
        
        if format_name in ("BMP", "TIFF"):
            score -= 20
        
        score = max(0, score)
        
        if score >= 80:
            overall_status = "excellent"
            overall_message = "Image is well optimized for web use."
        elif score >= 60:
            overall_status = "good"
            overall_message = "Image is acceptable but could be optimized further."
        elif score >= 40:
            overall_status = "warning"
            overall_message = "Image needs optimization for better web performance."
        else:
            overall_status = "poor"
            overall_message = "Image is poorly optimized and needs significant compression."
        
        # Optimization tips
        optimization_tips = []
        if file_size_kb > 200:
            optimization_tips.append("Use image compression tools like TinyPNG, ImageOptim, or Squoosh.")
        if width > 2000 or height > 2000:
            optimization_tips.append("Resize image to appropriate dimensions for your use case.")
        if format_name in ("BMP", "TIFF"):
            optimization_tips.append("Convert to web-friendly formats (JPEG, PNG, or WebP).")
        if format_name == "PNG" and not has_transparency and file_size_kb > 100:
            optimization_tips.append("Convert to JPEG if image is a photo without transparency needs.")
        optimization_tips.append("Consider using modern formats like WebP or AVIF for better compression.")
        optimization_tips.append("Use lazy loading attribute when displaying on web pages.")
        
        return {
            "success": True,
            "file_info": {
                "name": image_file.name,
                "size_bytes": file_size_bytes,
                "size_kb": file_size_kb,
                "size_mb": file_size_mb,
                "format": format_name,
                "mode": mode,
            },
            "dimensions": {
                "width": width,
                "height": height,
                "aspect_ratio": aspect_ratio,
                "total_pixels": total_pixels,
                "megapixels": megapixels,
            },
            "properties": {
                "has_transparency": has_transparency,
                "color_mode": mode,
            },
            "analysis": {
                "size_status": size_status,
                "size_rating": size_rating,
                "size_suggestion": size_suggestion,
                "dimension_status": dimension_status,
                "dimension_suggestion": dimension_suggestion,
                "format_recommendations": format_recommendations,
                "estimated_savings_kb": estimated_savings,
            },
            "optimization": {
                "tips": optimization_tips,
            },
            "score": {
                "value": score,
                "status": overall_status,
                "message": overall_message,
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to analyze image: {str(e)}"
        }


def _gcd(a, b):
    """Calculate greatest common divisor for aspect ratio."""
    while b:
        a, b = b, a % b
    return a


def analyze_image_from_url(image_url):
    """
    Fetch an image from a URL and analyze it using Pillow.

    Args:
        image_url: Direct URL to an image file

    Returns:
        dict with analysis results (same shape as analyze_uploaded_image)
    """
    try:
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            )
        }
        response = requests.get(image_url, timeout=15, headers=headers)
        response.raise_for_status()

        content = response.content
        file_size_bytes = len(content)

        # Detect filename from URL
        from urllib.parse import urlparse
        path = urlparse(image_url).path
        name = path.split("/")[-1] or "image"

        # Use Pillow to open
        img = Image.open(io.BytesIO(content))

        # Build a fake file-like object with .size and .name attributes
        class _FakeFile:
            pass

        fake = _FakeFile()
        fake.size = file_size_bytes
        fake.name = name

        result = _analyze_pil_image(img, fake)
        result["source"] = "url"
        result["source_url"] = image_url
        return result

    except requests.exceptions.SSLError:
        return {"success": False, "error": "SSL certificate error fetching image URL."}
    except requests.exceptions.ConnectionError:
        return {"success": False, "error": "Connection failed — could not reach image URL."}
    except requests.exceptions.Timeout:
        return {"success": False, "error": "Request timed out fetching image URL."}
    except requests.exceptions.HTTPError as e:
        return {"success": False, "error": f"HTTP error fetching image: {str(e)}"}
    except Exception as e:
        return {"success": False, "error": f"Failed to analyze image from URL: {str(e)}"}


def analyze_uploaded_image(image_file):
    """
    Analyze an uploaded image file (Django UploadedFile).
    """
    try:
        img = Image.open(image_file)
        result = _analyze_pil_image(img, image_file)
        result["source"] = "upload"
        return result
    except Exception as e:
        return {"success": False, "error": f"Failed to analyze image: {str(e)}"}


def _analyze_pil_image(img, file_obj):
    """
    Core analysis logic shared by both upload and URL paths.

    Args:
        img: PIL Image object
        file_obj: object with .size (bytes) and .name attributes
    """
    file_size_bytes = file_obj.size
    file_size_kb = round(file_size_bytes / 1024, 2)
    file_size_mb = round(file_size_bytes / (1024 * 1024), 2)

    width, height = img.size
    format_name = img.format or "Unknown"
    mode = img.mode

    gcd_val = _gcd(width, height)
    aspect_ratio = f"{width // gcd_val}:{height // gcd_val}"

    has_transparency = mode in ("RGBA", "LA", "P") and (
        "transparency" in img.info or (mode == "P" and "transparency" in img.info)
    )

    # Size analysis
    if file_size_kb > 1000:
        size_status = "poor"
        size_rating = "Very Large"
        size_suggestion = f"Image is {file_size_mb} MB. Compress to under 200 KB for web use."
    elif file_size_kb > 500:
        size_status = "poor"
        size_rating = "Large"
        size_suggestion = f"Image is {file_size_kb} KB. Compress to under 200 KB for optimal web performance."
    elif file_size_kb > 200:
        size_status = "warning"
        size_rating = "Needs Compression"
        size_suggestion = f"Image is {file_size_kb} KB. Compress image — target under 200 KB."
    elif file_size_kb > 100:
        size_status = "good"
        size_rating = "Good"
        size_suggestion = f"Image size ({file_size_kb} KB) is acceptable for web use."
    else:
        size_status = "excellent"
        size_rating = "Optimized"
        size_suggestion = f"Image is well optimized at {file_size_kb} KB."

    total_pixels = width * height
    megapixels = round(total_pixels / 1_000_000, 2)

    if width > 3000 or height > 3000:
        dimension_status = "warning"
        dimension_suggestion = f"Dimensions ({width}×{height}) are very large. Consider resizing for web use."
    elif width > 2000 or height > 2000:
        dimension_status = "warning"
        dimension_suggestion = f"Dimensions ({width}×{height}) are large. May need resizing."
    else:
        dimension_status = "good"
        dimension_suggestion = f"Dimensions ({width}×{height}) are suitable for web use."

    format_recommendations = []
    if format_name == "PNG" and not has_transparency:
        format_recommendations.append("PNG without transparency — consider converting to JPEG for smaller file size.")
    elif format_name == "BMP":
        format_recommendations.append("BMP format is uncompressed — convert to JPEG or PNG for web use.")
    elif format_name == "TIFF":
        format_recommendations.append("TIFF format is not web-friendly — convert to JPEG or PNG.")
    elif format_name == "JPEG" and file_size_kb > 200:
        format_recommendations.append("JPEG is good for photos, but file size is large — increase compression.")
    elif format_name == "PNG" and file_size_kb > 200:
        format_recommendations.append("PNG is large — optimize or convert to WebP.")
    elif format_name == "GIF":
        format_recommendations.append("GIF format — use PNG for static images or WebP for animations.")

    if not format_recommendations:
        format_recommendations.append(f"{format_name} format is appropriate for this image.")

    estimated_savings = 0
    if file_size_kb > 200:
        if format_name in ("PNG", "BMP", "TIFF"):
            estimated_savings = round(file_size_kb * 0.6, 2)
        elif format_name == "JPEG":
            estimated_savings = round(file_size_kb * 0.4, 2)

    # Optimization verdict (matches requirement: "Compress image" or "Optimized")
    if file_size_kb > 200:
        optimization_verdict = "Compress image"
        verdict_status = "warning" if file_size_kb <= 500 else "poor"
    else:
        optimization_verdict = "Optimized"
        verdict_status = "good"

    score = 100
    if file_size_kb > 1000:
        score -= 40
    elif file_size_kb > 500:
        score -= 30
    elif file_size_kb > 200:
        score -= 15
    if width > 3000 or height > 3000:
        score -= 20
    elif width > 2000 or height > 2000:
        score -= 10
    if format_name in ("BMP", "TIFF"):
        score -= 20
    score = max(0, score)

    if score >= 80:
        overall_status = "excellent"
        overall_message = "Image is well optimized for web use."
    elif score >= 60:
        overall_status = "good"
        overall_message = "Image is acceptable but could be optimized further."
    elif score >= 40:
        overall_status = "warning"
        overall_message = "Image needs optimization for better web performance."
    else:
        overall_status = "poor"
        overall_message = "Image is poorly optimized and needs significant compression."

    optimization_tips = []
    if file_size_kb > 200:
        optimization_tips.append("Use image compression tools like TinyPNG, ImageOptim, or Squoosh.")
    if width > 2000 or height > 2000:
        optimization_tips.append("Resize image to appropriate dimensions for your use case.")
    if format_name in ("BMP", "TIFF"):
        optimization_tips.append("Convert to web-friendly formats (JPEG, PNG, or WebP).")
    if format_name == "PNG" and not has_transparency and file_size_kb > 100:
        optimization_tips.append("Convert to JPEG if image is a photo without transparency needs.")
    optimization_tips.append("Consider using modern formats like WebP or AVIF for better compression.")
    optimization_tips.append("Use lazy loading attribute when displaying on web pages.")

    return {
        "success": True,
        "file_info": {
            "name": file_obj.name,
            "size_bytes": file_size_bytes,
            "size_kb": file_size_kb,
            "size_mb": file_size_mb,
            "format": format_name,
            "mode": mode,
        },
        "dimensions": {
            "width": width,
            "height": height,
            "aspect_ratio": aspect_ratio,
            "total_pixels": total_pixels,
            "megapixels": megapixels,
        },
        "properties": {
            "has_transparency": has_transparency,
            "color_mode": mode,
        },
        "analysis": {
            "size_status": size_status,
            "size_rating": size_rating,
            "size_suggestion": size_suggestion,
            "dimension_status": dimension_status,
            "dimension_suggestion": dimension_suggestion,
            "format_recommendations": format_recommendations,
            "estimated_savings_kb": estimated_savings,
            "optimization_verdict": optimization_verdict,
            "verdict_status": verdict_status,
        },
        "optimization": {
            "tips": optimization_tips,
        },
        "score": {
            "value": score,
            "status": overall_status,
            "message": overall_message,
        },
    }
