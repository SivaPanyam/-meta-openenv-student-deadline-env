const els = {
  mode: document.getElementById("mode"),
  scenario: document.getElementById("scenario"),
  customConfig: document.getElementById("customConfig"),
  customHours: document.getElementById("customHours"),
  customEnergy: document.getElementById("customEnergy"),
  customTimeOfDay: document.getElementById("customTimeOfDay"),
  customExamWeek: document.getElementById("customExamWeek"),
  resetBtn: document.getElementById("resetBtn"),
  addTaskBtn: document.getElementById("addTaskBtn"),
  clearTasksBtn: document.getElementById("clearTasksBtn"),
  autofillBtn: document.getElementById("autofillBtn"),
  runStepBtn: document.getElementById("runStepBtn"),
  status: document.getElementById("status"),
  taskComposer: document.getElementById("taskComposer"),
  newTaskTitle: document.getElementById("newTaskTitle"),
  newTaskDeadline: document.getElementById("newTaskDeadline"),
  newTaskDifficulty: document.getElementById("newTaskDifficulty"),
  newTaskEstimated: document.getElementById("newTaskEstimated"),
  newTaskImportance: document.getElementById("newTaskImportance"),
  taskList: document.getElementById("taskList"),
  availableHours: document.getElementById("availableHours"),
  energyLevel: document.getElementById("energyLevel"),
  timeOfDay: document.getElementById("timeOfDay"),
  examWeek: document.getElementById("examWeek"),
  actionPayload: document.getElementById("actionPayload"),
  stepResponse: document.getElementById("stepResponse"),
};

const state = {
  observation: null,
  customTasks: [],
  nextTaskId: 1,
};

function setStatus(text, isError = false) {
  els.status.textContent = `Status: ${text}`;
  els.status.classList.toggle("error", isError);
}

function formatJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

function isCustomMode() {
  return els.mode.value === "custom";
}

