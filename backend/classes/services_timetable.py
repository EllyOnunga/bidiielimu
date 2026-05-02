from datetime import datetime, time, timedelta
from django.core.exceptions import ValidationError
from .models import ScheduleSlot, Stream, SubjectAssignment, CurriculumRequirement, Classroom
from teachers.models import Teacher, TeacherAvailability

class TimetableGenerator:
    """
    Automated Timetable Solver using a Constraint-Satisfaction approach.
    """

    @staticmethod
    def generate_for_stream(stream_id, start_time="08:00", end_time="16:00", period_duration=40):
        stream = Stream.objects.get(id=stream_id)
        assignments = SubjectAssignment.objects.filter(stream=stream)
        
        # 1. Calculate required slots
        slots_to_fill = []
        for assignment in assignments:
            req = CurriculumRequirement.objects.filter(
                grade_level=stream.grade_level, 
                subject=assignment.subject
            ).first()
            count = req.weekly_periods if req else 5 # Default to 5
            for _ in range(count):
                slots_to_fill.append(assignment)

        # 2. Define the grid
        days = [0, 1, 2, 3, 4] # Mon-Fri
        start_dt = datetime.strptime(start_time, "%H:%M")
        end_dt = datetime.strptime(end_time, "%H:%M")
        
        periods = []
        curr = start_dt
        while curr + timedelta(minutes=period_duration) <= end_dt:
            periods.append((curr.time(), (curr + timedelta(minutes=period_duration)).time()))
            curr += timedelta(minutes=period_duration + 5) # 5 min break

        # 3. Clear existing schedule (Optional/Configurable)
        # ScheduleSlot.objects.filter(stream=stream).delete()

        # 4. Fill the grid (Greedy with Backtracking-like check)
        success_count = 0
        failed_assignments = []

        for assignment in slots_to_fill:
            placed = False
            for day in days:
                for p_start, p_end in periods:
                    # Check if slot is empty for this stream
                    if ScheduleSlot.objects.filter(stream=stream, day_of_week=day, start_time=p_start).exists():
                        continue

                    # Check Teacher availability
                    if not TimetableGenerator.is_teacher_available(assignment.teacher, day, p_start, p_end):
                        continue

                    # Check Room availability (pick first available)
                    room = TimetableGenerator.get_available_room(day, p_start, p_end)
                    if not room:
                        continue

                    # Place the slot
                    try:
                        ScheduleSlot.objects.create(
                            stream=stream,
                            subject=assignment.subject,
                            teacher=assignment.teacher,
                            classroom=room,
                            day_of_week=day,
                            start_time=p_start,
                            end_time=p_end
                        )
                        placed = True
                        success_count += 1
                        break
                    except ValidationError:
                        continue
                
                if placed: break
            
            if not placed:
                failed_assignments.append(f"{assignment.subject.name} ({assignment.teacher})")

        return {
            "success": success_count,
            "failed": failed_assignments,
            "total_requested": len(slots_to_fill)
        }

    @staticmethod
    def is_teacher_available(teacher, day, start, end):
        # Check explicit unavailability
        unavailable = TeacherAvailability.objects.filter(
            teacher=teacher,
            day_of_week=day,
            is_available=False,
            start_time__lt=end,
            end_time__gt=start
        ).exists()
        if unavailable: return False

        # Check existing schedule bookings
        is_booked = ScheduleSlot.objects.filter(
            teacher=teacher,
            day_of_week=day,
            start_time__lt=end,
            end_time__gt=start
        ).exists()
        return not is_booked

    @staticmethod
    def get_available_room(day, start, end):
        rooms = Classroom.objects.all()
        for room in rooms:
            is_occupied = ScheduleSlot.objects.filter(
                classroom=room,
                day_of_week=day,
                start_time__lt=end,
                end_time__gt=start
            ).exists()
            if not is_occupied:
                return room
        return None
