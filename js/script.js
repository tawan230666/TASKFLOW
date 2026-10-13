// TaskFlow: a Kanban board that runs entirely in the browser.
// State lives in `tasks` and is persisted to localStorage after every change.

const STORAGE_KEY = 'taskflow_tasks';
const ID_KEY = 'taskflow_taskid';
const STATUSES = ['todo', 'progress', 'done'];
const PRIORITIES = ['low', 'medium', 'high'];
const PRIORITY_TEXT = { high: 'สูง', medium: 'ปานกลาง', low: 'ต่ำ' };

let tasks = [];
let taskId = 1;

// Task text is user input, so it must never be inserted as raw HTML.
function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Keep only well-formed tasks (used for both localStorage and imported files).
function sanitizeTasks(list) {
    if (!Array.isArray(list)) throw new Error('not an array');
    return list
        .filter(t => t && typeof t.title === 'string' && t.title.trim())
        .map((t, i) => ({
            id: Number.isInteger(t.id) ? t.id : i + 1,
            title: t.title.trim(),
            description: typeof t.description === 'string' ? t.description : '',
            priority: PRIORITIES.includes(t.priority) ? t.priority : 'low',
            status: STATUSES.includes(t.status) ? t.status : 'todo',
            createdAt: new Date(t.createdAt || Date.now()),
        }));
}

function nextId() {
    return tasks.reduce((max, t) => Math.max(max, t.id), 0) + 1;
}

function loadTasks() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) tasks = sanitizeTasks(JSON.parse(saved));
    } catch {
        tasks = [];
    }
    taskId = Math.max(nextId(), parseInt(localStorage.getItem(ID_KEY), 10) || 1);
}

function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    localStorage.setItem(ID_KEY, String(taskId));
}

function refresh() {
    saveTasks();
    renderTasks();
    updateStats();
}

function addTask() {
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDesc').value.trim();
    const priority = document.getElementById('taskPriority').value;

    if (!title) {
        alert('กรุณาใส่ชื่องาน');
        return;
    }

    tasks.push({ id: taskId++, title, description, priority, status: 'todo', createdAt: new Date() });
    clearInputs();
    refresh();
}

function clearInputs() {
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDesc').value = '';
    document.getElementById('taskPriority').value = 'low';
}

function moveTask(id, newStatus) {
    const task = tasks.find(t => t.id === id);
    if (task && STATUSES.includes(newStatus) && task.status !== newStatus) {
        task.status = newStatus;
        refresh();
    }
}

function deleteTask(id) {
    if (confirm('ต้องการลบงานนี้หรือไม่?')) {
        tasks = tasks.filter(t => t.id !== id);
        refresh();
    }
}

const EMPTY_TEXT = {
    todo: 'ไม่มีงานที่ต้องทำ',
    progress: 'ไม่มีงานที่กำลังทำ',
    done: 'ยังไม่มีงานที่เสร็จ',
};

function renderTasks() {
    STATUSES.forEach(status => {
        const container = document.getElementById(`${status}Tasks`);
        const items = tasks.filter(t => t.status === status);
        container.innerHTML = items.length ? '' : `<div class="empty-state">${EMPTY_TEXT[status]}</div>`;
        items.forEach(task => container.appendChild(createTaskElement(task)));
    });
}

function createTaskElement(task) {
    const taskEl = document.createElement('div');
    taskEl.className = `task-item ${task.priority}`;
    taskEl.draggable = true;
    taskEl.dataset.id = task.id;

    let actionButtons;
    if (task.status === 'todo') {
        actionButtons = `<button class="task-btn move-btn" onclick="moveTask(${task.id}, 'progress')">เริ่มทำ</button>`;
    } else if (task.status === 'progress') {
        actionButtons = `
            <button class="task-btn move-btn" onclick="moveTask(${task.id}, 'todo')">ย้ายกลับ</button>
            <button class="task-btn move-btn" onclick="moveTask(${task.id}, 'done')">เสร็จแล้ว</button>`;
    } else {
        actionButtons = `<button class="task-btn move-btn" onclick="moveTask(${task.id}, 'progress')">ทำต่อ</button>`;
    }

    taskEl.innerHTML = `
        <div class="task-header">
            <div class="task-title">${escapeHtml(task.title)}</div>
            <div class="task-priority priority-${task.priority}">${PRIORITY_TEXT[task.priority]}</div>
        </div>
        ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
        <div class="task-actions">
            ${actionButtons}
            <button class="task-btn delete-btn" onclick="deleteTask(${task.id})">ลบ</button>
        </div>`;

    taskEl.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', String(task.id));
        taskEl.classList.add('dragging');
    });
    taskEl.addEventListener('dragend', () => taskEl.classList.remove('dragging'));

    return taskEl;
}

// Drag a card onto any column to change its status.
function setupDragAndDrop() {
    document.querySelectorAll('.task-column').forEach(column => {
        column.addEventListener('dragover', e => {
            e.preventDefault();
            column.classList.add('drag-over');
        });
        column.addEventListener('dragleave', () => column.classList.remove('drag-over'));
        column.addEventListener('drop', e => {
            e.preventDefault();
            column.classList.remove('drag-over');
            moveTask(Number(e.dataTransfer.getData('text/plain')), column.dataset.status);
        });
    });
}

function clearAllData() {
    if (confirm('ต้องการลบข้อมูลทั้งหมดหรือไม่?')) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(ID_KEY);
        tasks = [];
        taskId = 1;
        renderTasks();
        updateStats();
        alert('ล้างข้อมูลเรียบร้อยแล้ว');
    }
}

function exportData() {
    const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `taskflow_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            let imported;
            try {
                imported = sanitizeTasks(JSON.parse(ev.target.result));
            } catch {
                alert('ไฟล์ไม่ถูกต้อง');
                return;
            }
            if (confirm(`พบ ${imported.length} งาน ต้องการแทนที่ข้อมูลปัจจุบันหรือไม่?`)) {
                tasks = imported;
                taskId = nextId();
                refresh();
                alert('นำเข้าข้อมูลเรียบร้อยแล้ว');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function updateStats() {
    STATUSES.forEach(status => {
        const count = tasks.filter(t => t.status === status).length;
        document.getElementById(`${status}Count`).textContent = count;
        document.getElementById(`${status}CountLabel`).textContent = `${count} งาน`;
    });
}

const SAMPLE_TASKS = [
    { title: 'ออกแบบ UI/UX', description: 'ออกแบบหน้าตาเว็บไซต์ให้สวยงาม', priority: 'high', status: 'progress' },
    { title: 'เขียน Code Backend', description: 'พัฒนา API สำหรับระบบ', priority: 'medium', status: 'todo' },
    { title: 'ทดสอบระบบ', description: 'ทดสอบการทำงานของระบบ', priority: 'low', status: 'done' },
];

document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    if (tasks.length === 0) {
        tasks = SAMPLE_TASKS.map(t => ({ ...t, id: taskId++, createdAt: new Date() }));
        saveTasks();
    }
    setupDragAndDrop();
    renderTasks();
    updateStats();

    document.getElementById('taskTitle').addEventListener('keypress', e => {
        if (e.key === 'Enter') addTask();
    });
});
