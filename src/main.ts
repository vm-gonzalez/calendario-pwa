import "./style.css";
import { db, type Task } from "./db/database";

let currentDate = new Date();

const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre"
];

const dayNames = [
    "Lun",
    "Mar",
    "Mié",
    "Jue",
    "Vie",
    "Sáb",
    "Dom"
];

const taskColors = [
    "#ef4444",
    "#f97316",
    "#eab308",
    "#22c55e",
    "#3b82f6",
    "#8b5cf6"
];

function formatDate(
    year: number,
    month: number,
    day: number
): string {
    const monthString = String(month + 1).padStart(2, "0");
    const dayString = String(day).padStart(2, "0");

    return `${year}-${monthString}-${dayString}`;
}

function formatDisplayDate(date: string): string {
    const [year, month, day] = date.split("-");

    return `${day}/${month}/${year}`;
}

function getStatusLabel(
    status: Task["status"]
): string {
    switch (status) {
        case "pending":
            return "Pendiente";

        case "doing":
            return "En proceso";

        case "done":
            return "Completada";
    }
}

function getNextStatus(
    status: Task["status"]
): Task["status"] {
    switch (status) {
        case "pending":
            return "doing";

        case "doing":
            return "done";

        case "done":
            return "pending";
    }
}

function getStatusSymbol(
    status: Task["status"]
): string {
    switch (status) {
        case "pending":
            return "🟡";

        case "doing":
            return "🔵";

        case "done":
            return "🟢";
    }
}

async function renderCalendar(): Promise<void> {

    const app =
        document.querySelector<HTMLDivElement>("#app");

    if (!app) {
        throw new Error("No se encontró el elemento #app");
    }

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDay = (firstDay.getDay() + 6) % 7;
    const totalDays = lastDay.getDate();

    const tasks = await db.tasks.toArray();

    app.innerHTML = `
        <main class="calendar-container">

            <header class="calendar-header">

                <button
                    id="previous-month"
                    type="button"
                    aria-label="Mes anterior"
                >
                    ‹
                </button>

                <h1>
                    ${monthNames[month]} ${year}
                </h1>

                <button
                    id="next-month"
                    type="button"
                    aria-label="Mes siguiente"
                >
                    ›
                </button>

            </header>

            <section class="calendar">

                <div class="weekdays">

                    ${dayNames
                        .map(day => `
                            <div class="weekday">
                                ${day}
                            </div>
                        `)
                        .join("")}

                </div>

                <div class="days">

                    ${createDays(
                        startDay,
                        totalDays,
                        year,
                        month,
                        tasks
                    )}

                </div>

            </section>

        </main>

        <!-- MODAL NUEVA TAREA -->
        <div
            id="task-modal"
            class="modal hidden"
        >
            <div class="modal-content">

                <button
                    id="close-modal"
                    class="close-button"
                    type="button"
                    aria-label="Cerrar"
                >
                    ×
                </button>

                <h2>Nueva tarea</h2>

                <form id="task-form">

                    <label for="task-title">
                        Título
                    </label>

                    <input
                        id="task-title"
                        type="text"
                        required
                        placeholder="Ej. Estudiar cálculo"
                    />

                    <label for="task-description">
                        Descripción
                    </label>

                    <textarea
                        id="task-description"
                        placeholder="Detalles de la tarea..."
                    ></textarea>

                    <label for="task-date">
                        Fecha
                    </label>

                    <input
                        id="task-date"
                        type="date"
                        required
                    />

                    <label>
                        Color
                    </label>

                    <div class="color-picker">

                        ${taskColors
                            .map((color, index) => `
                                <label class="color-option">

                                    <input
                                        type="radio"
                                        name="task-color"
                                        value="${color}"
                                        ${index === 5
                                            ? "checked"
                                            : ""}
                                    />

                                    <span
                                        class="color-circle"
                                        style="background-color: ${color}"
                                    ></span>

                                </label>
                            `)
                            .join("")}

                    </div>

                    <button
                        type="submit"
                        class="save-button"
                    >
                        Guardar tarea
                    </button>

                </form>

            </div>
        </div>

        <!-- MODAL DETALLES -->
        <div
            id="details-modal"
            class="modal hidden"
        >
            <div class="modal-content details-content">

                <button
                    id="close-details-modal"
                    class="close-button"
                    type="button"
                    aria-label="Cerrar"
                >
                    ×
                </button>

                <div
                    id="task-details"
                    class="task-details"
                ></div>

            </div>
        </div>
    `;

    setupCalendarEvents();
}

