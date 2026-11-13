/* =====================================================
   Student Database Management System (SDMS) - script.js
   =====================================================
   CONFIGURATION
   Leave API_URL empty to use browser localStorage (demo mode).
   Later, put your Flask API address here, for example:
   const API_URL = "http://YOUR-EC2-PUBLIC-IP:5000/api/students";
   Never put AWS keys or passwords in this file.
   ===================================================== */
const API_URL = "";   // <-- Flask API endpoint placeholder
const STORAGE_KEY = "sdms_students";

const COURSES = ["B.Tech", "BCA", "MCA", "B.Sc", "MBA"];
const DEPARTMENTS = ["Computer Science", "Information Technology", "Electronics", "Mechanical", "Business"];

/* ---------- Sample data (5 demo students) ---------- */
function daysAgo(n) { return new Date(Date.now() - n * 86400000).toISOString(); }

function sampleData() {
  return [
    { id: "STU001", name: "Aarav Sharma", email: "aarav.sharma@example.com", phone: "9876543210", gender: "Male", dob: "2004-03-12", course: "B.Tech", department: "Computer Science", year: "3", address: "12 MG Road, Bengaluru", status: "Active", createdAt: daysAgo(20) },
    { id: "STU002", name: "Priya Nair", email: "priya.nair@example.com", phone: "9123456780", gender: "Female", dob: "2005-07-25", course: "BCA", department: "Information Technology", year: "2", address: "45 Lake View, Kochi", status: "Active", createdAt: daysAgo(10) },
    { id: "STU003", name: "Rohan Mehta", email: "rohan.mehta@example.com", phone: "9988776655", gender: "Male", dob: "2003-11-02", course: "MBA", department: "Business", year: "1", address: "8 Park Street, Mumbai", status: "Inactive", createdAt: daysAgo(30) },
    { id: "STU004", name: "Sneha Reddy", email: "sneha.reddy@example.com", phone: "9012345678", gender: "Female", dob: "2004-01-19", course: "B.Tech", department: "Electronics", year: "4", address: "27 Jubilee Hills, Hyderabad", status: "Active", createdAt: daysAgo(3) },
    { id: "STU005", name: "Kabir Singh", email: "kabir.singh@example.com", phone: "9345678901", gender: "Male", dob: "2005-05-30", course: "MCA", department: "Computer Science", year: "1", address: "3 Civil Lines, Delhi", status: "Active", createdAt: daysAgo(1) }
  ];
}

/* =====================================================
   DATA LAYER
   Only these 4 functions touch storage. To move to Flask,
   fill in API_URL and your Flask routes should be:
     GET    /api/students        -> list
     POST   /api/students        -> create
     PUT    /api/students/<id>   -> update
     DELETE /api/students/<id>   -> delete
   ===================================================== */
async function loadStudents() {
  if (API_URL) {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Could not load students");
    return await res.json();
  }
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleData()));
    return sampleData();
  }
  return JSON.parse(saved);
}

function saveLocal(list) { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }

async function createStudent(student) {
  if (API_URL) {
    const res = await fetch(API_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(student) });
    if (!res.ok) throw new Error("Could not add student");
    return;
  }
  saveLocal([...students, student]);
}

