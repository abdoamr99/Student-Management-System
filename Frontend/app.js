// Change this value only when the API runs on another host or port.
const API_BASE_URL = window.STUDENT_API_BASE_URL || 'http://localhost:5073/api';

const state = { students: [], editingId: null, deletingId: null };
const $ = (selector) => document.querySelector(selector);
const studentModal = new bootstrap.Modal($('#studentModal'));
const detailsModal = new bootstrap.Modal($('#detailsModal'));
const deleteModal = new bootstrap.Modal($('#deleteModal'));
const toast = new bootstrap.Toast($('#appToast'), { delay: 3600 });

const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
})[character]);

const formatDate = (value) => value
  ? new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value))
  : '\u2014';

const initials = (student) => `${student.firstName?.[0] || ''}${student.lastName?.[0] || ''}`.toUpperCase();

async function apiRequest(path = '', options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });

  if (!response.ok) {
    let message = `Request failed (${response.status}).`;
    try {
      const payload = await response.json();
      message = payload.message || payload.title || Object.values(payload.errors || {}).flat().join(' ') || message;
    } catch {
      // A failed request may have no JSON response body.
    }
    throw new Error(message);
  }

  return response.status === 204 ? null : response.json();
}

function showToast(message, isError = false) {
  $('#toastMessage').textContent = message;
  $('#toastIcon').className = isError
    ? 'bi bi-exclamation-circle-fill text-danger'
    : 'bi bi-check-circle-fill text-success';
  toast.show();
}

