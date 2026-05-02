from django.utils import timezone
from exams.models import Mark
from .models import StudentReport

class AIReportService:
    @staticmethod
    def generate_narrative_draft(report_id):
        report = StudentReport.objects.get(id=report_id)
        student = report.student
        
        # 1. Gather Context
        marks = Mark.objects.filter(student=student, exam=report.exam).select_related('subject')
        performance_summary = ", ".join([f"{m.subject.name}: {m.score}%" for m in marks])
        
        # 2. Prompt Engineering
        prompt = f"""
        Act as a professional educator. Write a balanced terminal report comment for {student.first_name}.
        Performance Summary: {performance_summary}.
        Tone: Encouraging but honest. 
        Focus: Mention strong subjects and areas for improvement.
        Keep it under 100 words.
        """

        # 3. LLM API Call (Mocked for now)
        # In production: response = openai.ChatCompletion.create(model="gpt-4", messages=[...])
        ai_draft = f"AI PREVIEW: {student.first_name} has shown steady progress this term, particularly in subjects like {marks[0].subject.name if marks else 'General Studies'}. While academic performance is stable, more focus on consistent review would yield even better results. Keep up the effort!"
        
        # 4. Save Draft
        report.ai_comment_draft = ai_draft
        report.is_ai_generated = True
        report.generated_at = timezone.now()
        report.save()
        
        return ai_draft

    @staticmethod
    def approve_comment(report_id, teacher_user, final_comment):
        report = StudentReport.objects.get(id=report_id)
        report.teacher_comment = final_comment
        report.status = 'REVIEWED'
        report.reviewed_by = teacher_user
        report.save()
        return report
