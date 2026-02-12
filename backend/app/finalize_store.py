"""
In-memory job store for finalize workflow.

Tracks job lifecycle: pending -> running -> completed / failed.
"""

import logging
import threading
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum

LOGGER = logging.getLogger(__name__)


class JobStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class FinalizeJob:
    """Represents the state of a single finalize job."""

    id: str
    status: JobStatus = JobStatus.PENDING
    step: str = "queued"
    progress: int = 0
    logs: list[str] = field(default_factory=list)
    started_at: str | None = None
    finished_at: str | None = None
    error: str | None = None
    project_path: str | None = None
    zip_path: str | None = None


class FinalizeStore:
    """Thread-safe in-memory store for finalize jobs."""

    def __init__(self) -> None:
        self._jobs: dict[str, FinalizeJob] = {}
        self._lock = threading.Lock()

    def create_job(self) -> FinalizeJob:
        """
        Create a new pending finalize job.

        Returns:
            The newly created FinalizeJob instance.

        Example:
            >>> store = FinalizeStore()
            >>> job = store.create_job()
            >>> job.status == JobStatus.PENDING
            True
        """
        job_id = uuid.uuid4().hex[:12]
        job = FinalizeJob(id=job_id)
        with self._lock:
            self._jobs[job_id] = job
        LOGGER.debug("Created finalize job %s", job_id)
        return job

    def get_job(self, job_id: str) -> FinalizeJob | None:
        """
        Retrieve a job by ID.

        Args:
            job_id: The job identifier.

        Returns:
            The FinalizeJob or None if not found.
        """
        with self._lock:
            return self._jobs.get(job_id)

    def update_job(
        self,
        job_id: str,
        *,
        status: JobStatus | None = None,
        step: str | None = None,
        progress: int | None = None,
        log_line: str | None = None,
        error: str | None = None,
        project_path: str | None = None,
        zip_path: str | None = None,
    ) -> None:
        """
        Update fields on an existing job (thread-safe).

        Args:
            job_id: The job identifier.
            status: New job status.
            step: Current step description.
            progress: Progress percentage (0-100).
            log_line: A single log line to append.
            error: Error message (sets status to FAILED).
            project_path: Path to the generated project.
            zip_path: Path to the zipped project.
        """
        with self._lock:
            job = self._jobs.get(job_id)
            if not job:
                return
            if status is not None:
                job.status = status
            if step is not None:
                job.step = step
            if progress is not None:
                job.progress = max(0, min(100, progress))
            if log_line is not None:
                job.logs.append(log_line)
            if error is not None:
                job.error = error
                job.status = JobStatus.FAILED
                job.finished_at = datetime.now(timezone.utc).isoformat()
            if project_path is not None:
                job.project_path = project_path
            if zip_path is not None:
                job.zip_path = zip_path
            if status == JobStatus.RUNNING and not job.started_at:
                job.started_at = datetime.now(timezone.utc).isoformat()
            if (
                status in (JobStatus.COMPLETED, JobStatus.FAILED)
                and not job.finished_at
            ):
                job.finished_at = datetime.now(timezone.utc).isoformat()


# Module-level singleton
finalize_store = FinalizeStore()