function render() {
  const search = $('#searchInput').value.trim().toLowerCase();
  const filtered = state.students.filter((student) =>
    `${student.firstName} ${student.lastName} ${student.department}`.toLowerCase().includes(search));

  $('#studentRows').innerHTML = filtered.length
    ? filtered.map((student) => `<tr>
        <td><div class="d-flex align-items-center gap-3"><div class="student-avatar">${escapeHtml(initials(student))}</div><div><div class="student-name">${escapeHtml(student.firstName)} ${escapeHtml(student.lastName)}</div><div class="student-email">${escapeHtml(student.email)}</div></div></div></td>
        <td><span class="badge badge-department rounded-pill">${escapeHtml(student.department)}</span></td>
        <td class="text-secondary small">${escapeHtml(student.phoneNumber || 'Not provided')}</td>
        <td class="text-secondary small">${formatDate(student.enrollmentDate)}</td>
        <td class="text-end"><button class="action-btn" title="View details" aria-label="View details" data-action="view" data-id="${student.id}"><i class="bi bi-eye"></i></button><button class="action-btn" title="Edit student" aria-label="Edit student" data-action="edit" data-id="${student.id}"><i class="bi bi-pencil-square"></i></button><button class="action-btn delete" title="Delete student" aria-label="Delete student" data-action="delete" data-id="${student.id}"><i class="bi bi-trash3"></i></button></td>
      </tr>`).join('')
    : `<tr><td colspan="5" class="empty-state"><i class="bi bi-person-lines-fill"></i><div class="fw-semibold text-dark">${search ? 'No matching students' : 'No students yet'}</div><div class="small">${search ? 'Try another name or department.' : 'Add your first student to get started.'}</div></td></tr>`;

  $('#tableSummary').textContent = search
    ? `${filtered.length} of ${state.students.length} students shown`
    : `${state.students.length} student${state.students.length === 1 ? '' : 's'} in the directory`;

  $('#totalStudents').textContent = state.students.length;
  const now = new Date();
  $('#monthStudents').textContent = state.students.filter((student) => {
    const date = new Date(student.enrollmentDate);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;
  $('#departmentCount').textContent = new Set(state.students.map((student) => student.department.toLowerCase())).size;
  const latest = [...state.students].sort((a, b) => new Date(b.enrollmentDate) - new Date(a.enrollmentDate))[0];
  $('#latestEnrollment').textContent = latest ? formatDate(latest.enrollmentDate) : '\u2014';
}

async function loadStudents() {
  try {
    state.students = await apiRequest('/students');
    render();
  } catch (error) {
    $('#studentRows').innerHTML = `<tr><td colspan="5" class="empty-state"><i class="bi bi-cloud-slash"></i><div class="fw-semibold text-dark">Unable to load students</div><div class="small">${escapeHtml(error.message)} Check that the API is running.</div></td></tr>`;
    $('#tableSummary').textContent = 'Connection error';
    showToast(error.message, true);
  }
}

function openCreateModal() {
  state.editingId = null;
  $('#studentForm').reset();
  $('#studentForm').classList.remove('was-validated');
  $('#studentModalLabel').textContent = 'Add new student';
  $('#saveStudentButton').textContent = 'Save student';
  studentModal.show();
}

function openEditModal(id) {
  const student = state.students.find((item) => item.id === id);
  if (!student) return;

  state.editingId = id;
  $('#firstName').value = student.firstName;
  $('#lastName').value = student.lastName;
  $('#email').value = student.email;
  $('#phoneNumber').value = student.phoneNumber || '';
  $('#dateOfBirth').value = student.dateOfBirth?.slice(0, 10) || '';
  $('#department').value = student.department;
  $('#studentForm').classList.remove('was-validated');
  $('#studentModalLabel').textContent = 'Edit student';
  $('#saveStudentButton').textContent = 'Save changes';
  studentModal.show();
}

function openDetailsModal(id) {
  const student = state.students.find((item) => item.id === id);
  if (!student) return;

  $('#detailsBody').innerHTML = `<div class="d-flex align-items-center gap-3 mb-4"><div class="student-avatar">${escapeHtml(initials(student))}</div><div><div class="h5 fw-bold mb-1">${escapeHtml(student.firstName)} ${escapeHtml(student.lastName)}</div><div class="text-secondary small">${escapeHtml(student.email)}</div></div></div><dl class="row small mb-0"><dt class="col-5 text-secondary fw-normal">Department</dt><dd class="col-7 fw-semibold">${escapeHtml(student.department)}</dd><dt class="col-5 text-secondary fw-normal">Phone</dt><dd class="col-7 fw-semibold">${escapeHtml(student.phoneNumber || 'Not provided')}</dd><dt class="col-5 text-secondary fw-normal">Date of birth</dt><dd class="col-7 fw-semibold">${formatDate(student.dateOfBirth)}</dd><dt class="col-5 text-secondary fw-normal">Enrollment date</dt><dd class="col-7 fw-semibold">${formatDate(student.enrollmentDate)}</dd></dl>`;
  detailsModal.show();
}

function openDeleteModal(id) {
  const student = state.students.find((item) => item.id === id);
  if (!student) return;

  state.deletingId = id;
  $('#deleteMessage').textContent = `Delete ${student.firstName} ${student.lastName}? This action cannot be undone.`;
  deleteModal.show();
}

$('#addStudentButton').addEventListener('click', openCreateModal);
$('#searchInput').addEventListener('input', render);

$('#studentRows').addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;

  const id = Number(button.dataset.id);
  if (button.dataset.action === 'view') openDetailsModal(id);
  if (button.dataset.action === 'edit') openEditModal(id);
  if (button.dataset.action === 'delete') openDeleteModal(id);
});

$('#studentForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;

  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    return;
  }

  const button = $('#saveStudentButton');
  button.disabled = true;
  button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving…';

  const payload = {
    firstName: $('#firstName').value.trim(),
    lastName: $('#lastName').value.trim(),
    email: $('#email').value.trim(),
    phoneNumber: $('#phoneNumber').value.trim() || null,
    dateOfBirth: $('#dateOfBirth').value,
    department: $('#department').value.trim()
  };

  try {
    if (state.editingId) {
      await apiRequest(`/students/${state.editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
      showToast('Student updated successfully.');
    } else {
      await apiRequest('/students', { method: 'POST', body: JSON.stringify(payload) });
      showToast('Student added successfully.');
    }

    studentModal.hide();
    await loadStudents();
  } catch (error) {
    showToast(error.message, true);
  } finally {
    button.disabled = false;
    button.textContent = state.editingId ? 'Save changes' : 'Save student';
  }
});

$('#confirmDeleteButton').addEventListener('click', async () => {
  const button = $('#confirmDeleteButton');
  button.disabled = true;
  button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Deleting…';

  try {
    await apiRequest(`/students/${state.deletingId}`, { method: 'DELETE' });
    deleteModal.hide();
    showToast('Student deleted successfully.');
    await loadStudents();
  } catch (error) {
    showToast(error.message, true);
  } finally {
    button.disabled = false;
    button.textContent = 'Delete';
  }
});

loadStudents();
