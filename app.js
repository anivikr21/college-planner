// Simple local state + persistence
const STORAGE_KEY = "college_career_planner_v1";

let state = {
  profile: {
    name: "",
    grade: "",
    gpa: "",
    testType: "",
    testScore: "",
    interests: ""
  },
  activities: {
    volunteer: [],
    clubs: [],
    awards: []
  },
  fourYearPlan: {
    "9": { fall: "", spring: "" },
    "10": { fall: "", spring: "" },
    "11": { fall: "", spring: "" },
    "12": { fall: "", spring: "" }
  }
};

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("Could not save state", e);
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state = { ...state, ...parsed };
    }
  } catch (e) {
    console.warn("Could not load state", e);
  }
}

// NAVIGATION
function setupNavigation() {
  const buttons = document.querySelectorAll(".nav-btn");
  const pages = document.querySelectorAll(".page");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const target = btn.dataset.target;
      pages.forEach((page) => {
        page.classList.toggle("visible", page.id === target);
      });
    });
  });
}

// PROFILE
function renderProfile() {
  const p = state.profile;
  document.getElementById("profile-name").value = p.name || "";
  document.getElementById("profile-grade").value = p.grade || "";
  document.getElementById("profile-gpa").value = p.gpa || "";
  document.getElementById("profile-test-type").value = p.testType || "";
  document.getElementById("profile-test-score").value = p.testScore || "";
  document.getElementById("profile-interests").value = p.interests || "";
  renderQuickStats();
}

function setupProfileForm() {
  const form = document.getElementById("profile-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    state.profile = {
      name: document.getElementById("profile-name").value.trim(),
      grade: document.getElementById("profile-grade").value,
      gpa: document.getElementById("profile-gpa").value,
      testType: document.getElementById("profile-test-type").value,
      testScore: document.getElementById("profile-test-score").value,
      interests: document.getElementById("profile-interests").value.trim()
    };
    saveState();
    renderQuickStats();
  });
}

function renderQuickStats() {
  const statsEl = document.getElementById("quick-stats");
  const totalVolunteer = state.activities.volunteer.reduce(
    (sum, v) => sum + (Number(v.hours) || 0),
    0
  );
  const clubsCount = state.activities.clubs.length;
  const awardsCount = state.activities.awards.length;
  statsEl.innerHTML = `
    <li><strong>Volunteer Hours:</strong> ${totalVolunteer}</li>
    <li><strong>Clubs:</strong> ${clubsCount}</li>
    <li><strong>Awards:</strong> ${awardsCount}</li>
    <li><strong>Planned Years:</strong> 4</li>
  `;
}

// ACTIVITIES
function setupActivitiesForms() {
  const forms = document.querySelectorAll(".mini-form");
  forms.forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const type = form.dataset.type;
      if (!type) return;

      const formData = new FormData(form);
      const entry = Object.fromEntries(formData.entries());

      state.activities[type].push(entry);
      saveState();
      form.reset();
      renderActivitiesTable(type);
      renderQuickStats();
    });
  });
}

function renderActivitiesTable(type) {
  const tableId = `${type}-table`;
  const tbody = document.querySelector(`#${tableId} tbody`);
  if (!tbody) return;
  tbody.innerHTML = "";

  state.activities[type].forEach((item) => {
    const tr = document.createElement("tr");
    if (type === "volunteer") {
      tr.innerHTML = `
        <td>${item.org || ""}</td>
        <td>${item.role || ""}</td>
        <td>${item.hours || ""}</td>
        <td>${item.date || ""}</td>
      `;
    } else if (type === "clubs") {
      tr.innerHTML = `
        <td>${item.name || ""}</td>
        <td>${item.position || ""}</td>
        <td>${item.years || ""}</td>
      `;
    } else if (type === "awards") {
      tr.innerHTML = `
        <td>${item.name || ""}</td>
        <td>${item.level || ""}</td>
        <td>${item.year || ""}</td>
      `;
    }
    tbody.appendChild(tr);
  });
}

function renderAllActivitiesTables() {
  ["volunteer", "clubs", "awards"].forEach(renderActivitiesTable);
}