function escapeHTML(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getCustomContext() {
  const availableHours = Number(els.customHours.value);
  if (!Number.isFinite(availableHours) || availableHours <= 0 || availableHours > 24) {
    throw new Error("Available hours must be between 1 and 24.");
  }

  return {
    available_hours: availableHours,
    energy_level: els.customEnergy.value,
    time_of_day: els.customTimeOfDay.value,
    exam_week: els.customExamWeek.value === "true",
  };
}

function updateModeUI() {
  const custom = isCustomMode();
  els.scenario.disabled = custom;
  els.customConfig.classList.toggle("hidden", !custom);
  els.taskComposer.classList.toggle("hidden", !custom);
  els.addTaskBtn.classList.toggle("hidden", !custom);
  els.clearTasksBtn.classList.toggle("hidden", !custom);

  if (custom) {
    els.resetBtn.textContent = "Load Custom Episode";
    if (!state.customTasks.length) {
      seedDefaultCustomTasks();
    }
    refreshCustomObservation();
    setStatus("custom mode active, add tasks and load episode");
  } else {
    els.resetBtn.textContent = "Reset Episode";
    els.taskList.innerHTML = "";
    state.observation = null;
    els.autofillBtn.disabled = true;
    els.runStepBtn.disabled = true;
    setStatus("scenario mode active, reset to fetch scenario");
  }
}

function seedDefaultCustomTasks() {
  state.customTasks = [
    { id: state.nextTaskId++, title: "Math Quiz Prep", deadline_hours: 8, difficulty: 3, estimated_time: 3, importance: 4 },
    { id: state.nextTaskId++, title: "AI Assignment", deadline_hours: 20, difficulty: 5, estimated_time: 6, importance: 5 },
  ];
}

function refreshCustomObservation() {
  const context = getCustomContext();
  const observation = {
    tasks: state.customTasks,
    available_hours: context.available_hours,
    energy_level: context.energy_level,
    time_of_day: context.time_of_day,
    exam_week: context.exam_week,
    done: false,
    reward: null,
  };
  state.observation = observation;
  updateMeta(observation);
  renderTasks(observation);
  els.stepResponse.textContent = formatJSON(observation);
  els.autofillBtn.disabled = !state.customTasks.length;
  els.runStepBtn.disabled = !state.customTasks.length;
}

function updateMeta(observation) {
  els.availableHours.textContent = observation.available_hours;
  els.energyLevel.textContent = observation.energy_level;
  els.timeOfDay.textContent = observation.time_of_day;
  els.examWeek.textContent = observation.exam_week ? "yes" : "no";
}

function renderTasks(observation) {
  els.taskList.innerHTML = "";

  if (!observation.tasks.length) {
    els.taskList.innerHTML = '<article class="task-card"><div class="kv">No tasks yet. Add tasks in Task Composer.</div></article>';
    return;
  }

  observation.tasks.forEach((task) => {
    const card = document.createElement("article");
    card.className = "task-card";

    const removeBtn = isCustomMode()
      ? `<button class="btn btn-secondary" data-remove-task="${task.id}">Remove</button>`
      : "";

    card.innerHTML = `
      <div class="task-header">
        <h3 class="task-title">${escapeHTML(task.title)}</h3>
        <div>
          <span class="badge">ID ${task.id}</span>
          ${removeBtn}
        </div>
      </div>
      <div class="task-grid">
        <div class="kv">Deadline: ${task.deadline_hours}h</div>
        <div class="kv">Difficulty: ${task.difficulty}/5</div>
        <div class="kv">Est. Time: ${task.estimated_time}h</div>
        <div class="kv">Importance: ${task.importance}/5</div>
      </div>
      <div class="task-controls">
        <label>
          <input type="checkbox" data-task-select="${task.id}">
          Select task
        </label>
        <label>
          Hours:
          <input type="number" min="1" step="1" data-task-hours="${task.id}" disabled value="${task.estimated_time}">
        </label>
      </div>
    `;

    const selectEl = card.querySelector(`[data-task-select="${task.id}"]`);
    const hoursEl = card.querySelector(`[data-task-hours="${task.id}"]`);

    selectEl.addEventListener("change", () => {
      hoursEl.disabled = !selectEl.checked;
    });

    const removeEl = card.querySelector(`[data-remove-task="${task.id}"]`);
    if (removeEl) {
      removeEl.addEventListener("click", () => {
        state.customTasks = state.customTasks.filter((t) => t.id !== task.id);
        refreshCustomObservation();
        setStatus("task removed from custom episode");
      });
    }

    els.taskList.appendChild(card);
  });
}

function collectAction() {
  const selectedTaskIds = [];
  const timeAllocation = {};

  const selectEls = document.querySelectorAll("[data-task-select]");
  selectEls.forEach((checkbox) => {
    const taskId = Number(checkbox.getAttribute("data-task-select"));
    if (!checkbox.checked) {
      return;
    }

    const hoursEl = document.querySelector(`[data-task-hours="${taskId}"]`);
    const hours = Number(hoursEl.value);
    if (!Number.isFinite(hours) || hours <= 0) {
      throw new Error(`Invalid hour allocation for task ${taskId}`);
    }

    selectedTaskIds.push(taskId);
    timeAllocation[String(taskId)] = hours;
  });

  if (selectedTaskIds.length === 0) {
    throw new Error("Please select at least one task.");
  }

  return {
    selected_task_ids: selectedTaskIds,
    time_allocation: timeAllocation,
  };
}

function autofillRecommended() {
  if (!state.observation) {
    return;
  }

  const tasks = [...state.observation.tasks]
    .sort((a, b) => (b.importance * 10 - b.deadline_hours) - (a.importance * 10 - a.deadline_hours));

  let remaining = state.observation.available_hours;

  tasks.forEach((task) => {
    const selectEl = document.querySelector(`[data-task-select="${task.id}"]`);
    const hoursEl = document.querySelector(`[data-task-hours="${task.id}"]`);

    if (remaining <= 0) {
      selectEl.checked = false;
      hoursEl.disabled = true;
      return;
    }

    const allocated = Math.min(task.estimated_time, remaining);
    if (allocated > 0) {
      selectEl.checked = true;
      hoursEl.disabled = false;
      hoursEl.value = allocated;
      remaining -= allocated;
    }
  });
}

async function resetEpisode() {
  els.resetBtn.disabled = true;
  setStatus("resetting episode...");

  try {
    if (isCustomMode()) {
      if (!state.customTasks.length) {
        throw new Error("Add at least one custom task first.");
      }
      refreshCustomObservation();
      els.actionPayload.textContent = "{}";
      setStatus(`custom episode ready (${state.customTasks.length} tasks)`);
      return;
    }

    const payload = { scenario_name: els.scenario.value };
    const response = await fetch("/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Reset failed: ${response.status} ${err}`);
    }

    const observation = await response.json();
    state.observation = observation;

    updateMeta(observation);
    renderTasks(observation);

    els.autofillBtn.disabled = false;
    els.runStepBtn.disabled = false;
    els.actionPayload.textContent = "{}";
    els.stepResponse.textContent = formatJSON(observation);

    setStatus(`episode ready (${els.scenario.value})`);
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    els.resetBtn.disabled = false;
  }
}

async function runStep() {
  if (!state.observation) {
    setStatus("reset the episode first", true);
    return;
  }

  els.runStepBtn.disabled = true;
  setStatus("running step...");

  try {
    const action = collectAction();
    const payload = isCustomMode()
      ? {
          context: getCustomContext(),
          tasks: state.customTasks,
          action,
        }
      : { action };

    els.actionPayload.textContent = formatJSON(payload);

    const endpoint = isCustomMode() ? "/simulate/custom" : "/step";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Step failed: ${response.status} ${err}`);
    }

    const result = await response.json();
    els.stepResponse.textContent = formatJSON(result);

    const reward = result.reward ?? result?.metadata?.score ?? "n/a";
    setStatus(`step completed, reward: ${reward}`);
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    els.runStepBtn.disabled = false;
  }
}

function addCustomTask() {
  try {
    const title = els.newTaskTitle.value.trim();
    const deadline = Number(els.newTaskDeadline.value);
    const difficulty = Number(els.newTaskDifficulty.value);
    const estimated = Number(els.newTaskEstimated.value);
    const importance = Number(els.newTaskImportance.value);

    if (!title) {
      throw new Error("Task title is required.");
    }
    if (!Number.isFinite(deadline) || deadline <= 0) {
      throw new Error("Deadline must be > 0.");
    }
    if (!Number.isFinite(difficulty) || difficulty < 1 || difficulty > 5) {
      throw new Error("Difficulty must be between 1 and 5.");
    }
    if (!Number.isFinite(estimated) || estimated <= 0) {
      throw new Error("Estimated time must be > 0.");
    }
    if (!Number.isFinite(importance) || importance < 1 || importance > 5) {
      throw new Error("Importance must be between 1 and 5.");
    }

    state.customTasks.push({
      id: state.nextTaskId++,
      title,
      deadline_hours: Math.trunc(deadline),
      difficulty: Math.trunc(difficulty),
      estimated_time: Math.trunc(estimated),
      importance: Math.trunc(importance),
    });

    els.newTaskTitle.value = "";
    els.newTaskDeadline.value = "";
    els.newTaskDifficulty.value = "";
    els.newTaskEstimated.value = "";
    els.newTaskImportance.value = "";

    refreshCustomObservation();
    setStatus("task added to custom episode");
  } catch (error) {
    setStatus(error.message, true);
  }
}

function clearCustomTasks() {
  state.customTasks = [];
  refreshCustomObservation();
  setStatus("all custom tasks cleared");
}

els.mode.addEventListener("change", updateModeUI);
els.resetBtn.addEventListener("click", resetEpisode);
els.addTaskBtn.addEventListener("click", addCustomTask);
els.clearTasksBtn.addEventListener("click", clearCustomTasks);
els.autofillBtn.addEventListener("click", () => {
  autofillRecommended();
  setStatus("autofill complete, adjust if needed");
});
els.runStepBtn.addEventListener("click", runStep);

els.customHours.addEventListener("change", () => {
  if (isCustomMode()) {
    refreshCustomObservation();
  }
});
els.customEnergy.addEventListener("change", () => {
  if (isCustomMode()) {
    refreshCustomObservation();
  }
});
els.customTimeOfDay.addEventListener("change", () => {
  if (isCustomMode()) {
    refreshCustomObservation();
  }
});
els.customExamWeek.addEventListener("change", () => {
  if (isCustomMode()) {
    refreshCustomObservation();
  }
});

updateModeUI();const els = {
  mode: document.getElementById("mode"),
  scenario: document.getElementById("scenario"),
  customConfig: document.getElementById("customConfig"),
  customHours: document.getElementById("customHours"),
  customEnergy: document.getElementById("customEnergy"),
  customTimeOfDay: document.getElementById("customTimeOfDay"),
  customExamWeek: document.getElementById("customExamWeek"),
  resetBtn: document.getElementById("resetBtn"),
  addTaskBtn: document.getElementById("addTaskBtn"),
  clearTasksBtn: document.getElementById("clearTasksBtn"),
  autofillBtn: document.getElementById("autofillBtn"),
  runStepBtn: document.getElementById("runStepBtn"),
  status: document.getElementById("status"),
  taskComposer: document.getElementById("taskComposer"),
  newTaskTitle: document.getElementById("newTaskTitle"),
  newTaskDeadline: document.getElementById("newTaskDeadline"),
  newTaskDifficulty: document.getElementById("newTaskDifficulty"),
  newTaskEstimated: document.getElementById("newTaskEstimated"),
  newTaskImportance: document.getElementById("newTaskImportance"),
  taskList: document.getElementById("taskList"),
  availableHours: document.getElementById("availableHours"),
  energyLevel: document.getElementById("energyLevel"),
  timeOfDay: document.getElementById("timeOfDay"),
  examWeek: document.getElementById("examWeek"),
  actionPayload: document.getElementById("actionPayload"),
  stepResponse: document.getElementById("stepResponse"),
};

const state = {
  observation: null,
  customTasks: [],
  nextTaskId: 1,
};

function setStatus(text, isError = false) {
  els.status.textContent = `Status: ${text}`;
  els.status.classList.toggle("error", isError);
}

function formatJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

function isCustomMode() {
  return els.mode.value === "custom";
}

function escapeHTML(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getCustomContext() {
  const availableHours = Number(els.customHours.value);
  if (!Number.isFinite(availableHours) || availableHours <= 0 || availableHours > 24) {
    throw new Error("Available hours must be between 1 and 24.");
  }

  return {
    available_hours: availableHours,
    energy_level: els.customEnergy.value,
    time_of_day: els.customTimeOfDay.value,
    exam_week: els.customExamWeek.value === "true",
  };
}

function updateModeUI() {
  const custom = isCustomMode();
  els.scenario.disabled = custom;
  els.customConfig.classList.toggle("hidden", !custom);
  els.taskComposer.classList.toggle("hidden", !custom);
  els.addTaskBtn.classList.toggle("hidden", !custom);
  els.clearTasksBtn.classList.toggle("hidden", !custom);

  if (custom) {
    els.resetBtn.textContent = "Load Custom Episode";
    if (!state.customTasks.length) {
      seedDefaultCustomTasks();
    }
    refreshCustomObservation();
    setStatus("custom mode active, add tasks and load episode");
  } else {
    els.resetBtn.textContent = "Reset Episode";
    els.taskList.innerHTML = "";
    state.observation = null;
    els.autofillBtn.disabled = true;
    els.runStepBtn.disabled = true;
    setStatus("scenario mode active, reset to fetch scenario");
  }
}

function seedDefaultCustomTasks() {
  state.customTasks = [
    { id: state.nextTaskId++, title: "Math Quiz Prep", deadline_hours: 8, difficulty: 3, estimated_time: 3, importance: 4 },
    { id: state.nextTaskId++, title: "AI Assignment", deadline_hours: 20, difficulty: 5, estimated_time: 6, importance: 5 },
  ];
}

function refreshCustomObservation() {
  const context = getCustomContext();
  const observation = {
    tasks: state.customTasks,
    available_hours: context.available_hours,
    energy_level: context.energy_level,
    time_of_day: context.time_of_day,
    exam_week: context.exam_week,
    done: false,
    reward: null,
  };
  state.observation = observation;
  updateMeta(observation);
  renderTasks(observation);
  els.stepResponse.textContent = formatJSON(observation);
  els.autofillBtn.disabled = !state.customTasks.length;
  els.runStepBtn.disabled = !state.customTasks.length;
}

function updateMeta(observation) {
  els.availableHours.textContent = observation.available_hours;
  els.energyLevel.textContent = observation.energy_level;
  els.timeOfDay.textContent = observation.time_of_day;
  els.examWeek.textContent = observation.exam_week ? "yes" : "no";
}

function renderTasks(observation) {
  els.taskList.innerHTML = "";

  if (!observation.tasks.length) {
    els.taskList.innerHTML = '<article class="task-card"><div class="kv">No tasks yet. Add tasks in Task Composer.</div></article>';
    return;
  }

  observation.tasks.forEach((task) => {
    const card = document.createElement("article");
    card.className = "task-card";

    const removeBtn = isCustomMode()
      ? `<button class="btn btn-secondary" data-remove-task="${task.id}">Remove</button>`
      : "";

    card.innerHTML = `
      <div class="task-header">
        <h3 class="task-title">${escapeHTML(task.title)}</h3>
        <div>
          <span class="badge">ID ${task.id}</span>
          ${removeBtn}
        </div>
      </div>
      <div class="task-grid">
        <div class="kv">Deadline: ${task.deadline_hours}h</div>
        <div class="kv">Difficulty: ${task.difficulty}/5</div>
        <div class="kv">Est. Time: ${task.estimated_time}h</div>
        <div class="kv">Importance: ${task.importance}/5</div>
      </div>
      <div class="task-controls">
        <label>
          <input type="checkbox" data-task-select="${task.id}">
          Select task
        </label>
        <label>
          Hours:
          <input type="number" min="1" step="1" data-task-hours="${task.id}" disabled value="${task.estimated_time}">
        </label>
      </div>
    `;

    const selectEl = card.querySelector(`[data-task-select="${task.id}"]`);
    const hoursEl = card.querySelector(`[data-task-hours="${task.id}"]`);

    selectEl.addEventListener("change", () => {
      hoursEl.disabled = !selectEl.checked;
    });

    const removeEl = card.querySelector(`[data-remove-task="${task.id}"]`);
    if (removeEl) {
      removeEl.addEventListener("click", () => {
        state.customTasks = state.customTasks.filter((t) => t.id !== task.id);
        refreshCustomObservation();
        setStatus("task removed from custom episode");
      });
    }

    els.taskList.appendChild(card);
  });
}

function collectAction() {
  const selectedTaskIds = [];
  const timeAllocation = {};

  const selectEls = document.querySelectorAll("[data-task-select]");
  selectEls.forEach((checkbox) => {
    const taskId = Number(checkbox.getAttribute("data-task-select"));
    if (!checkbox.checked) {
      return;
    }

    const hoursEl = document.querySelector(`[data-task-hours="${taskId}"]`);
    const hours = Number(hoursEl.value);
    if (!Number.isFinite(hours) || hours <= 0) {
      throw new Error(`Invalid hour allocation for task ${taskId}`);
    }

    selectedTaskIds.push(taskId);
    timeAllocation[String(taskId)] = hours;
  });

  if (selectedTaskIds.length === 0) {
    throw new Error("Please select at least one task.");
  }

  return {
    selected_task_ids: selectedTaskIds,
    time_allocation: timeAllocation,
  };
}

function autofillRecommended() {
  if (!state.observation) {
    return;
  }

  const tasks = [...state.observation.tasks]
    .sort((a, b) => (b.importance * 10 - b.deadline_hours) - (a.importance * 10 - a.deadline_hours));

  let remaining = state.observation.available_hours;

  tasks.forEach((task) => {
    const selectEl = document.querySelector(`[data-task-select="${task.id}"]`);
    const hoursEl = document.querySelector(`[data-task-hours="${task.id}"]`);

    if (remaining <= 0) {
      selectEl.checked = false;
      hoursEl.disabled = true;
      return;
    }

    const allocated = Math.min(task.estimated_time, remaining);
    if (allocated > 0) {
      selectEl.checked = true;
      hoursEl.disabled = false;
      hoursEl.value = allocated;
      remaining -= allocated;
    }
  });
}

async function resetEpisode() {
  els.resetBtn.disabled = true;
  setStatus("resetting episode...");

  try {
    if (isCustomMode()) {
      if (!state.customTasks.length) {
        throw new Error("Add at least one custom task first.");
      }
      refreshCustomObservation();
      els.actionPayload.textContent = "{}";
      setStatus(`custom episode ready (${state.customTasks.length} tasks)`);
      return;
    }

    const payload = { scenario_name: els.scenario.value };
    const response = await fetch("/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Reset failed: ${response.status} ${err}`);
    }

    const observation = await response.json();
    state.observation = observation;

    updateMeta(observation);
    renderTasks(observation);

    els.autofillBtn.disabled = false;
    els.runStepBtn.disabled = false;
    els.actionPayload.textContent = "{}";
    els.stepResponse.textContent = formatJSON(observation);

    setStatus(`episode ready (${els.scenario.value})`);
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    els.resetBtn.disabled = false;
  }
}