function createDays(
    startDay: number,
    totalDays: number,
    year: number,
    month: number,
    tasks: Task[]
): string {
    let html = "";

    for (let i = 0; i < startDay; i++) {
        html += `
            <div class="day empty"></div>
        `;
    }

    for (let day = 1; day <= totalDays; day++) {
        const date = formatDate(year, month, day);

        const dayTasks = tasks.filter(
            task => task.date === date
        );

        const today = new Date();

        const isToday =
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear();

        html += `
            <div
                class="day ${isToday ? "today" : ""}"
                data-date="${date}"
            >

                <span class="day-number">
                    ${day}
                </span>

                <div class="day-tasks">

                    ${dayTasks
                        .map(task => createTaskHTML(task))
                        .join("")}

                </div>

            </div>
        `;
    }

    return html;
}

function createTaskHTML(task: Task): string {
    const isCompleted =
        task.status === "done";

    return `
        <div
            class="
                task-preview
                ${isCompleted ? "task-completed" : ""}
            "
            style="border-left-color: ${task.color}"
            data-task-id="${task.id}"
        >

            <span
                class="task-title"
                title="${escapeHtml(task.title)}"
            >
                ${escapeHtml(task.title)}
            </span>

            <button
                type="button"
                class="task-status-button"
                data-task-id="${task.id}"
                title="${getStatusLabel(task.status)}"
                aria-label="${getStatusLabel(task.status)}"
            >
                ${getStatusSymbol(task.status)}
            </button>

        </div>
    `;
}

function setupCalendarEvents(): void {
    document
        .querySelector<HTMLButtonElement>(
            "#previous-month"
        )
        ?.addEventListener(
            "click",
            async () => {
                currentDate.setMonth(
                    currentDate.getMonth() - 1
                );

                await renderCalendar();
            }
        );

    document
        .querySelector<HTMLButtonElement>(
            "#next-month"
        )
        ?.addEventListener(
            "click",
            async () => {
                currentDate.setMonth(
                    currentDate.getMonth() + 1
                );

                await renderCalendar();
            }
        );

    /*
     * Clic en una tarea.
     */
    document
        .querySelectorAll<HTMLDivElement>(
            ".task-preview"
        )
        .forEach(taskElement => {
            taskElement.addEventListener(
                "click",
                event => {
                    const target =
                        event.target as HTMLElement;

                    /*
                     * Si se hizo clic en el botón
                     * del estado, no abrimos detalles.
                     */
                    if (
                        target.closest(
                            ".task-status-button"
                        )
                    ) {
                        return;
                    }

                    const taskId = Number(
                        taskElement.dataset.taskId
                    );

                    if (!taskId) {
                        return;
                    }

                    openTaskDetails(taskId);
                }
            );
        });

    /*
     * Clic en el día para crear tarea.
     */
    document
        .querySelectorAll<HTMLDivElement>(
            ".day:not(.empty)"
        )
        .forEach(dayElement => {
            dayElement.addEventListener(
                "click",
                event => {
                    const target =
                        event.target as HTMLElement;

                    /*
                     * Si el clic fue sobre una tarea,
                     * dejamos que la tarea maneje el clic.
                     */
                    if (
                        target.closest(
                            ".task-preview"
                        )
                    ) {
                        return;
                    }

                    const date =
                        dayElement.dataset.date;

                    if (!date) {
                        return;
                    }

                    openTaskModal(date);
                }
            );
        });

    /*
     * Botones de estado.
     */
    document
        .querySelectorAll<HTMLButtonElement>(
            ".task-status-button"
        )
        .forEach(statusButton => {
            statusButton.addEventListener(
                "click",
                async event => {
                    event.stopPropagation();

                    const taskId = Number(
                        statusButton.dataset.taskId
                    );

                    if (!taskId) {
                        return;
                    }

                    await changeTaskStatus(taskId);
                }
            );
        });

    /*
     * Cerrar modal de nueva tarea.
     */
    document
        .querySelector<HTMLButtonElement>(
            "#close-modal"
        )
        ?.addEventListener(
            "click",
            closeTaskModal
        );

    /*
     * Cerrar modal de detalles.
     */
    document
        .querySelector<HTMLButtonElement>(
            "#close-details-modal"
        )
        ?.addEventListener(
            "click",
            closeTaskDetails
        );

    /*
     * Cerrar modal de nueva tarea
     * haciendo clic fuera.
     */
    document
        .querySelector<HTMLDivElement>(
            "#task-modal"
        )
        ?.addEventListener(
            "click",
            event => {
                if (
                    event.target ===
                    event.currentTarget
                ) {
                    closeTaskModal();
                }
            }
        );

    /*
     * Cerrar modal de detalles
     * haciendo clic fuera.
     */
    document
        .querySelector<HTMLDivElement>(
            "#details-modal"
        )
        ?.addEventListener(
            "click",
            event => {
                if (
                    event.target ===
                    event.currentTarget
                ) {
                    closeTaskDetails();
                }
            }
        );

    /*
     * Guardar nueva tarea.
     */
    document
        .querySelector<HTMLFormElement>(
            "#task-form"
        )
        ?.addEventListener(
            "submit",
            saveTask
        );
}