// FOUR YEAR PLAN
function renderFourYearPlan() {
  const container = document.querySelector(".plan-grid");
  container.innerHTML = "";

  ["9", "10", "11", "12"].forEach((grade) => {
    const plan = state.fourYearPlan[grade] || { fall: "", spring: "" };
    const card = document.createElement("div");
    card.className = "plan-card";
    card.innerHTML = `
      <h3>Grade ${grade}</h3>
      <label>
        Fall / Semester 1 Classes & Goals
        <textarea rows="4" data-grade="${grade}" data-term="fall">${plan.fall || ""}</textarea>
      </label>
      <label>
        Spring / Semester 2 Classes & Goals
        <textarea rows="4" data-grade="${grade}" data-term="spring">${plan.spring || ""}</textarea>
      </label>
    `;
    container.appendChild(card);
  });

  container.querySelectorAll("textarea").forEach((ta) => {
    ta.addEventListener("input", () => {
      const g = ta.dataset.grade;
      const term = ta.dataset.term;
      if (!state.fourYearPlan[g]) {
        state.fourYearPlan[g] = { fall: "", spring: "" };
      }
      state.fourYearPlan[g][term] = ta.value;
      saveState();
    });
  });
}

// RESUME BUILDER
function setupResumeBuilder() {
  const btn = document.getElementById("generate-resume-btn");
  const out = document.getElementById("resume-output");
  btn.addEventListener("click", () => {
    const p = state.profile;
    const volLines = state.activities.volunteer.map(
      (v) =>
        `• Volunteered at ${v.org} as ${v.role} (${v.hours} hours${v.date ? ", " + v.date : ""
        })`
    );
    const clubLines = state.activities.clubs.map(
      (c) =>
        `• ${c.position ? c.position + " - " : ""}${c.name}${
          c.years ? " (" + c.years + ")" : ""
        }`
    );
    const awardLines = state.activities.awards.map(
      (a) => `• ${a.name} – ${a.level}${a.year ? " (" + a.year + ")" : ""}`
    );

    const resumeText = [
      `${p.name || "Your Name"}`,
      "",
      `Education`,
      `• High School Student${p.grade ? ", Grade " + p.grade : ""}`,
      p.gpa ? `• GPA: ${p.gpa}` : "",
      p.testType && p.testScore
        ? `• ${p.testType}: ${p.testScore}`
        : "",
      "",
      "Activities & Leadership",
      ...clubLines,
      "",
      "Volunteer Experience",
      ...volLines,
      "",
      "Awards & Honors",
      ...awardLines,
      "",
      "Interests",
      p.interests ? `• ${p.interests}` : "• (Add your interests here)"
    ]
      .filter(Boolean)
      .join("\n");

    out.value = resumeText;
  });
}

// MAJOR SUGGESTOR
function setupMajorSelector() {
  const btn = document.getElementById("suggest-majors-btn");
  const list = document.getElementById("major-suggestions");
  btn.addEventListener("click", () => {
    const checked = Array.from(
      document.querySelectorAll("#major-selector input[type=checkbox]:checked")
    ).map((c) => c.value);

    const suggestions = new Set();

    if (checked.includes("STEM")) {
      ["Computer Science", "Mechanical Engineering", "Data Science", "Math"].forEach((m) =>
        suggestions.add(m)
      );
    }
    if (checked.includes("Arts")) {
      ["Graphic Design", "Music Performance", "Animation", "Theatre"].forEach((m) =>
        suggestions.add(m)
      );
    }
    if (checked.includes("Business")) {
      ["Business Administration", "Finance", "Marketing", "Entrepreneurship"].forEach((m) =>
        suggestions.add(m)
      );
    }
    if (checked.includes("Social")) {
      ["Psychology", "Political Science", "Economics", "History"].forEach((m) =>
        suggestions.add(m)
      );
    }
    if (checked.includes("Health")) {
      ["Nursing", "Biology (Pre-med)", "Public Health", "Kinesiology"].forEach((m) =>
        suggestions.add(m)
      );
    }
    if (checked.includes("Environment")) {
      ["Environmental Science", "Sustainability Studies", "Civil Engineering"].forEach((m) =>
        suggestions.add(m)
      );
    }

    list.innerHTML = "";
    if (suggestions.size === 0) {
      list.innerHTML = "<li>Select at least one interest above.</li>";
      return;
    }

    suggestions.forEach((m) => {
      const li = document.createElement("li");
      li.textContent = m;
      list.appendChild(li);
    });
  });
}