async function updateStudent(student) {
  if (API_URL) {
    const res = await fetch(`${API_URL}/${student.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(student) });
    if (!res.ok) throw new Error("Could not update student");
    return;
  }
  saveLocal(students.map(s => (s.id === student.id ? student : s)));
}

async function deleteStudentById(id) {
  if (API_URL) {
    const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Could not delete student");
    return;
  }
  saveLocal(students.filter(s => s.id !== id));
}

/* =====================================================
   APP STATE AND HELPERS
   ===================================================== */
let students = [];
let editingId = null;
let deletingId = null;

const $ = id => document.getElementById(id);

function esc(text) {   // prevents HTML injection when showing user text
  const d = document.createElement("div");
  d.textContent = text;
  return d.innerHTML;
}

let messageTimer;
function showMessage(text, type = "success") {
  const box = $("message");
  box.textContent = text;
  box.className = "message " + type;
  clearTimeout(messageTimer);
  messageTimer = setTimeout(() => (box.className = "message"), 4000);
}

async function refresh() {
  try {
    students = await loadStudents();
  } catch (err) {
    showMessage(err.message + ". Check that the API is running.", "error");
    students = [];
  }
  renderAll();
}

/* =====================================================
   RENDERING
   ===================================================== */
function renderAll() {
  renderCards();
  renderRecent();
  renderTable(students, "allBody");
  applyFilters();
}

function renderCards() {
  const weekAgo = Date.now() - 7 * 86400000;
  $("cardTotal").textContent = students.length;
  $("cardCourses").textContent = new Set(students.map(s => s.course)).size;
  $("cardRecent").textContent = students.filter(s => new Date(s.createdAt).getTime() >= weekAgo).length;
  $("cardActive").textContent = students.filter(s => s.status === "Active").length;
}

function renderRecent() {
  const latest = [...students].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  $("recentBody").innerHTML = latest.length
    ? latest.map(s => `<tr><td>${esc(s.id)}</td><td>${esc(s.name)}</td><td>${esc(s.course)}</td><td>${esc(s.department)}</td><td>${esc(s.year)}</td></tr>`).join("")
    : `<tr><td colspan="5" class="empty">No students yet.</td></tr>`;
}

function renderTable(list, bodyId) {
  $(bodyId).innerHTML = list.length
    ? list.map(s => `
      <tr>
        <td>${esc(s.id)}</td><td>${esc(s.name)}</td><td>${esc(s.email)}</td><td>${esc(s.phone)}</td>
        <td>${esc(s.course)}</td><td>${esc(s.department)}</td><td>${esc(s.year)}</td>
        <td>
          <button class="act" data-action="view" data-id="${esc(s.id)}">View</button>
          <button class="act" data-action="edit" data-id="${esc(s.id)}">Edit</button>
          <button class="act del" data-action="delete" data-id="${esc(s.id)}">Delete</button>
        </td>
      </tr>`).join("")
    : `<tr><td colspan="8" class="empty">No students found.</td></tr>`;
}

function fillSelect(select, items, firstLabel) {
  select.innerHTML = `<option value="">${firstLabel}</option>` + items.map(i => `<option>${i}</option>`).join("");
}

/* =====================================================
   NAVIGATION
   ===================================================== */
function showView(name) {
  document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
  $("view-" + name).classList.remove("hidden");
  document.querySelectorAll(".sidebar a[data-view]").forEach(a => a.classList.toggle("active", a.dataset.view === name));
  $("sidebar").classList.remove("open");
  if (name === "add" && !editingId) resetForm();
}

/* =====================================================
   FORM: add, edit, validate
   ===================================================== */
const FIELDS = ["fullName", "email", "phone", "gender", "dob", "course", "department", "year", "address"];

function nextId() {
  const nums = students.map(s => parseInt(s.id.replace(/\D/g, ""), 10) || 0);
  return "STU" + String(Math.max(0, ...nums) + 1).padStart(3, "0");
}

function resetForm() {
  $("studentForm").reset();
  editingId = null;
  $("studentId").value = nextId();
  $("formTitle").textContent = "Add Student";
  $("submitBtn").textContent = "Add Student";
  clearErrors();
}

function clearErrors() {
  FIELDS.forEach(f => { $(f).classList.remove("invalid"); $("err-" + f).textContent = ""; });
}

function validateForm() {
  clearErrors();
  let ok = true;
  const fail = (field, msg) => { $(field).classList.add("invalid"); $("err-" + field).textContent = msg; ok = false; };

  FIELDS.forEach(f => { if (!$(f).value.trim()) fail(f, "This field is required."); });

  const email = $("email").value.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("email", "Enter a valid email, e.g. name@example.com.");

  const phone = $("phone").value.trim();
  if (phone && !/^[0-9+\-\s]{7,15}$/.test(phone)) fail("phone", "Enter a valid phone number (7-15 digits).");

  return ok;
}

async function handleSubmit(e) {
  e.preventDefault();
  if (!validateForm()) { showMessage("Please fix the errors in the form.", "error"); return; }

  const old = students.find(s => s.id === editingId);
  const student = {
    id: $("studentId").value,
    name: $("fullName").value.trim(),
    email: $("email").value.trim(),
    phone: $("phone").value.trim(),
    gender: $("gender").value,
    dob: $("dob").value,
    course: $("course").value,
    department: $("department").value,
    year: $("year").value,
    address: $("address").value.trim(),
    status: old ? old.status : "Active",
    createdAt: old ? old.createdAt : new Date().toISOString()
  };

  try {
    if (editingId) { await updateStudent(student); showMessage("Student updated successfully."); }
    else { await createStudent(student); showMessage("Student added successfully."); }
    editingId = null;
    await refresh();
    showView("students");
  } catch (err) {
    showMessage(err.message, "error");
  }
}

function startEdit(id) {
  const s = students.find(x => x.id === id);
  if (!s) return;
  editingId = id;
  showView("add");
  $("studentId").value = s.id;
  $("fullName").value = s.name;
  $("email").value = s.email;
  $("phone").value = s.phone;
  $("gender").value = s.gender;
  $("dob").value = s.dob;
  $("course").value = s.course;
  $("department").value = s.department;
  $("year").value = s.year;
  $("address").value = s.address;
  $("formTitle").textContent = "Edit Student";
  $("submitBtn").textContent = "Save Changes";
  clearErrors();
}

/* =====================================================
   VIEW, DELETE, SEARCH
   ===================================================== */
function viewStudent(id) {
  const s = students.find(x => x.id === id);
  if (!s) return;
  const rows = [["Student ID", s.id], ["Name", s.name], ["Email", s.email], ["Phone", s.phone], ["Gender", s.gender],
    ["Date of Birth", s.dob], ["Course", s.course], ["Department", s.department], ["Year", s.year], ["Address", s.address], ["Status", s.status]];
  $("viewBody").innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("");
  $("viewDialog").showModal();
}

function askDelete(id) {
  const s = students.find(x => x.id === id);
  if (!s) return;
  deletingId = id;
  $("deleteText").textContent = `This will permanently remove ${s.name} (${s.id}).`;
  $("deleteDialog").showModal();
}

async function confirmDelete() {
  $("deleteDialog").close();
  try {
    await deleteStudentById(deletingId);
    showMessage("Student deleted.");
    await refresh();
  } catch (err) {
    showMessage(err.message, "error");
  }
}

function applyFilters() {
  const name = $("searchName").value.trim().toLowerCase();
  const id = $("searchId").value.trim().toLowerCase();
  const course = $("filterCourse").value;
  const dept = $("filterDept").value;
  const result = students.filter(s =>
    s.name.toLowerCase().includes(name) &&
    s.id.toLowerCase().includes(id) &&
    (!course || s.course === course) &&
    (!dept || s.department === dept));
  renderTable(result, "searchBody");
}

/* =====================================================
   START UP: connect buttons to functions
   ===================================================== */
document.addEventListener("DOMContentLoaded", () => {
  fillSelect($("course"), COURSES, "Select");
  fillSelect($("department"), DEPARTMENTS, "Select");
  fillSelect($("filterCourse"), COURSES, "All courses");
  fillSelect($("filterDept"), DEPARTMENTS, "All departments");
  $("modeLabel").textContent = API_URL ? "Flask API (" + API_URL + ")" : "Demo mode (browser localStorage)";

  // Sidebar links
  document.querySelectorAll(".sidebar a[data-view]").forEach(a =>
    a.addEventListener("click", e => { e.preventDefault(); editingId = null; showView(a.dataset.view); }));
  $("logoutBtn").addEventListener("click", e => {
    e.preventDefault();
    showMessage("You have been logged out (demo). Login will be added with the backend.");
    showView("dashboard");
  });
  $("menuBtn").addEventListener("click", () => $("sidebar").classList.toggle("open"));
  $("bellBtn").addEventListener("click", () => showMessage("You have no new notifications."));

  // Top search bar jumps to the Search page
  $("globalSearch").addEventListener("keydown", e => {
    if (e.key !== "Enter") return;
    $("searchName").value = e.target.value;
    showView("search");
    applyFilters();
  });

  // Form
  $("studentForm").addEventListener("submit", handleSubmit);
  $("resetBtn").addEventListener("click", resetForm);

  // Table buttons (one listener handles every row)
  document.addEventListener("click", e => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const { action, id } = btn.dataset;
    if (action === "view") viewStudent(id);
    if (action === "edit") startEdit(id);
    if (action === "delete") askDelete(id);
  });

  // Dialogs
  $("closeView").addEventListener("click", () => $("viewDialog").close());
  $("cancelDelete").addEventListener("click", () => $("deleteDialog").close());
  $("confirmDelete").addEventListener("click", confirmDelete);

  // Filters
  ["searchName", "searchId", "filterCourse", "filterDept"].forEach(id => $(id).addEventListener("input", applyFilters));
  $("clearFilters").addEventListener("click", () => {
    ["searchName", "searchId", "filterCourse", "filterDept"].forEach(id => ($(id).value = ""));
    applyFilters();
  });

  // Settings
  $("resetDataBtn").addEventListener("click", async () => {
    if (API_URL) { showMessage("Reset only works in demo mode.", "error"); return; }
    localStorage.removeItem(STORAGE_KEY);
    await refresh();
    showMessage("Demo data restored.");
  });

  refresh();
});