async function openTaskDetails(
    taskId: number
): Promise<void> {
    const task = await db.tasks.get(taskId);

    if (!task) {
        return;
    }

    const modal =
        document.querySelector<HTMLDivElement>(
            "#details-modal"
        );

    const details =
        document.querySelector<HTMLDivElement>(
            "#task-details"
        );

    if (!modal || !details) {
        return;
    }

    details.innerHTML = `
        <div
            class="details-color"
            style="background-color: ${task.color}"
        ></div>

        <h2 class="details-title">
            ${escapeHtml(task.title)}
        </h2>

        <div class="details-info">

            <div class="detail-row">

                <span class="detail-label">
                    📅 Fecha
                </span>

                <span class="detail-value">
                    ${formatDisplayDate(task.date)}
                </span>

            </div>

            <div class="detail-row">

                <span class="detail-label">
                    Estado
                </span>

                <span class="detail-value">
                    ${getStatusSymbol(task.status)}
                    ${getStatusLabel(task.status)}
                </span>

            </div>

        </div>

        <div class="details-description">

            <h3>
                Descripción
            </h3>

            <p>
                ${
                    task.description
                        ? escapeHtml(task.description)
                        : "Esta tarea no tiene descripción."
                }
            </p>

        </div>

        <button
            id="delete-task-button"
            class="delete-button"
            type="button"
            data-task-id="${task.id}"
        >
            Eliminar tarea
        </button>
    `;

    modal.classList.remove("hidden");

    document
        .querySelector<HTMLButtonElement>(
            "#delete-task-button"
        )
        ?.addEventListener(
            "click",
            async () => {
                await deleteTask(task.id);
            }
        );
}

function closeTaskDetails(): void {
    const modal =
        document.querySelector<HTMLDivElement>(
            "#details-modal"
        );

    if (!modal) {
        return;
    }

    modal.classList.add("hidden");
}

async function deleteTask(
    taskId: number | undefined
): Promise<void> {
    if (!taskId) {
        return;
    }

    const confirmed = window.confirm(
        "¿Seguro que quieres eliminar esta tarea?"
    );

    if (!confirmed) {
        return;
    }

    await db.tasks.delete(taskId);

    closeTaskDetails();

    await renderCalendar();
}

async function changeTaskStatus(
    taskId: number
): Promise<void> {
    const task = await db.tasks.get(taskId);

    if (!task) {
        return;
    }

    const newStatus =
        getNextStatus(task.status);

    await db.tasks.update(
        taskId,
        {
            status: newStatus
        }
    );

    await renderCalendar();
}

function openTaskModal(
    date: string
): void {
    const modal =
        document.querySelector<HTMLDivElement>(
            "#task-modal"
        );

    const dateInput =
        document.querySelector<HTMLInputElement>(
            "#task-date"
        );

    if (!modal || !dateInput) {
        return;
    }

    dateInput.value = date;

    modal.classList.remove("hidden");
}

function closeTaskModal(): void {
    const modal =
        document.querySelector<HTMLDivElement>(
            "#task-modal"
        );

    const form =
        document.querySelector<HTMLFormElement>(
            "#task-form"
        );

    if (!modal || !form) {
        return;
    }

    modal.classList.add("hidden");

    form.reset();
}

async function saveTask(
    event: SubmitEvent
): Promise<void> {
    event.preventDefault();

    const titleInput =
        document.querySelector<HTMLInputElement>(
            "#task-title"
        );

    const descriptionInput =
        document.querySelector<HTMLTextAreaElement>(
            "#task-description"
        );

    const dateInput =
        document.querySelector<HTMLInputElement>(
            "#task-date"
        );

    const colorInput =
        document.querySelector<HTMLInputElement>(
            'input[name="task-color"]:checked'
        );

    if (
        !titleInput ||
        !descriptionInput ||
        !dateInput ||
        !colorInput
    ) {
        return;
    }

    const title =
        titleInput.value.trim();

    const description =
        descriptionInput.value.trim();

    const date =
        dateInput.value;

    const color =
        colorInput.value;

    if (!title || !date) {
        return;
    }

    const task: Task = {
        title,
        description,
        date,
        color,
        status: "pending",
        reminder: false,
        createdAt:
            new Date().toISOString()
    };

    await db.tasks.add(task);

    closeTaskModal();

    await renderCalendar();
}

function escapeHtml(
    text: string
): string {
    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}

renderCalendar();