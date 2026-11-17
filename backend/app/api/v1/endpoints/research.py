from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.entities import User, UserProfile, InventoryItem, ResearchQuery, ResearchReport
from app.schemas.dto import ResearchRequest, ResearchReportResponse
from app.services.search_service import search_service
from app.services.ai_agent import ai_agent_service

router = APIRouter()

FREE_TIER_DAILY_LIMIT = 5


def check_user_quota(user: User, db: Session) -> dict:
    """Calculate today's AI research usage and enforce daily limits for free tier users."""
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    used_today = (
        db.query(ResearchQuery)
        .filter(
            ResearchQuery.user_id == user.id,
            ResearchQuery.created_at >= today_start,
            ResearchQuery.status == "completed"
        )
        .count()
    )
    limit = 999 if user.tier == "premium" else FREE_TIER_DAILY_LIMIT
    remaining = max(0, limit - used_today)
    return {
        "tier": user.tier,
        "daily_limit": limit,
        "used_today": used_today,
        "remaining_today": remaining
    }


@router.get("/quota")
def get_my_quota(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Return user's current daily AI research allowance and usage."""
    return check_user_quota(current_user, db)


@router.post("/analyze", response_model=ResearchReportResponse)
async def analyze_product(
    request: ResearchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Start an automated research workflow:
    0. Verify daily AI usage quota.
    1. Retrieve user profile and past inventory notes.
    2. Search real-world online discussions, TikTok oEmbed, and Open Beauty Facts INCI list.
    3. Run 5-Agent AI synthesis including Rosacea & Acne clinical triggers.
    4. Persist query and report to database.
    """
    quota = check_user_quota(current_user, db)
    if quota["remaining_today"] <= 0:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Daily free AI research limit reached (5/5). Upgrade to MIRA Premium for unlimited research."
        )

    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    user_profile_dict = {
        "skin_type": profile.skin_type if profile else None,
        "skin_undertone": profile.skin_undertone if profile else None,
        "skin_concerns": profile.skin_concerns if profile else [],
        "allergies_sensitivities": profile.allergies_sensitivities if profile else [],
        "budget_level": profile.budget_level if profile else "medium"
    }

    inventory_items = db.query(InventoryItem).filter(InventoryItem.user_id == current_user.id).all()
    past_notes = [
        f"{item.product_name}: {item.experience_notes or 'Owned'} (Rating: {item.rating or '-'}/5)"
        for item in inventory_items
    ]

    query_record = ResearchQuery(
        user_id=current_user.id,
        query_text_or_url=request.query_or_url,
        status="processing"
    )
    db.add(query_record)
    db.commit()
    db.refresh(query_record)

    try:
        search_results = await search_service.search_reviews(request.query_or_url)

        analysis_result = await ai_agent_service.analyze_product(
            query=request.query_or_url,
            user_profile=user_profile_dict,
            search_results=search_results,
            user_inventory_notes=past_notes
        )

        product_name = analysis_result.get("product_name", request.query_or_url)
        query_record.product_name = product_name
        query_record.status = "completed"

        report_record = ResearchReport(
            query_id=query_record.id,
            summary=analysis_result.get("summary", ""),
            pros=analysis_result.get("pros", []),
            cons=analysis_result.get("cons", []),
            clinical_warnings=analysis_result.get("clinical_warnings", []),
            suitability_score=analysis_result.get("suitability_score", 70),
            suitability_reason=analysis_result.get("suitability_reason", ""),
            reality_check_verdict=analysis_result.get("reality_check_verdict", "CONSIDER"),
            reality_check_reason=analysis_result.get("reality_check_reason", ""),
            sources=analysis_result.get("sources", []),
            sponsored_flags=analysis_result.get("sponsored_flags", []),
            tokens_used=150
        )
        db.add(report_record)
        db.commit()
        db.refresh(report_record)

        return {
            "id": report_record.id,
            "query_id": query_record.id,
            "product_name": product_name,
            "summary": report_record.summary,
            "pros": report_record.pros,
            "cons": report_record.cons,
            "clinical_warnings": report_record.clinical_warnings,
            "suitability_score": report_record.suitability_score,
            "suitability_reason": report_record.suitability_reason,
            "reality_check_verdict": report_record.reality_check_verdict,
            "reality_check_reason": report_record.reality_check_reason,
            "sources": report_record.sources,
            "sponsored_flags": report_record.sponsored_flags,
            "created_at": report_record.created_at
        }

    except Exception as e:
        query_record.status = "failed"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to complete research: {str(e)}"
        )


@router.get("/history", response_model=List[ResearchReportResponse])
def get_research_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve past research queries and their generated reports."""
    queries = (
        db.query(ResearchQuery)
        .filter(ResearchQuery.user_id == current_user.id, ResearchQuery.status == "completed")
        .order_by(ResearchQuery.created_at.desc())
        .all()
    )
    history = []
    for q in queries:
        if q.report:
            history.append({
                "id": q.report.id,
                "query_id": q.id,
                "product_name": q.product_name or q.query_text_or_url,
                "summary": q.report.summary,
                "pros": q.report.pros,
                "cons": q.report.cons,
                "clinical_warnings": q.report.clinical_warnings or [],
                "suitability_score": q.report.suitability_score,
                "suitability_reason": q.report.suitability_reason,
                "reality_check_verdict": q.report.reality_check_verdict,
                "reality_check_reason": q.report.reality_check_reason,
                "sources": q.report.sources,
                "sponsored_flags": q.report.sponsored_flags,
                "created_at": q.report.created_at
            })
    return history