// CHANCES ESTIMATOR (very rough heuristic)
function setupChancesEstimator() {
  const form = document.getElementById("chances-form");
  const resultBox = document.getElementById("chances-result");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const sel = document.getElementById("chances-selectivity").value;
    const gpa = Number(document.getElementById("chances-gpa").value || 0);
    const test = Number(document.getElementById("chances-test").value || 0);
    const rigor = Number(document.getElementById("chances-rigor").value || 0);
    const leadership = Number(
      document.getElementById("chances-leadership").value || 0
    );
    const volunteer = Number(
      document.getElementById("chances-volunteer").value || 0
    );

    // base score
    let score = 0;
    score += gpa * 25; // up to ~100
    score += test / 15; // ~106 max for 1600
    score += rigor * 3;
    score += leadership * 4;
    score += Math.min(volunteer, 300) / 5;

    // Normalize
    const normalized = Math.max(0, Math.min(100, score / 4));

    let target;
    if (sel === "reach") target = 80;
    else if (sel === "match") target = 60;
    else target = 40;

    let message;
    if (normalized >= target + 15) {
      message =
        "Your stats look strong for this level of school. Still not a guarantee, but you’re in a solid range.";
    } else if (normalized >= target - 10) {
      message =
        "You seem roughly in the target range. Work on strengthening essays, extracurricular impact, and letters.";
    } else {
      message =
        "This might be more of a reach with your current stats. That’s okay—focus on growth and also build a balanced list.";
    }

    resultBox.innerHTML = `
      <h3>Rough Estimate</h3>
      <p><strong>Profile Strength Score:</strong> ${normalized.toFixed(
        1
      )} / 100</p>
      <p>${message}</p>
      <p class="note">Remember: admissions is holistic and unpredictable. This tool is just for planning.</p>
    `;
  });
}

// SCHOLARSHIPS (sample data)
const SAMPLE_SCHOLARSHIPS = [
  {
    name: "STEM Innovators Scholarship",
    minGpa: 3.2,
    interests: ["coding", "math", "engineering", "science"],
    gradeMin: 10,
    tagline: "For students passionate about STEM projects and innovation."
  },
  {
    name: "Community Service Leadership Award",
    minGpa: 2.8,
    volunteerHours: 50,
    gradeMin: 9,
    tagline: "Recognizes sustained commitment to helping the community."
  },
  {
    name: "First-Gen College Dream Grant",
    minGpa: 3.0,
    gradeMin: 11,
    tagline:
      "Supports first-generation college students pursuing any major."
  },
  {
    name: "Creative Arts Talent Scholarship",
    minGpa: 2.5,
    interests: ["art", "music", "theatre", "design"],
    gradeMin: 9,
    tagline: "For students with outstanding portfolios in the arts."
  },
  {
    name: "Environmental Changemaker Scholarship",
    minGpa: 3.0,
    interests: ["environment", "sustainability", "climate"],
    gradeMin: 10,
    tagline: "Rewards students making a difference for the planet."
  }
];

function setupScholarships() {
  const btn = document.getElementById("refresh-scholarships-btn");
  const list = document.getElementById("scholarship-list");
  btn.addEventListener("click", () => {
    renderScholarships(list);
  });

  // render once on load
  renderScholarships(list);
}

function renderScholarships(listEl) {
  const p = state.profile;
  const gpa = Number(p.gpa || 0);
  const grade = Number(p.grade || 0);
  const interestsRaw = (p.interests || "").toLowerCase();
  const totalVolunteer = state.activities.volunteer.reduce(
    (sum, v) => sum + (Number(v.hours) || 0),
    0
  );

  listEl.innerHTML = "";

  const matches = SAMPLE_SCHOLARSHIPS.filter((s) => {
    if (gpa && s.minGpa && gpa < s.minGpa) return false;
    if (grade && s.gradeMin && grade < s.gradeMin) return false;
    if (s.volunteerHours && totalVolunteer < s.volunteerHours) return false;
    if (s.interests && s.interests.length > 0) {
      const hasInterest = s.interests.some((kw) =>
        interestsRaw.includes(kw)
      );
      if (!hasInterest) return false;
    }
    return true;
  });

  if (matches.length === 0) {
    listEl.innerHTML =
      "<li>No strong matches yet based on your profile. Try updating your GPA, grade, and interests.</li>";
    return;
  }

  matches.forEach((s) => {
    const li = document.createElement("li");
    li.className = "scholarship-item";
    const details = [];
    if (s.minGpa) details.push(`Min GPA: ${s.minGpa}`);
    if (s.gradeMin) details.push(`Min Grade: ${s.gradeMin}`);
    if (s.volunteerHours)
      details.push(`Suggested Volunteer Hours: ${s.volunteerHours}+`);

    li.innerHTML = `
      <div class="sch-item-title">${s.name}</div>
      <div class="sch-item-tagline">${s.tagline}</div>
      <div class="sch-item-meta">${details.join(" • ")}</div>
      <div class="sch-item-meta"><em>Use this as inspiration to search for real scholarships online.</em></div>
    `;
    listEl.appendChild(li);
  });
}

// INIT
document.addEventListener("DOMContentLoaded", () => {
  loadState();
  setupNavigation();
  setupProfileForm();
  renderProfile();

  setupActivitiesForms();
  renderAllActivitiesTables();

  renderFourYearPlan();
  setupResumeBuilder();
  setupMajorSelector();
  setupChancesEstimator();
  setupScholarships();
});