async function runStep() {
  if (!state.observation) {
    setStatus("reset the episode first", true);
    return;
  }

  els.runStepBtn.disabled = true;
  setStatus("running step...");

  try {
    const action = collectAction();
    const payload = isCustomMode()
      ? {
          context: getCustomContext(),
          tasks: state.customTasks,
          action,
        }
      : { action };

    els.actionPayload.textContent = formatJSON(payload);

    const endpoint = isCustomMode() ? "/simulate/custom" : "/step";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Step failed: ${response.status} ${err}`);
    }

    const result = await response.json();
    els.stepResponse.textContent = formatJSON(result);

    const reward = result.reward ?? result?.metadata?.score ?? "n/a";
    setStatus(`step completed, reward: ${reward}`);
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    els.runStepBtn.disabled = false;
  }
}

function addCustomTask() {
  try {
    const title = els.newTaskTitle.value.trim();
    const deadline = Number(els.newTaskDeadline.value);
    const difficulty = Number(els.newTaskDifficulty.value);
    const estimated = Number(els.newTaskEstimated.value);
    const importance = Number(els.newTaskImportance.value);

    if (!title) {
      throw new Error("Task title is required.");
    }
    if (!Number.isFinite(deadline) || deadline <= 0) {
      throw new Error("Deadline must be > 0.");
    }
    if (!Number.isFinite(difficulty) || difficulty < 1 || difficulty > 5) {
      throw new Error("Difficulty must be between 1 and 5.");
    }
    if (!Number.isFinite(estimated) || estimated <= 0) {
      throw new Error("Estimated time must be > 0.");
    }
    if (!Number.isFinite(importance) || importance < 1 || importance > 5) {
      throw new Error("Importance must be between 1 and 5.");
    }

    state.customTasks.push({
      id: state.nextTaskId++,
      title,
      deadline_hours: Math.trunc(deadline),
      difficulty: Math.trunc(difficulty),
      estimated_time: Math.trunc(estimated),
      importance: Math.trunc(importance),
    });

    els.newTaskTitle.value = "";
    els.newTaskDeadline.value = "";
    els.newTaskDifficulty.value = "";
    els.newTaskEstimated.value = "";
    els.newTaskImportance.value = "";

    refreshCustomObservation();
    setStatus("task added to custom episode");
  } catch (error) {
    setStatus(error.message, true);
  }
}

function clearCustomTasks() {
  state.customTasks = [];
  refreshCustomObservation();
  setStatus("all custom tasks cleared");
}

els.mode.addEventListener("change", updateModeUI);
els.resetBtn.addEventListener("click", resetEpisode);
els.addTaskBtn.addEventListener("click", addCustomTask);
els.clearTasksBtn.addEventListener("click", clearCustomTasks);
els.autofillBtn.addEventListener("click", () => {
  autofillRecommended();
  setStatus("autofill complete, adjust if needed");
});
els.runStepBtn.addEventListener("click", runStep);

els.customHours.addEventListener("change", () => {
  if (isCustomMode()) {
    refreshCustomObservation();
  }
});
els.customEnergy.addEventListener("change", () => {
  if (isCustomMode()) {
    refreshCustomObservation();
  }
});
els.customTimeOfDay.addEventListener("change", () => {
  if (isCustomMode()) {
    refreshCustomObservation();
  }
});
els.customExamWeek.addEventListener("change", () => {
  if (isCustomMode()) {
    refreshCustomObservation();
  }
});

updateModeUI();
