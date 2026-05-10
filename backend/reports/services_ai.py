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
        
        # Enhanced Simulation: Create a nuanced comment based on marks
        avg_score = sum([float(m.score) for m in marks]) / len(marks) if marks else 0
        strength_subjects = [m.subject.name for m in marks if float(m.score) >= 80]
        improvement_subjects = [m.subject.name for m in marks if float(m.score) < 50]
        
        strength_text = f" particularly excelling in {', '.join(strength_subjects)}" if strength_subjects else ""
        improvement_text = f" However, {student.first_name} should focus more on {', '.join(improvement_subjects)} to improve the overall grade." if improvement_subjects else " Maintain this level of dedication across all units."
        
        ai_draft = (
            f"{student.first_name} has achieved an average of {avg_score:.1f}% this term{strength_text}."
            f"{improvement_text} Overall, {student.first_name} is a {'diligent' if avg_score > 70 else 'capable'} student with potential for further growth."
        )
        
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
