from datetime import date
from backend.app.database import SessionLocal, Base, engine
import backend.app.models
from backend.app.models.dak import DakRecord, DakAction
from backend.app.models.employee import Employee
from backend.app.models.training import TrainingCourse, TrainingNomination
from backend.app.models.translation import GlossaryTerm, TranslationMemoryUnit
from backend.app.models.meeting import OlicMeeting, MeetingAgenda, MeetingResolution, ActionTakenReport
from backend.app.models.compliance import QprSubmission, QprSection33Item
from backend.app.models.policy_document import PolicyDocument

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # 1. Seed Training Courses
    if db.query(TrainingCourse).count() == 0:
        courses = [
            TrainingCourse(course_code="PRABODH", name_hi="प्रबोध (Prabodh)", name_en="Prabodh Course", duration_months=6, description="प्रारंभिक हिंदी पाठ्यक्रम (Category D कर्मचारियों के लिए)"),
            TrainingCourse(course_code="PRAVEEN", name_hi="प्रवीण (Praveen)", name_en="Praveen Course", duration_months=6, description="मध्यम हिंदी पाठ्यक्रम (Category C एवं उत्तीर्ण प्रबोध कर्मचारियों के लिए)"),
            TrainingCourse(course_code="PRAGYA", name_hi="प्राज्ञ (Pragya)", name_en="Pragya Course", duration_months=6, description="उच्च हिंदी पाठ्यक्रम (Category B एवं उत्तीर्ण प्रवीण कर्मचारियों के लिए)"),
            TrainingCourse(course_code="TYPING", name_hi="हिंदी टंकण (Hindi Typing)", name_en="Hindi Typing", duration_months=6, description="कनिष्ठ लिपिकों एवं टंककों के लिए अनिवार्य कंप्यूटर टंकण"),
            TrainingCourse(course_code="STENO", name_hi="हिंदी आशुलिपि (Hindi Stenography)", name_en="Hindi Stenography", duration_months=12, description="अंग्रेजी आशुलिपिकों के लिए हिंदी स्टेनो प्रशिक्षण")
        ]
        db.add_all(courses)
        db.commit()
        print("Training courses seeded.")

    # 2. Seed Employees
    if db.query(Employee).count() == 0:
        employees = [
            Employee(
                emp_code="EMP-1001",
                name_hi="राजेश शर्मा",
                name_en="Rajesh Sharma",
                designation="वरिष्ठ अनुभाग अधिकारी / Senior Section Officer",
                department="प्रशासन / Administration",
                employee_category="A",
                mother_tongue="Hindi",
                hindi_qualification="M.A. Hindi",
                hindi_knowledge_level="Proficient"
            ),
            Employee(
                emp_code="EMP-1002",
                name_hi="गुरप्रीत सिंह",
                name_en="Gurpreet Singh",
                designation="लेखा सहायक / Accounts Assistant",
                department="वित्त एवं लेखा / Finance & Accounts",
                employee_category="B",
                mother_tongue="Punjabi",
                hindi_qualification="Matriculation Urdu/Punjabi",
                hindi_knowledge_level="Working"
            ),
            Employee(
                emp_code="EMP-1003",
                name_hi="अमिताभ घोष",
                name_en="Amitava Ghosh",
                designation="कनिष्ठ अभियंता / Junior Engineer",
                department="सिग्नल एवं दूरसंचार / S&T",
                employee_category="C",
                mother_tongue="Bengali",
                hindi_qualification="Secondary Bengali medium",
                hindi_knowledge_level="Working"
            ),
            Employee(
                emp_code="EMP-1004",
                name_hi="एस. वेंकटरामन",
                name_en="S. Venkatraman",
                designation="कार्यालय अधीक्षक / Office Superintendent",
                department="स्थापना शाखा / Personnel Branch",
                employee_category="D",
                mother_tongue="Tamil",
                hindi_qualification="None",
                hindi_knowledge_level="None"
            ),
            Employee(
                emp_code="EMP-1005",
                name_hi="सुनीता पटेल",
                name_en="Sunita Patel",
                designation="कनिष्ठ लिपिक / Junior Clerk cum Typist",
                department="राजभाषा अनुभाग / Rajbhasha Cell",
                employee_category="B",
                mother_tongue="Gujarati",
                is_typist=True,
                hindi_qualification="Matriculation",
                hindi_knowledge_level="Working"
            )
        ]
        db.add_all(employees)
        db.commit()
        print("Employees seeded.")

    # 3. Seed Nominations
    if db.query(TrainingNomination).count() == 0:
        emp4 = db.query(Employee).filter(Employee.emp_code == "EMP-1004").first()
        emp5 = db.query(Employee).filter(Employee.emp_code == "EMP-1005").first()
        c_prabodh = db.query(TrainingCourse).filter(TrainingCourse.course_code == "PRABODH").first()
        c_typing = db.query(TrainingCourse).filter(TrainingCourse.course_code == "TYPING").first()

        nominations = [
            TrainingNomination(
                employee_id=emp4.id,
                course_id=c_prabodh.id,
                status="Under Training",
                batch_number="CHTI/2026/BATCH-1",
                training_center="केंद्रीय हिंदी प्रशिक्षण संस्थान (CHTI) नई दिल्ली",
                nomination_date=date(2026, 1, 10),
                start_date=date(2026, 1, 15)
            ),
            TrainingNomination(
                employee_id=emp5.id,
                course_id=c_typing.id,
                status="Nominated",
                batch_number="TYP/2026/Q1",
                training_center="विभागीय कंप्यूटर प्रशिक्षण केंद्र",
                nomination_date=date(2026, 2, 1)
            )
        ]
        db.add_all(nominations)
        db.commit()
        print("Nominations seeded.")

    # 4. Seed Dak Records
    if db.query(DakRecord).count() == 0:
        dak_items = [
            DakRecord(
                dak_unique_no="DAK/2026/0001",
                receipt_date=date(2026, 3, 1),
                letter_no="RB/OL/2026/CIR-14",
                letter_date=date(2026, 2, 25),
                sender_name="निदेशक (राजभाषा) / Director (OL)",
                sender_department="रेलवे बोर्ड / Railway Board, नई दिल्ली",
                sender_region="A",
                subject_hi="राजभाषा नियम 1976 के नियम 10(4) के अंतर्गत कार्यालयों के निरीक्षण संबंधी दिशानिर्देश।",
                subject_en="Guidelines regarding inspection of offices notified under Rule 10(4) of OL Rules 1976.",
                category="Policy",
                priority="Urgent",
                target_date=date(2026, 3, 20),
                current_status="In Progress",
                assigned_to="राजेश शर्मा",
                summary_notes="सभी क्षेत्रीय कार्यालयों का निरीक्षण रोस्टर तैयार करके प्रस्तुत किया जाना है।"
            ),
            DakRecord(
                dak_unique_no="DAK/2026/0002",
                receipt_date=date(2026, 3, 2),
                letter_no="MHA/DOL/QPR-IV/2026",
                letter_date=date(2026, 2, 28),
                sender_name="संयुक्त सचिव (राजभाषा)",
                sender_department="गृह मंत्रालय, राजभाषा विभाग",
                sender_region="A",
                subject_hi="चौथी तिमाही (जनवरी-मार्च 2026) की तिमाही प्रगति रिपोर्ट (QPR) ऑनलाइन पोर्टल पर अपलोड करने बाबत।",
                subject_en="Regarding uploading of Q4 Progress Report on the Rajbhasha online portal.",
                category="Compliance",
                priority="Top Priority",
                target_date=date(2026, 4, 15),
                current_status="Pending",
                assigned_to="राजभाषा अधिकारी",
                summary_notes="सभी विभागों से आंकड़े संकलित कर 15 अप्रैल तक प्रेषित करें।"
            ),
            DakRecord(
                dak_unique_no="DAK/2026/0003",
                receipt_date=date(2026, 2, 15),
                letter_no="GM/ENGG/TENDER/88",
                letter_date=date(2026, 2, 12),
                sender_name="मुख्य अभियंता",
                sender_department="इंजीनियरिंग शाखा",
                sender_region="A",
                subject_hi="वार्षिक ट्रैक मेंटेनेंस निविदा प्रारूप का हिंदी अनुवाद।",
                subject_en="Hindi translation of Annual Track Maintenance tender document.",
                category="Translation",
                priority="Normal",
                target_date=date(2026, 2, 28),
                current_status="Disposed",
                assigned_to="अनुवादक",
                summary_notes="धारा 3(3) अनुपालन हेतु द्विभाषी निविदा जारी की गई।"
            )
        ]
        db.add_all(dak_items)
        db.commit()

        # Add sample action to dak 1
        d1 = db.query(DakRecord).filter(DakRecord.dak_unique_no == "DAK/2026/0001").first()
        if d1:
            act = DakAction(
                dak_id=d1.id,
                action_date=date(2026, 3, 2),
                action_taken_by="राजेश शर्मा",
                action_details="पत्र को सभी शाखा अधिकारियों को आवश्यक अनुपालन हेतु अग्रेषित किया गया एवं निरीक्षण प्रारूप तैयार किया जा रहा है।",
                status_after_action="In Progress"
            )
            db.add(act)
            db.commit()
        print("Dak records seeded.")

    # 5. Seed Translation Memory
    if db.query(TranslationMemoryUnit).count() == 0:
        tm_items = [
            TranslationMemoryUnit(
                source_text="It has been decided by the Competent Authority with immediate effect.",
                target_text="सक्षम प्राधिकारी द्वारा तत्काल प्रभाव से यह निर्णय लिया गया है।",
                source_lang="en",
                target_lang="hi",
                domain="Administration",
                reference_circular_no="RB/Admin/2025/08",
                usage_count=14
            ),
            TranslationMemoryUnit(
                source_text="Action Taken Report on the decisions of the previous meeting may kindly be furnished.",
                target_text="कृपया विगत बैठक के निर्णयों पर की गई कार्रवाई की रिपोर्ट प्रस्तुत करने का कष्ट करें।",
                source_lang="en",
                target_lang="hi",
                domain="Administration",
                reference_circular_no="OLIC/ATR/2025/Q3",
                usage_count=9
            ),
            TranslationMemoryUnit(
                source_text="In terms of Section 3(3) of the Official Languages Act 1963, both Hindi and English shall be used.",
                target_text="राजभाषा अधिनियम 1963 की धारा 3(3) के अनुसार, हिंदी और अंग्रेजी दोनों भाषाओं का प्रयोग अनिवार्य है।",
                source_lang="en",
                target_lang="hi",
                domain="Legal/Rajbhasha",
                reference_circular_no="MHA/OL/Policy-2024",
                usage_count=22
            )
        ]
        db.add_all(tm_items)
        db.commit()
        print("Translation Memory units seeded.")

    # 6. Seed OLIC Meeting & Resolutions
    if db.query(OlicMeeting).count() == 0:
        meeting = OlicMeeting(
            meeting_type="OLIC",
            meeting_number="56th OLIC Meeting",
            quarter="Q3 (अक्टूबर - दिसंबर)",
            financial_year="2025-2026",
            meeting_date=date(2026, 1, 20),
            venue="मुख्यालय समिति कक्ष, प्रथम तल / Committee Room, 1st Floor",
            chairperson_name="श्री आलोक वर्मा, भा.प्र.से.",
            chairperson_designation="महाप्रबंधक / General Manager",
            attendees_list="1. श्री आलोक वर्मा, अध्यक्ष\n2. श्री राजेश शर्मा, सदस्य सचिव\n3. श्रीमती सुनीता पटेल, कनिष्ठ लिपिक\n4. सभी विभागाध्यक्ष एवं अनुभाग अधिकारी उपस्थित थे।"
        )
        db.add(meeting)
        db.flush()

        agenda1 = MeetingAgenda(
            meeting_id=meeting.id,
            item_number=1,
            title_hi="विगत बैठक के कार्यवृत्त की पुष्टि एवं कार्रवाई की गई रिपोर्ट (ATR) की समीक्षा",
            title_en="Confirmation of Minutes of the previous meeting & Review of Action Taken Report",
            discussion_summary="समिति द्वारा विगत बैठक के निर्णयों की समीक्षा की गई। अधिकांश मदों का शत-प्रतिशत अनुपालन सुनिश्चित किया गया।"
        )
        db.add(agenda1)
        db.flush()

        res1 = MeetingResolution(
            agenda_id=agenda1.id,
            resolution_number="OLIC/56/RES-01",
            decision_text_hi="सभी लंबित प्रस्तावों को आगामी 15 दिनों में पूर्ण करके अनुपालन रिपोर्ट प्रस्तुत की जाए।",
            responsible_officer="वरिष्ठ अनुभाग अधिकारी (प्रशासन)",
            responsible_department="प्रशासन शाखा",
            target_date=date(2026, 2, 10),
            resolution_status="Complied"
        )
        db.add(res1)
        db.flush()

        atr1 = ActionTakenReport(
            resolution_id=res1.id,
            report_date=date(2026, 2, 8),
            action_taken_summary="प्रशासन शाखा द्वारा सभी लंबित मदों का निष्पादन कर दिया गया है एवं विस्तृत रिपोर्ट संचिका में दर्ज है।",
            current_status="Complied",
            reporting_officer="राजेश शर्मा"
        )
        db.add(atr1)

        agenda2 = MeetingAgenda(
            meeting_id=meeting.id,
            item_number=2,
            title_hi="राजभाषा अधिनियम 1963 की धारा 3(3) का शत-प्रतिशत अनुपालन सुनिश्चित करना",
            title_en="Ensuring 100% compliance with Section 3(3) of Official Languages Act 1963",
            discussion_summary="समीक्षा में पाया गया कि सामान्य आदेश एवं परिपत्र द्विभाषी जारी किए जा रहे हैं परंतु निविदा सूचनाओं के संबंध में विशेष सतर्कता अपेक्षित है।"
        )
        db.add(agenda2)
        db.flush()

        res2 = MeetingResolution(
            agenda_id=agenda2.id,
            resolution_number="OLIC/56/RES-02",
            decision_text_hi="कोई भी निविदा या संविदा केवल अंग्रेजी में जारी नहीं होगी। राजभाषा अनुभाग से अग्रिम अनुवाद कराकर ही अनुमोदन दिया जाए।",
            responsible_officer="मुख्य सामग्री प्रबंधक / वरिष्ठ मंडल वित्त प्रबंधक",
            responsible_department="भंडार एवं इंजीनियरिंग शाखा",
            target_date=date(2026, 3, 31),
            resolution_status="Open"
        )
        db.add(res2)

        db.commit()
        print("OLIC meeting & resolutions seeded.")

    # 7. Seed QPR Submission
    if db.query(QprSubmission).count() == 0:
        qpr = QprSubmission(
            year=2025,
            quarter="Q3",
            office_name="केंद्रीय प्रशासनिक मंडल कार्यालय / Central Administrative Divisional Office",
            office_region="A",
            letters_to_region_a_hi=850,
            letters_to_region_a_total=850, # 100%
            letters_to_region_b_hi=220,
            letters_to_region_b_total=240, # 91.6%
            letters_to_region_c_hi=140,
            letters_to_region_c_total=210, # 66.6%
            letters_received_hindi=410,
            letters_replied_hindi=410, # 100% Rule 5
            total_computers=120,
            computers_with_hindi_facility=120,
            remarks="क क्षेत्र के लिए शत-प्रतिशत हिंदी पत्राचार का लक्ष्य प्राप्त कर लिया गया है।"
        )
        db.add(qpr)
        db.flush()

        sec_items = [
            QprSection33Item(qpr_id=qpr.id, document_category="सामान्य आदेश (General Orders)", total_issued=45, bilingual_issued=45, only_english_issued=0, compliance_percent=100.0),
            QprSection33Item(qpr_id=qpr.id, document_category="कार्यालय ज्ञापन / परिपत्र (Circulars)", total_issued=80, bilingual_issued=80, only_english_issued=0, compliance_percent=100.0),
            QprSection33Item(qpr_id=qpr.id, document_category="संविदाएं एवं करार (Contracts)", total_issued=18, bilingual_issued=18, only_english_issued=0, compliance_percent=100.0),
            QprSection33Item(qpr_id=qpr.id, document_category="निविदा सूचनाएं (Tenders)", total_issued=32, bilingual_issued=32, only_english_issued=0, compliance_percent=100.0)
        ]
        db.add_all(sec_items)
        db.commit()
        print("QPR sample seeded.")

    # 8. Seed Sample Official Language Policy Documents for Ready Reference
    if db.query(PolicyDocument).count() == 0:
        policies = [
            PolicyDocument(
                title="हिंदी में मूल टिप्पण एवं आलेखन हेतु नकद पुरस्कार योजना",
                circular_no="MHA/DOL/INCENTIVE/2024-25",
                issuing_authority="गृह मंत्रालय, राजभाषा विभाग, नई दिल्ली",
                issue_date=date(2024, 4, 1),
                policy_category="Incentives & Cash Awards",
                original_filename="MHA_Incentive_Scheme_Noting_Drafting.pdf",
                stored_filepath="data/uploads/policies/sample_incentive.pdf",
                file_type="PDF",
                page_count=2,
                summary_notes="क और ख क्षेत्र में न्यूनतम 20,000 शब्द एवं ग क्षेत्र में न्यूनतम 10,000 शब्द प्रतिवर्ष लिखने वाले अधिकारियों/कर्मचारियों हेतु नकद पुरस्कार का प्रावधान। प्रथम पुरस्कार: ₹5000/-, द्वितीय पुरस्कार: ₹3000/-, तृतीय पुरस्कार: ₹2000/-।",
                extracted_text=(
                    "=== [पृष्ठ 1] ===\n"
                    "विषय: केंद्र सरकार के कर्मचारियों के लिए हिंदी में मूल टिप्पण एवं आलेखन हेतु नकद पुरस्कार योजना।\n\n"
                    "1. पात्रता एवं मानदंड (Eligibility Criteria):\n"
                    "यह योजना केंद्र सरकार के सभी मंत्रालयों, विभागों, संबद्ध एवं अधीनस्थ कार्यालयों, स्वायत्त निकायों, सार्वजनिक उपक्रमों और बैंकों में लागू होगी।\n"
                    "(क) 'क' और 'ख' क्षेत्र में स्थित कार्यालयों के कर्मचारियों को एक वित्तीय वर्ष में न्यूनतम 20,000 (बीस हजार) शब्द हिंदी में मूल रूप से टिप्पण/प्रारूपण में लिखने होंगे।\n"
                    "(ख) 'ग' क्षेत्र में स्थित कार्यालयों के कर्मचारियों को न्यूनतम 10,000 (दस हजार) शब्द हिंदी में मूल रूप से लिखने होंगे।\n"
                    "(ग) आशुलिपिक और टंकक इस योजना में भाग लेने के पात्र नहीं होंगे क्योंकि उन्हें अलग से टंकण प्रोत्साहन भत्ता देय होता है।\n\n"
                    "=== [पृष्ठ 2] ===\n"
                    "2. पुरस्कारों की संख्या एवं धनराशि (Award Slabs):\n"
                    "प्रत्येक मंत्रालय/विभाग अथवा स्वतंत्र कार्यालय में प्रतिवर्ष निम्नलिखित पुरस्कार प्रदान किए जाएंगे:\n"
                    "(i) प्रथम पुरस्कार (दो पुरस्कार): प्रत्येक को ₹5,000/- (पांच हजार रुपये मात्र)\n"
                    "(ii) द्वितीय पुरस्कार (तीन पुरस्कार): प्रत्येक को ₹3,000/- (तीन हजार रुपये मात्र)\n"
                    "(iii) तृतीय पुरस्कार (पांच पुरस्कार): प्रत्येक को ₹2,000/- (दो हजार रुपये मात्र)\n\n"
                    "3. मूल्यांकन समिति (Evaluation Committee):\n"
                    "उपरोक्त पुरस्कारों के चयन हेतु विभागाध्यक्ष की अध्यक्षता में 3 सदस्यीय समिति गठित की जाएगी, जिसमें राजभाषा अधिकारी सदस्य सचिव होंगे।"
                )
            ),
            PolicyDocument(
                title="राजभाषा नियम 1976 के नियम 10(4) के अधीन कार्यालयों की अधिसूचना",
                circular_no="DOL/REG-10(4)/NOTIF/2023",
                issuing_authority="गृह मंत्रालय, राजभाषा विभाग",
                issue_date=date(2023, 7, 15),
                policy_category="Notified Offices (Rule 10(4))",
                original_filename="Rule_10_4_Notified_Offices_Guidelines.pdf",
                stored_filepath="data/uploads/policies/sample_rule_10_4.pdf",
                file_type="PDF",
                page_count=1,
                summary_notes="जिस कार्यालय के 80% या उससे अधिक कर्मचारी हिंदी का कार्यसाधक ज्ञान प्राप्त कर चुके हैं, उसे भारत के राजपत्र में अधिसूचित करना अनिवार्य है।",
                extracted_text=(
                    "=== [पृष्ठ 1] ===\n"
                    "भारत सरकार / गृह मंत्रालय / राजभाषा विभाग\n"
                    "विषय: राजभाषा नियम 1976 के नियम 10(4) के अंतर्गत केंद्रीय कार्यालयों की अधिसूचना।\n\n"
                    "1. वैधानिक प्रावधान:\n"
                    "राजभाषा (संघ के शासकीय प्रयोजनों के लिए प्रयोग) नियम, 1976 के नियम 10 के उप-नियम (4) के अनुसार, यदि किसी केंद्रीय कार्यालय के 80% (अस्सी प्रतिशत) या उससे अधिक कर्मचारी हिंदी का कार्यसाधक ज्ञान प्राप्त कर चुके हैं, तो उस कार्यालय के नाम को भारत के राजपत्र (Gazette of India) में अधिसूचित किया जाना अनिवार्य है।\n\n"
                    "2. अधिसूचना के उपरांत दायित्व (Rule 8(4)):\n"
                    "नियम 10(4) के अधीन अधिसूचित होने के पश्चात कार्यालय प्रमुख नियम 8(4) के अंतर्गत विनिर्दिष्ट अनुभागों/कर्मचारियों को अपने दैनंदिन कार्य, टिप्पणियां तथा प्रारूप केवल हिंदी में ही लिखने के लिए व्यक्तिगत आदेश जारी करेंगे।\n\n"
                    "3. वार्षिक समीक्षा:\n"
                    "प्रत्येक प्रशासनिक विभाग द्वारा प्रतिवर्ष अपने अधीनस्थ समस्त क्षेत्रीय कार्यालयों की कर्मचारी स्थिति की समीक्षा की जाएगी।"
                )
            )
        ]
        db.add_all(policies)
        db.commit()
        print("Policy reference documents seeded.")

    db.close()
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    seed_database()
