from backend.app.schemas.dak import (
    DakRecordBase, DakRecordCreate, DakRecordUpdate, DakRecordResponse,
    DakActionCreate, DakActionResponse, DakAttachmentResponse
)
from backend.app.schemas.employee import (
    EmployeeBase, EmployeeCreate, EmployeeUpdate, EmployeeResponse
)
from backend.app.schemas.training import (
    TrainingCourseBase, TrainingCourseCreate, TrainingCourseResponse,
    TrainingNominationBase, TrainingNominationCreate, TrainingNominationUpdate, TrainingNominationResponse
)
from backend.app.schemas.translation import (
    GlossaryTermBase, GlossaryTermCreate, GlossaryTermResponse,
    TranslationMemoryBase, TranslationMemoryCreate, TranslationMemoryResponse
)
from backend.app.schemas.meeting import (
    OlicMeetingBase, OlicMeetingCreate, OlicMeetingResponse,
    MeetingAgendaBase, MeetingAgendaCreate, MeetingAgendaResponse,
    MeetingResolutionBase, MeetingResolutionCreate, MeetingResolutionResponse,
    ActionTakenReportBase, ActionTakenReportCreate, ActionTakenReportResponse
)
from backend.app.schemas.compliance import (
    QprSubmissionBase, QprSubmissionCreate, QprSubmissionResponse,
    QprSection33ItemBase, QprSection33ItemCreate, QprSection33ItemResponse
)
