let tasks = [];
let taskId = 1;

function addTask() {
  const title = document.getElementById("taskTitle").value.trim();
  const description = document.getElementById("taskDesc").value.trim();
  const priority = document.getElementById("taskPriority").value;

  if (!title) {
    alert("กรุณาใส่ชื่องาน");
    return;
  }

  const task = {
    id: taskId++,
    title,
    description,
    priority,
    status: "todo",
    createdAt: new Date(),
  };

  tasks.push(task);
  clearInputs();
  renderTasks();
  updateStats();
}

function clearInputs() {
  document.getElementById("taskTitle").value = "";
  document.getElementById("taskDesc").value = "";
  document.getElementById("taskPriority").value = "low";
}

function moveTask(id, newStatus) {
  const task = tasks.find((t) => t.id === id);
  if (task) {
    task.status = newStatus;
    renderTasks();
    updateStats();
  }
}

function deleteTask(id) {
  if (confirm("ต้องการลบงานนี้หรือไม่?")) {
    tasks = tasks.filter((t) => t.id !== id);
    renderTasks();
    updateStats();
  }
}

function renderTasks() {
  const todoContainer = document.getElementById("todoTasks");
  const progressContainer = document.getElementById("progressTasks");
  const doneContainer = document.getElementById("doneTasks");

  todoContainer.innerHTML = "";
  progressContainer.innerHTML = "";
  doneContainer.innerHTML = "";

  const todoTasks = tasks.filter((t) => t.status === "todo");
  const progressTasks = tasks.filter((t) => t.status === "progress");
  const doneTasks = tasks.filter((t) => t.status === "done");

  if (todoTasks.length === 0) {
    todoContainer.innerHTML =
      '<div class="empty-state">ไม่มีงานที่ต้องทำ</div>';
  }
  if (progressTasks.length === 0) {
    progressContainer.innerHTML =
      '<div class="empty-state">ไม่มีงานที่กำลังทำ</div>';
  }
  if (doneTasks.length === 0) {
    doneContainer.innerHTML =
      '<div class="empty-state">ยังไม่มีงานที่เสร็จ</div>';
  }

  todoTasks.forEach((task) =>
    todoContainer.appendChild(createTaskElement(task))
  );
  progressTasks.forEach((task) =>
    progressContainer.appendChild(createTaskElement(task))
  );
  doneTasks.forEach((task) =>
    doneContainer.appendChild(createTaskElement(task))
  );
}

function createTaskElement(task) {
  const taskEl = document.createElement("div");
  taskEl.className = `task-item ${task.priority}`;

  const priorityText = {
    high: "สูง",
    medium: "ปานกลาง",
    low: "ต่ำ",
  };

  const priorityClass = `priority-${task.priority}`;

  let actionButtons = "";

  if (task.status === "todo") {
    actionButtons = `<button class="task-btn move-btn" onclick="moveTask(${task.id}, 'progress')">เริ่มทำ</button>`;
  } else if (task.status === "progress") {
    actionButtons = `
                    <button class="task-btn move-btn" onclick="moveTask(${task.id}, 'todo')">ย้ายกลับ</button>
                    <button class="task-btn move-btn" onclick="moveTask(${task.id}, 'done')">เสร็จแล้ว</button>
                `;
  } else {
    actionButtons = `<button class="task-btn move-btn" onclick="moveTask(${task.id}, 'progress')">ทำต่อ</button>`;
  }

  taskEl.innerHTML = `
                <div class="task-header">
                    <div class="task-title">${task.title}</div>
                    <div class="task-priority ${priorityClass}">${
    priorityText[task.priority]
  }</div>
                </div>
                ${
                  task.description
                    ? `<div class="task-description">${task.description}</div>`
                    : ""
                }
                <div class="task-actions">
                    ${actionButtons}
                    <button class="task-btn delete-btn" onclick="deleteTask(${
                      task.id
                    })">ลบ</button>
                </div>
            `;

  return taskEl;
}

function updateStats() {
  const todoCount = tasks.filter((t) => t.status === "todo").length;
  const progressCount = tasks.filter((t) => t.status === "progress").length;
  const doneCount = tasks.filter((t) => t.status === "done").length;

  document.getElementById("todoCount").textContent = todoCount;
  document.getElementById("progressCount").textContent = progressCount;
  document.getElementById("doneCount").textContent = doneCount;

  document.getElementById("todoCountLabel").textContent = `${todoCount} งาน`;
  document.getElementById(
    "progressCountLabel"
  ).textContent = `${progressCount} งาน`;
  document.getElementById("doneCountLabel").textContent = `${doneCount} งาน`;
}

// เพิ่มงานตัวอย่าง
document.addEventListener("DOMContentLoaded", function () {
  tasks = [
    {
      id: taskId++,
      title: "ออกแบบ UI/UX",
      description: "ออกแบบหน้าตาเว็บไซต์ให้สวยงาม",
      priority: "high",
      status: "progress",
    },
    {
      id: taskId++,
      title: "เขียน Code Backend",
      description: "พัฒนา API สำหรับระบบ",
      priority: "medium",
      status: "todo",
    },
    {
      id: taskId++,
      title: "ทดสอบระบบ",
      description: "ทดสอบการทำงานของระบบ",
      priority: "low",
      status: "done",
    },
  ];
  renderTasks();
  updateStats();
});

// กด Enter เพื่อเพิ่มงาน
document.getElementById("taskTitle").addEventListener("keypress", function (e) {
  if (e.key === "Enter") addTask();
});
