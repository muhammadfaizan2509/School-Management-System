from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.auth import get_password_hash
from app import models

def seed_database(db: Session):
    # Check if database is already seeded
    if db.query(models.User).filter(models.User.username == "admin").first():
        print("Database already contains data. Skipping seeding.")
        return

    print("Seeding database with realistic initial school management data...")

    # 1. Create Admin
    admin_user = models.User(
        username="admin",
        email="admin@apexacademy.edu",
        password_hash=get_password_hash("admin123"),
        role="admin",
        full_name="Dr. Arthur Pendelton",
        phone="+1 555-0100",
        avatar="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
        is_active=True
    )
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)

    # 2. Create Teachers
    teachers_data = [
        {"username": "teacher_math", "email": "mathers@apexacademy.edu", "full_name": "Dr. Sarah Mathers", "emp_id": "EMP-101", "qual": "Ph.D. Mathematics", "spec": "Algebra & Calculus", "phone": "+1 555-0101"},
        {"username": "teacher_science", "email": "vance@apexacademy.edu", "full_name": "Prof. Alan Vance", "emp_id": "EMP-102", "qual": "M.Sc. Physics", "spec": "Applied Physics & Robotics", "phone": "+1 555-0102"},
        {"username": "teacher_english", "email": "clara@apexacademy.edu", "full_name": "Ms. Clara Evans", "emp_id": "EMP-103", "qual": "M.A. English Literature", "spec": "World Literature & Composition", "phone": "+1 555-0103"},
        {"username": "teacher_cs", "email": "robert@apexacademy.edu", "full_name": "Mr. Robert Sterling", "emp_id": "EMP-104", "qual": "M.S. Computer Science", "spec": "Software Engineering & Data Structures", "phone": "+1 555-0104"},
    ]

    teacher_objs = []
    for t in teachers_data:
        t_user = models.User(
            username=t["username"],
            email=t["email"],
            password_hash=get_password_hash("teacher123"),
            role="teacher",
            full_name=t["full_name"],
            phone=t["phone"],
            avatar=f"https://api.dicebear.com/7.x/avataaars/svg?seed={t['username']}"
        )
        db.add(t_user)
        db.commit()
        db.refresh(t_user)

        t_detail = models.TeacherDetail(
            user_id=t_user.id,
            employee_id=t["emp_id"],
            qualification=t["qual"],
            specialization=t["spec"],
            joining_date="2021-08-15"
        )
        db.add(t_detail)
        teacher_objs.append(t_user)

    db.commit()

    # 3. Create Classes
    class1 = models.Class(name="Grade 10", grade_level=10, section="A", room_number="Room 302", class_teacher_id=teacher_objs[0].id)
    class2 = models.Class(name="Grade 9", grade_level=9, section="B", room_number="Room 204", class_teacher_id=teacher_objs[1].id)
    class3 = models.Class(name="Grade 11", grade_level=11, section="A", room_number="Lab 101", class_teacher_id=teacher_objs[3].id)
    
    db.add_all([class1, class2, class3])
    db.commit()
    db.refresh(class1)
    db.refresh(class2)
    db.refresh(class3)

    # 4. Create Subjects
    subj1 = models.Subject(name="Advanced Mathematics", code="MATH-101", class_id=class1.id, teacher_id=teacher_objs[0].id)
    subj2 = models.Subject(name="Physics & Mechanics", code="PHY-201", class_id=class1.id, teacher_id=teacher_objs[1].id)
    subj3 = models.Subject(name="English Literature", code="ENG-102", class_id=class1.id, teacher_id=teacher_objs[2].id)
    subj4 = models.Subject(name="Computer Programming", code="CS-301", class_id=class1.id, teacher_id=teacher_objs[3].id)
    
    subj5 = models.Subject(name="General Science", code="SCI-901", class_id=class2.id, teacher_id=teacher_objs[1].id)
    subj6 = models.Subject(name="Mathematics Basics", code="MATH-901", class_id=class2.id, teacher_id=teacher_objs[0].id)

    db.add_all([subj1, subj2, subj3, subj4, subj5, subj6])
    db.commit()

    # 5. Create Parents
    parent_user = models.User(
        username="parent_morgan",
        email="parent.morgan@gmail.com",
        password_hash=get_password_hash("parent123"),
        role="parent",
        full_name="Marcus Morgan",
        phone="+1 555-0901",
        avatar="https://api.dicebear.com/7.x/avataaars/svg?seed=parent_morgan"
    )
    db.add(parent_user)
    db.commit()
    db.refresh(parent_user)

    # 6. Create Students
    students_data = [
        {"username": "alex_morgan", "name": "Alex Morgan", "roll": "STU-101", "class": class1.id, "dob": "2009-04-12", "gender": "Male", "parent": parent_user.id},
        {"username": "david_smith", "name": "David Smith", "roll": "STU-102", "class": class1.id, "dob": "2009-06-25", "gender": "Male", "parent": None},
        {"username": "emily_watson", "name": "Emily Watson", "roll": "STU-103", "class": class1.id, "dob": "2009-09-18", "gender": "Female", "parent": None},
        {"username": "james_brown", "name": "James Brown", "roll": "STU-104", "class": class1.id, "dob": "2009-01-30", "gender": "Male", "parent": None},
        {"username": "sophia_chen", "name": "Sophia Chen", "roll": "STU-105", "class": class1.id, "dob": "2009-11-05", "gender": "Female", "parent": None},
        {"username": "liam_johnson", "name": "Liam Johnson", "roll": "STU-106", "class": class2.id, "dob": "2010-02-14", "gender": "Male", "parent": None},
        {"username": "olivia_davis", "name": "Olivia Davis", "roll": "STU-107", "class": class2.id, "dob": "2010-07-22", "gender": "Female", "parent": None},
        {"username": "noah_wilson", "name": "Noah Wilson", "roll": "STU-108", "class": class3.id, "dob": "2008-03-09", "gender": "Male", "parent": None},
    ]

    student_users = []
    for s in students_data:
        s_user = models.User(
            username=s["username"],
            email=f"{s['username']}@apexacademy.edu",
            password_hash=get_password_hash("student123"),
            role="student",
            full_name=s["name"],
            phone="+1 555-08" + s["roll"][-2:],
            avatar=f"https://api.dicebear.com/7.x/avataaars/svg?seed={s['username']}"
        )
        db.add(s_user)
        db.commit()
        db.refresh(s_user)

        s_detail = models.StudentDetail(
            user_id=s_user.id,
            roll_number=s["roll"],
            class_id=s["class"],
            parent_id=s["parent"],
            date_of_birth=s["dob"],
            gender=s["gender"],
            address="124 Campus Drive, Innovation City",
            guardian_contact="+1 555-0999"
        )
        db.add(s_detail)
        student_users.append(s_user)

    db.commit()

    # 7. Create 15 Days of Attendance Records
    today = datetime.now().date()
    statuses = ["present", "present", "present", "present", "absent", "late", "present"]
    for day_offset in range(15):
        date_str = (today - timedelta(days=day_offset)).strftime("%Y-%m-%d")
        for idx, st_user in enumerate(student_users):
            status = statuses[(idx + day_offset) % len(statuses)]
            att = models.Attendance(
                student_id=st_user.id,
                class_id=class1.id if idx < 5 else (class2.id if idx < 7 else class3.id),
                date=date_str,
                status=status,
                remarks="On time" if status == "present" else ("Traffic delay" if status == "late" else "Medical leave")
            )
            db.add(att)
    db.commit()

    # 8. Create Exams & Grades
    exam1 = models.Exam(title="Midterm Examination 2026", class_id=class1.id, subject_id=subj1.id, exam_date="2026-03-15", max_marks=100.0)
    exam2 = models.Exam(title="Physics Practical Test", class_id=class1.id, subject_id=subj2.id, exam_date="2026-03-20", max_marks=50.0)
    exam3 = models.Exam(title="English Essay Contest", class_id=class1.id, subject_id=subj3.id, exam_date="2026-03-25", max_marks=100.0)
    exam4 = models.Exam(title="Python Programming Quiz", class_id=class1.id, subject_id=subj4.id, exam_date="2026-04-02", max_marks=100.0)

    db.add_all([exam1, exam2, exam3, exam4])
    db.commit()
    db.refresh(exam1)
    db.refresh(exam2)
    db.refresh(exam3)
    db.refresh(exam4)

    # Grades for Alex Morgan & peers
    grades_list = [
        # Alex Morgan (student_users[0])
        models.Grade(exam_id=exam1.id, student_id=student_users[0].id, marks_obtained=94.5, grade_letter="A+", remarks="Outstanding performance!"),
        models.Grade(exam_id=exam2.id, student_id=student_users[0].id, marks_obtained=47.0, grade_letter="A+", remarks="Excellent practical skill"),
        models.Grade(exam_id=exam3.id, student_id=student_users[0].id, marks_obtained=88.0, grade_letter="A", remarks="Well articulated essay"),
        models.Grade(exam_id=exam4.id, student_id=student_users[0].id, marks_obtained=98.0, grade_letter="A+", remarks="Flawless code design"),
        
        # David Smith (student_users[1])
        models.Grade(exam_id=exam1.id, student_id=student_users[1].id, marks_obtained=82.0, grade_letter="B+", remarks="Good logic"),
        models.Grade(exam_id=exam2.id, student_id=student_users[1].id, marks_obtained=38.0, grade_letter="B", remarks="Needs care in experiments"),
        models.Grade(exam_id=exam4.id, student_id=student_users[1].id, marks_obtained=91.0, grade_letter="A", remarks="Great problem solving"),
        
        # Emily Watson (student_users[2])
        models.Grade(exam_id=exam1.id, student_id=student_users[2].id, marks_obtained=96.0, grade_letter="A+", remarks="Top of the class"),
        models.Grade(exam_id=exam3.id, student_id=student_users[2].id, marks_obtained=94.0, grade_letter="A+", remarks="Creative writing"),
    ]
    db.add_all(grades_list)
    db.commit()

    # 9. Create Fee Invoices
    invoices = [
        models.FeeInvoice(student_id=student_users[0].id, title="Fall Semester Tuition 2026", amount=1250.00, due_date="2026-09-01", status="paid", paid_date="2026-08-10"),
        models.FeeInvoice(student_id=student_users[0].id, title="Science Lab & Computer Fee", amount=350.00, due_date="2026-09-15", status="pending", paid_date=None),
        models.FeeInvoice(student_id=student_users[0].id, title="Annual Sports & Library Pass", amount=150.00, due_date="2026-08-01", status="overdue", paid_date=None),

        models.FeeInvoice(student_id=student_users[1].id, title="Fall Semester Tuition 2026", amount=1250.00, due_date="2026-09-01", status="paid", paid_date="2026-08-05"),
        models.FeeInvoice(student_id=student_users[2].id, title="Fall Semester Tuition 2026", amount=1250.00, due_date="2026-09-01", status="paid", paid_date="2026-08-12"),
        models.FeeInvoice(student_id=student_users[3].id, title="Fall Semester Tuition 2026", amount=1250.00, due_date="2026-09-01", status="pending", paid_date=None),
    ]
    db.add_all(invoices)
    db.commit()

    # 10. Create School Announcements / Notices
    notices = [
        models.Notice(
            title="🏫 Annual Science & Robotics Fair 2026",
            content="We are excited to announce the annual Apex Science and Robotics Fair scheduled for October 15th! All students from Grades 9-12 are invited to present their innovative projects.",
            target_role="all",
            priority="urgent",
            posted_by_id=admin_user.id
        ),
        models.Notice(
            title="📝 Midterm Examination Schedule Released",
            content="The official date sheet for the upcoming Midterm Examinations has been published in the Portal. Please review your exam timings and room allocations carefully.",
            target_role="all",
            priority="high",
            posted_by_id=admin_user.id
        ),
        models.Notice(
            title="🍎 Faculty Development Workshop on AI in Education",
            content="All teaching faculty are requested to attend a mandatory interactive workshop on incorporating modern educational tech tools this Friday at 3:00 PM in Conference Room B.",
            target_role="teacher",
            priority="normal",
            posted_by_id=admin_user.id
        ),
        models.Notice(
            title="💳 Fee Reminder for Fall Semester 2026",
            content="Dear Parents & Students, please ensure pending semester tuition and laboratory fees are settled before September 15th to avoid late processing charges.",
            target_role="student",
            priority="high",
            posted_by_id=admin_user.id
        ),
    ]
    db.add_all(notices)
    db.commit()

    print("Database seeding completed successfully!")
