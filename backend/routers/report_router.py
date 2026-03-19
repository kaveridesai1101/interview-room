from fastapi import APIRouter, Depends, HTTPException, Header
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os
from ..database import get_db
from ..models.surveillance import Incident
from ..services.pdf_service import pdf_service

router = APIRouter(prefix="/reports", tags=["reports"])

@router.post("/generate/{incident_id}")
async def generate_incident_report(incident_id: int, db: Session = Depends(get_db), x_user_id: str = Header("admin")):
    """
    Generates a professional PDF report for a specific incident.
    """
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    try:
        # Generate the PDF
        report_path = pdf_service.create_report(incident)
        
        # Save path to database
        incident.report_path = report_path
        db.commit()
        db.refresh(incident)
        
        return {
            "status": "success",
            "incident_id": incident_id,
            "report_url": report_path,
            "message": "Professional PDF report generated successfully."
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"PDF Generation Failed: {str(e)}")

@router.get("/download/{incident_id}")
async def download_report(incident_id: int, db: Session = Depends(get_db), x_user_id: str = Header("admin")):
    """
    Downloads the previously generated PDF report. Only allows access to the incident owner or admin.
    """
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    
    if not incident or not incident.report_path:
        raise HTTPException(status_code=404, detail="Report not found or not generated yet.")
        
    if x_user_id != "admin" and str(incident.owner_id) != x_user_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this report.")

    if not os.path.exists(incident.report_path):
        raise HTTPException(status_code=404, detail="Report file missing on server.")
        
    return FileResponse(
        path=incident.report_path, 
        filename=os.path.basename(incident.report_path),
        media_type='application/pdf'
    )
